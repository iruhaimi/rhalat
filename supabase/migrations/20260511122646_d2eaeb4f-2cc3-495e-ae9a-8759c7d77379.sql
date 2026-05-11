
-- 1. Restrict avatars bucket listing: replace anonymous SELECT with authenticated-only SELECT.
-- Public URL access (getPublicUrl) bypasses RLS for public buckets, so images keep loading.
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;

CREATE POLICY "Authenticated users can view avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');

-- Admins explicitly allowed to list (for CMS/partner-logo management UI)
CREATE POLICY "Admins can list avatars"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars' AND public.is_admin(auth.uid()));

-- 2. Harden remaining helper SECURITY DEFINER funcs that DO NOT need anon access.
-- These are only called from authenticated contexts (RLS evaluation for logged-in users
-- or staff dashboards). Public reads (countries/visa_types) use is_admin only after
-- a true OR branch, so revoking from anon is still safe here because the OR short-circuits.
REVOKE EXECUTE ON FUNCTION public.is_application_owner(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_assigned_agent(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_access_application(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_profile_owner(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_tour_operator(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_customer(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_secure_document_info(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_failed_attempts_count(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_email_locked_out(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_2fa_rate_limit(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_recovery_rate_limit(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_staff_portal_path(text) FROM PUBLIC, anon;

-- Keep is_admin/is_agent/has_role/get_profile_id callable by anon because public-read
-- policies (countries, visa_types, hero_*, special_offers) reference them with
-- "(is_active = true) OR is_admin(auth.uid())" — anon must evaluate the second branch.
