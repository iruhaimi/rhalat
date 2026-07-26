-- ============================================================
-- 1) tour_operators — column-level protection for authenticated
-- ============================================================
REVOKE SELECT ON public.tour_operators FROM PUBLIC;
REVOKE SELECT ON public.tour_operators FROM authenticated;
REVOKE SELECT ON public.tour_operators FROM anon;

-- Public/safe columns available to any signed-in user (and anon via existing policy)
GRANT SELECT (
  id, company_name, company_name_en, description, description_en,
  logo_url, cover_image_url, website, city, country,
  is_verified, is_active, created_at
) ON public.tour_operators TO authenticated;

GRANT SELECT (
  id, company_name, company_name_en, description, description_en,
  logo_url, cover_image_url, website, city, country,
  is_verified, is_active, created_at
) ON public.tour_operators TO anon;

GRANT ALL ON public.tour_operators TO service_role;

-- Admin RPC to fetch full rows (SECURITY DEFINER bypasses column grants)
CREATE OR REPLACE FUNCTION public.admin_list_tour_operators()
RETURNS SETOF public.tour_operators
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'access_denied';
  END IF;
  RETURN QUERY SELECT * FROM public.tour_operators ORDER BY created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_list_tour_operators() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_list_tour_operators() TO authenticated;

-- ============================================================
-- 2) tour_bookings — require active + verified operator
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create own bookings" ON public.tour_bookings;
CREATE POLICY "Authenticated users can create own bookings"
ON public.tour_bookings
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.tour_operators o
    WHERE o.id = tour_bookings.operator_id
      AND o.is_active = true
      AND o.is_verified = true
  )
);

-- ============================================================
-- 3) staff_portal_settings — trigger-based secret_path lock
-- ============================================================
CREATE OR REPLACE FUNCTION public.protect_staff_portal_secret_path()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.secret_path IS DISTINCT FROM OLD.secret_path THEN
    IF COALESCE(current_setting('app.rotating_portal', true), '') <> 'on' THEN
      RAISE EXCEPTION 'secret_path is immutable; use rotate_staff_portal_path()';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_staff_portal_secret_path ON public.staff_portal_settings;
CREATE TRIGGER trg_protect_staff_portal_secret_path
BEFORE UPDATE ON public.staff_portal_settings
FOR EACH ROW EXECUTE FUNCTION public.protect_staff_portal_secret_path();

-- Rewrite rotate_staff_portal_path to flip the session flag while it updates
CREATE OR REPLACE FUNCTION public.rotate_staff_portal_path(p_new_path text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_path text;
  v_clean_path text;
BEGIN
  IF NOT public.has_permission(auth.uid(), 'manage_staff') THEN
    RAISE EXCEPTION 'access_denied';
  END IF;

  v_clean_path := lower(regexp_replace(p_new_path, '[^a-z0-9-]', '', 'g'));
  IF length(v_clean_path) < 8 OR length(v_clean_path) > 40 THEN
    RAISE EXCEPTION 'invalid_path_length';
  END IF;

  SELECT secret_path INTO v_old_path FROM public.staff_portal_settings WHERE id = 1;

  -- Allow the trigger to accept this transaction's secret_path change
  PERFORM set_config('app.rotating_portal', 'on', true);

  UPDATE public.staff_portal_settings
  SET secret_path = v_clean_path,
      rotated_at = now(),
      rotated_by = auth.uid()
  WHERE id = 1;

  -- Force all staff to re-login
  UPDATE public.profiles p
  SET force_logout_after = now()
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.user_id AND ur.role IN ('admin','agent')
  );

  PERFORM public.log_staff_action(
    'portal_rotated',
    'تم تدوير المسار السري لبوابة الموظفين',
    'security',
    'staff_portal_settings',
    '1',
    jsonb_build_object('old_path', v_old_path, 'new_path', v_clean_path)
  );

  RETURN jsonb_build_object('success', true, 'new_path', v_clean_path, 'old_path', v_old_path);
END;
$$;

-- Simplify the UPDATE policy — trigger now enforces immutability
DROP POLICY IF EXISTS "Super admins can update portal metadata only" ON public.staff_portal_settings;
CREATE POLICY "Super admins can update portal metadata only"
ON public.staff_portal_settings
FOR UPDATE
TO authenticated
USING (has_permission(auth.uid(), 'manage_staff'))
WITH CHECK (has_permission(auth.uid(), 'manage_staff'));