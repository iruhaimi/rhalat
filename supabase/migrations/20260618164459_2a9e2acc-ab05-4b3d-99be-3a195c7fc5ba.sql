
-- 1. Fix insecure service_role checks on security_audit_log and staff_recovery_codes
DROP POLICY IF EXISTS "Only service role can insert security logs" ON public.security_audit_log;
CREATE POLICY "Only service role can insert security logs"
  ON public.security_audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Only service role can insert recovery codes" ON public.staff_recovery_codes;
CREATE POLICY "Only service role can insert recovery codes"
  ON public.staff_recovery_codes
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 2. Restrict wallet_transactions INSERT to service_role only (trigger-only mutation invariant)
DROP POLICY IF EXISTS "Only admins can insert wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Only service role can insert wallet transactions"
  ON public.wallet_transactions
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- 3. Restrict user_roles INSERT to super-admins (manage_staff) only, to prevent admin->admin escalation
DROP POLICY IF EXISTS "Admins can insert any role" ON public.user_roles;
CREATE POLICY "Super admins can insert any role"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_permission(auth.uid(), 'manage_staff'));

-- 4. Restrict tour_operators self-insert: require explicit tour_operator role (admin-granted)
DROP POLICY IF EXISTS "New operators can insert own profile" ON public.tour_operators;
CREATE POLICY "Tour operators can insert own profile"
  ON public.tour_operators
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND public.has_role(auth.uid(), 'tour_operator')
  );
