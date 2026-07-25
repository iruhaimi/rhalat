-- Close PII leak on public.tour_operators for anon users.
-- The previous migration granted SELECT on the raw table to anon, which exposed
-- email, phone, whatsapp_number, address, admin_notes via PostgREST.
-- Revert to the original design: anon reads go through the safe public view only.

DROP POLICY IF EXISTS "Public can view verified active operators" ON public.tour_operators;
REVOKE SELECT ON public.tour_operators FROM anon;

-- Make the public view work for anon without needing base-table grants.
-- The view already filters is_active AND is_verified, and exposes only
-- non-PII columns, so security_definer is safe here.
ALTER VIEW public.tour_operators_public SET (security_invoker = false);
GRANT SELECT ON public.tour_operators_public TO anon, authenticated;