
-- 1) tour_operators: scope the ALL policy to authenticated admins (not public/anon)
DROP POLICY IF EXISTS "Admins can manage all operators" ON public.tour_operators;
CREATE POLICY "Admins can manage all operators"
  ON public.tour_operators
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));

-- Allow tour operators to read their own row (covers loss of public-role ALL coverage)
DROP POLICY IF EXISTS "Operators can read own profile" ON public.tour_operators;
CREATE POLICY "Operators can read own profile"
  ON public.tour_operators
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Scope the existing self-update policy to authenticated role explicitly
DROP POLICY IF EXISTS "Operators can update own profile" ON public.tour_operators;
CREATE POLICY "Operators can update own profile"
  ON public.tour_operators
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2) user_roles: require manage_staff permission for DELETE & UPDATE
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Super admins can delete roles"
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING (has_permission(auth.uid(), 'manage_staff'));

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Super admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (has_permission(auth.uid(), 'manage_staff'))
  WITH CHECK (has_permission(auth.uid(), 'manage_staff'));

-- 3) staff_recovery_codes: drop the duplicate, weaker INSERT policy
DROP POLICY IF EXISTS "Service role can insert recovery codes" ON public.staff_recovery_codes;
