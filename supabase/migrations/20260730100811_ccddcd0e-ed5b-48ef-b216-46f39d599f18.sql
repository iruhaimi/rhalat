ALTER VIEW public.tour_operators_self SET (security_invoker = false);
GRANT SELECT ON public.tour_operators_self TO authenticated;