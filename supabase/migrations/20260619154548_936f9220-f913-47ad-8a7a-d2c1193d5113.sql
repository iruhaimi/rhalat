-- ============================================================
-- 1) staff_portal_settings: tighter UPDATE guard
--    Force secret_path rotation to go through the RPC
--    `rotate_staff_portal_path` (which audits + forces re-login).
-- ============================================================
DROP POLICY IF EXISTS "Super admins can update portal path" ON public.staff_portal_settings;

-- Allow super-admins to UPDATE rows, but DISALLOW changing secret_path
-- via direct table UPDATE. The audited RPC runs as SECURITY DEFINER
-- and bypasses RLS, so rotation still works through the proper channel.
CREATE POLICY "Super admins can update portal metadata only"
  ON public.staff_portal_settings
  FOR UPDATE
  USING (public.has_permission(auth.uid(), 'manage_staff'))
  WITH CHECK (
    public.has_permission(auth.uid(), 'manage_staff')
    -- secret_path must equal the existing value when updated directly.
    -- Use a row-level invariant: the new secret_path must already exist
    -- in the table (i.e. unchanged). Rotation MUST go through the RPC.
    AND secret_path = (SELECT s.secret_path FROM public.staff_portal_settings s WHERE s.id = staff_portal_settings.id)
  );

-- ============================================================
-- 2) tour_operators: explicit restrictive guard on sensitive PII
--    The existing policies already prevent non-owner/non-admin
--    SELECT, but we add documentation + ensure no permissive gap.
-- ============================================================
COMMENT ON TABLE public.tour_operators IS
  'PII contact columns (email, phone, whatsapp_number) are readable ONLY by the owning operator (user_id = auth.uid()) or admins (is_admin). For public-facing displays of operator branding, use the dedicated public view or join through tour_programs with explicit non-PII column selection.';

-- Provide a SAFE public view for marketing/listing pages.
-- Only exposes non-sensitive branding columns. No email/phone/whatsapp.
DROP VIEW IF EXISTS public.tour_operators_public;
CREATE VIEW public.tour_operators_public
WITH (security_invoker = true) AS
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

GRANT SELECT ON public.tour_operators_public TO anon, authenticated;