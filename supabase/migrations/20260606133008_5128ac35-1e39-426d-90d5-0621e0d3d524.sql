-- Fix 1: Restrict tour_operators INSERT to authenticated users (not anon), and ensure user_id is set
DROP POLICY IF EXISTS "New operators can insert own profile" ON public.tour_operators;
CREATE POLICY "New operators can insert own profile"
ON public.tour_operators
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid() AND auth.uid() IS NOT NULL);

-- Fix 2: Tighten tour_bookings INSERT to require operator_id references an existing, active tour operator
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
  )
);