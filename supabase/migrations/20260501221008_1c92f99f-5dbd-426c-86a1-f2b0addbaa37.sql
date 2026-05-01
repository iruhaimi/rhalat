
-- 1) Restrict staff_portal_settings reads (remove public read)
DROP POLICY IF EXISTS "Anyone can read portal path" ON public.staff_portal_settings;

CREATE POLICY "Super admins can read portal path"
ON public.staff_portal_settings
FOR SELECT
USING (public.has_permission(auth.uid(), 'manage_staff'));

-- 2) Helper RPC: check candidate path WITHOUT exposing secret
CREATE OR REPLACE FUNCTION public.check_staff_portal_path(p_candidate text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.staff_portal_settings
    WHERE id = 1 AND secret_path = p_candidate
  );
$$;

REVOKE ALL ON FUNCTION public.check_staff_portal_path(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_staff_portal_path(text) TO anon, authenticated;

-- 3) Tighten staff_audit_log INSERT policy (was: any authenticated user)
DROP POLICY IF EXISTS "Authenticated users can insert their own audit" ON public.staff_audit_log;

CREATE POLICY "Service role can insert audit"
ON public.staff_audit_log
FOR INSERT
WITH CHECK (
  ((current_setting('request.jwt.claims', true))::json ->> 'role') = 'service_role'
);
-- Note: regular staff actions are inserted by SECURITY DEFINER function log_staff_action,
-- which bypasses RLS, so this restriction is safe.
