DROP POLICY IF EXISTS "Only admins and service role can insert security logs" ON public.security_audit_log;

CREATE POLICY "Only service role can insert security logs"
  ON public.security_audit_log FOR INSERT
  WITH CHECK (
    ((current_setting('request.jwt.claims'::text, true))::json ->> 'role'::text) = 'service_role'::text
  );