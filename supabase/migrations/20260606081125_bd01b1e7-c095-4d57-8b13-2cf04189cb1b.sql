
-- =====================================================
-- 1. RECOVERY CODES: server-side verification only
-- =====================================================

CREATE OR REPLACE FUNCTION public.verify_staff_recovery_code(p_user_id uuid, p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text;
  v_matched_id uuid;
  v_email text;
BEGIN
  IF p_user_id IS NULL OR p_code IS NULL OR length(trim(p_code)) = 0 THEN
    RETURN false;
  END IF;

  -- Rate limit: max 5 attempts / 15 min
  IF NOT public.check_recovery_rate_limit(p_user_id) THEN
    RAISE EXCEPTION 'rate_limited';
  END IF;

  -- Hash the submitted code (SHA-256 hex) — matches what generate-staff-recovery-codes stores
  v_hash := encode(sha256(convert_to(upper(trim(p_code)), 'UTF8')), 'hex');

  -- Atomically claim a matching unused row
  UPDATE public.staff_recovery_codes
     SET used = true,
         used_at = now()
   WHERE user_id = p_user_id
     AND code_hash = v_hash
     AND used = false
   RETURNING id INTO v_matched_id;

  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;

  IF v_matched_id IS NOT NULL THEN
    IF v_email IS NOT NULL THEN
      PERFORM public.record_login_attempt(v_email, true, 'recovery_code_success', NULL);
      DELETE FROM public.staff_login_attempts
       WHERE email = v_email AND success = false;
    END IF;
    RETURN true;
  END IF;

  IF v_email IS NOT NULL THEN
    PERFORM public.record_login_attempt(v_email, false, 'recovery_code_invalid', NULL);
  END IF;
  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_staff_recovery_code(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_staff_recovery_code(uuid, text) TO authenticated, service_role;

-- Tighten direct table access
DROP POLICY IF EXISTS "Users can verify their own recovery codes" ON public.staff_recovery_codes;
DROP POLICY IF EXISTS "Users can view own recovery codes status" ON public.staff_recovery_codes;

-- Status-only view (no hashes leak)
CREATE OR REPLACE VIEW public.staff_recovery_codes_status
WITH (security_invoker = true) AS
SELECT id, user_id, used, used_at, created_at
FROM public.staff_recovery_codes
WHERE user_id = auth.uid();

GRANT SELECT ON public.staff_recovery_codes_status TO authenticated;

-- =====================================================
-- 2. 2FA: rate limit + audit + revoke anon
-- =====================================================

CREATE OR REPLACE FUNCTION public.verify_staff_2fa(p_user_id uuid, p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_id uuid;
  normalized_code text;
  reversed_code text;
  code_hash text;
  reversed_code_hash text;
  v_email text;
BEGIN
  -- Per-user rate limit (5 attempts / 5 min)
  IF NOT public.check_2fa_rate_limit(p_user_id) THEN
    RAISE EXCEPTION 'rate_limited';
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;

  normalized_code := regexp_replace(
    translate(coalesce(p_code, ''), '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789'),
    '[^0-9]', '', 'g'
  );

  IF length(normalized_code) <> 6 THEN
    IF v_email IS NOT NULL THEN
      PERFORM public.record_login_attempt(v_email, false, '2fa_invalid_format', NULL);
    END IF;
    RETURN false;
  END IF;

  reversed_code := reverse(normalized_code);
  code_hash := encode(sha256(convert_to(normalized_code, 'UTF8')), 'hex');
  reversed_code_hash := encode(sha256(convert_to(reversed_code, 'UTF8')), 'hex');

  SELECT id INTO found_id
  FROM public.staff_2fa_codes
  WHERE user_id = p_user_id
    AND code IN (code_hash, reversed_code_hash)
    AND used = false
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF found_id IS NULL THEN
    IF v_email IS NOT NULL THEN
      PERFORM public.record_login_attempt(v_email, false, '2fa_invalid', NULL);
    END IF;
    RETURN false;
  END IF;

  UPDATE public.staff_2fa_codes SET used = true WHERE id = found_id;

  IF v_email IS NOT NULL THEN
    PERFORM public.record_login_attempt(v_email, true, '2fa_success', NULL);
    DELETE FROM public.staff_login_attempts
     WHERE email = v_email AND success = false;
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_staff_2fa(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_staff_2fa(uuid, text) TO authenticated, service_role;

-- =====================================================
-- 3. Public bucket listing restrictions
-- =====================================================

DROP POLICY IF EXISTS "Authenticated users can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Blog images public read" ON storage.objects;

CREATE POLICY "Users can list own avatar files"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = (auth.uid())::text
);

CREATE POLICY "Admins can list blog images"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'blog-images' AND is_admin(auth.uid())
);
