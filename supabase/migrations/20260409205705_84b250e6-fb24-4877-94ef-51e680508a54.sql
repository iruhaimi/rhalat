-- Drop the old permissive SELECT policy
DROP POLICY IF EXISTS "Anyone can view active operators" ON public.tour_operators;

-- Authenticated users can view all active operator details
CREATE POLICY "Authenticated users can view active operators"
ON public.tour_operators
FOR SELECT
TO authenticated
USING ((is_active = true) OR is_admin(auth.uid()) OR (user_id = auth.uid()));

-- Create a secure view for public (anonymous) access that excludes contact info
CREATE OR REPLACE VIEW public.tour_operators_public
WITH (security_invoker = true)
AS
SELECT 
  id,
  company_name,
  company_name_en,
  description,
  description_en,
  logo_url,
  cover_image_url,
  country,
  city,
  website,
  is_active,
  is_verified,
  created_at,
  updated_at
FROM public.tour_operators
WHERE is_active = true;

-- Grant anonymous access to the public view
GRANT SELECT ON public.tour_operators_public TO anon;
GRANT SELECT ON public.tour_operators_public TO authenticated;