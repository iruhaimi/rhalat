-- Revert view to security_invoker (linter-safe) and instead grant column-scoped
-- SELECT on the base table for anon. This exposes only the non-PII columns
-- already shown in tour_operators_public, while blocking email/phone/whatsapp/address.

ALTER VIEW public.tour_operators_public SET (security_invoker = true);

-- Restore the row-level policy (needed because RLS is enabled on the table).
DROP POLICY IF EXISTS "Public can view verified active operators" ON public.tour_operators;
CREATE POLICY "Public can view verified active operators"
  ON public.tour_operators
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true AND is_verified = true);

-- Column-scoped grant: anon can only read non-PII columns.
REVOKE SELECT ON public.tour_operators FROM anon;
GRANT SELECT (
  id, company_name, company_name_en, description, description_en,
  logo_url, cover_image_url, website, city, country,
  is_verified, is_active, created_at
) ON public.tour_operators TO anon;

-- View grant (harmless; view uses invoker's privileges).
GRANT SELECT ON public.tour_operators_public TO anon, authenticated;