ALTER VIEW public.tour_operators_self SET (security_invoker = true);

-- Re-allow operators to SELECT their own row from the underlying table so the invoker view returns data
CREATE POLICY "Operators can view own profile"
ON public.tour_operators FOR SELECT
TO authenticated
USING (user_id = auth.uid());
