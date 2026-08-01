-- 1) Restrict clear_failed_login_attempts to staff managers (or self)
CREATE OR REPLACE FUNCTION public.clear_failed_login_attempts(target_email text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF auth.uid() IS NULL THEN
      RAISE EXCEPTION 'access_denied';
    END IF;

    IF NOT (
      public.has_permission(auth.uid(), 'manage_staff')
      OR (SELECT u.email FROM auth.users u WHERE u.id = auth.uid()) = target_email
    ) THEN
      RAISE EXCEPTION 'access_denied';
    END IF;

    DELETE FROM public.staff_login_attempts
    WHERE email = target_email AND success = false;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.clear_failed_login_attempts(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.clear_failed_login_attempts(text) TO authenticated, service_role;

-- 2) Make the public tour operators view respect the querying user's permissions
ALTER VIEW public.tour_operators_public SET (security_invoker = true);

-- Row policy: anyone may read active + verified operators
DROP POLICY IF EXISTS "Public can view active verified operators" ON public.tour_operators;
CREATE POLICY "Public can view active verified operators"
ON public.tour_operators
FOR SELECT
TO anon, authenticated
USING (is_active = true AND is_verified = true);

-- Column-level grants: only non-sensitive columns are readable publicly
GRANT SELECT (
  id, company_name, company_name_en, description, description_en,
  logo_url, cover_image_url, website, city, country,
  is_verified, is_active, created_at
) ON public.tour_operators TO anon, authenticated;

GRANT SELECT ON public.tour_operators_public TO anon, authenticated;
