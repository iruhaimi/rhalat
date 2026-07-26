-- Grant SELECT on the public view and tour_programs to anon/authenticated
GRANT SELECT ON public.tour_operators_public TO anon, authenticated;
GRANT SELECT ON public.tour_programs TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.tour_programs TO authenticated;
GRANT ALL ON public.tour_programs TO service_role;
GRANT ALL ON public.tour_operators TO service_role;
GRANT INSERT, UPDATE, DELETE ON public.tour_operators TO authenticated;

-- Column-scoped SELECT on the base table (needed because view uses security_invoker=true)
GRANT SELECT (
  id, company_name, company_name_en, description, description_en,
  logo_url, cover_image_url, website, city, country,
  is_verified, is_active, created_at
) ON public.tour_operators TO anon, authenticated;
