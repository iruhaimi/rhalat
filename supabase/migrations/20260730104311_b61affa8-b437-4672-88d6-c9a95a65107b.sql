CREATE OR REPLACE FUNCTION public.get_my_tour_operator()
RETURNS SETOF public.tour_operators
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT * FROM public.tour_operators WHERE user_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_tour_operator() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_tour_operator() TO authenticated, service_role;

DROP VIEW IF EXISTS public.tour_operators_self;

CREATE VIEW public.tour_operators_self
WITH (security_invoker = true) AS
SELECT
  id, user_id, company_name, company_name_en, description, description_en,
  logo_url, cover_image_url, whatsapp_number, phone, email, website,
  address, city, country, is_active, is_verified, created_at, updated_at
FROM public.get_my_tour_operator();

GRANT SELECT ON public.tour_operators_self TO authenticated;
GRANT ALL ON public.tour_operators_self TO service_role;