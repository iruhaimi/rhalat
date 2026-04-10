-- Fix: Exclude admin_notes from non-admin authenticated users
-- Replace the current SELECT policy with one that uses security_barrier view

DROP POLICY IF EXISTS "Authenticated users can view active operators" ON public.tour_operators;

-- Authenticated non-admin users can view active operators (but admin_notes is still in the row)
-- We restrict via a secure view instead. Keep base table access for admins and owners only.
CREATE POLICY "Operators can view own profile"
ON public.tour_operators
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Admins already have full access via "Admins can manage all operators" ALL policy

-- Update the public view to be a security_barrier view
DROP VIEW IF EXISTS public.tour_operators_public;
CREATE VIEW public.tour_operators_public WITH (security_barrier = true) AS
SELECT 
  id, company_name, company_name_en, description, description_en,
  logo_url, cover_image_url, country, city, website,
  is_active, is_verified, created_at, updated_at
FROM tour_operators
WHERE is_active = true;

GRANT SELECT ON public.tour_operators_public TO anon, authenticated;