-- Fix: tour_operators_public view uses security_invoker=true, so anon needs
-- a matching SELECT policy on the base table (restricted to public rows only).
CREATE POLICY "Public can view verified active operators"
ON public.tour_operators
FOR SELECT
TO anon, authenticated
USING (is_active = true AND is_verified = true);

-- Grant anon SELECT on the base table (view forwards the privilege check).
GRANT SELECT ON public.tour_operators TO anon;