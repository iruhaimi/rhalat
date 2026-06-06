
CREATE OR REPLACE FUNCTION public.verify_staff_recovery_code(p_user_id uuid, p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_hash text;
  v_normalized text;
  v_matched_id uuid;
  v_email text;
BEGIN
  IF p_user_id IS NULL OR p_code IS NULL OR length(trim(p_code)) = 0 THEN
    RETURN false;
  END IF;

  IF NOT public.check_recovery_rate_limit(p_user_id) THEN
    RAISE EXCEPTION 'rate_limited';
  END IF;

  -- Normalize: strip dashes/whitespace, uppercase (matches edge function hashing)
  v_normalized := upper(regexp_replace(p_code, '[-\s]', '', 'g'));
  v_hash := encode(sha256(convert_to(v_normalized, 'UTF8')), 'hex');

  UPDATE public.staff_recovery_codes
     SET used = true, used_at = now()
   WHERE user_id = p_user_id
     AND code_hash = v_hash
     AND used = false
   RETURNING id INTO v_matched_id;

  SELECT email INTO v_email FROM auth.users WHERE id = p_user_id;

  IF v_matched_id IS NOT NULL THEN
    IF v_email IS NOT NULL THEN
      PERFORM public.record_login_attempt(v_email, true, 'recovery_code_success', NULL);
      DELETE FROM public.staff_login_attempts WHERE email = v_email AND success = false;
    END IF;
    RETURN true;
  END IF;

  IF v_email IS NOT NULL THEN
    PERFORM public.record_login_attempt(v_email, false, 'recovery_code_invalid', NULL);
  END IF;
  RETURN false;
END;
$$;
