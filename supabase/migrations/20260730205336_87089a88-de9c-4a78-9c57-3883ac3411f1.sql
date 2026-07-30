-- Remove the row-level public policy that exposed every column of tour_operators
DROP POLICY IF EXISTS "Public can view verified active operators" ON public.tour_operators;

-- Public marketing view: only non-sensitive columns, bypasses base-table RLS safely
DROP VIEW IF EXISTS public.tour_operators_public;

CREATE VIEW public.tour_operators_public
WITH (security_invoker = false, security_barrier = true) AS
SELECT
  id,
  company_name,
  company_name_en,
  description,
  description_en,
  logo_url,
  cover_image_url,
  website,
  city,
  country,
  is_verified,
  is_active,
  created_at
FROM public.tour_operators
WHERE is_active = true AND is_verified = true;

REVOKE ALL ON public.tour_operators_public FROM anon, authenticated;
GRANT SELECT ON public.tour_operators_public TO anon, authenticated;
GRANT ALL ON public.tour_operators_public TO service_role;