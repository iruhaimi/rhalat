
-- Fix 1: Remove public/CMS tables from Realtime publication.
-- These tables are read by anonymous users and broadcasting all change
-- events (including is_active=false / draft rows) leaks data.
ALTER PUBLICATION supabase_realtime DROP TABLE public.countries;
ALTER PUBLICATION supabase_realtime DROP TABLE public.visa_types;
ALTER PUBLICATION supabase_realtime DROP TABLE public.special_offers;
ALTER PUBLICATION supabase_realtime DROP TABLE public.hero_destinations;
ALTER PUBLICATION supabase_realtime DROP TABLE public.hero_settings;
ALTER PUBLICATION supabase_realtime DROP TABLE public.footer_settings;
ALTER PUBLICATION supabase_realtime DROP TABLE public.site_content;

-- Fix 2: Replace unverified JWT-claim service_role checks with auth.role(),
-- which Supabase resolves from the verified session. Crafting a JWT with
-- role:service_role in the payload can no longer bypass these checks.
DROP POLICY IF EXISTS "Service role can insert audit" ON public.staff_audit_log;
CREATE POLICY "Service role can insert audit"
ON public.staff_audit_log
FOR INSERT
TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Only service role can insert 2FA codes" ON public.staff_2fa_codes;
CREATE POLICY "Only service role can insert 2FA codes"
ON public.staff_2fa_codes
FOR INSERT
TO service_role
WITH CHECK (true);

DROP POLICY IF EXISTS "Only service role can insert login attempts" ON public.staff_login_attempts;
CREATE POLICY "Only service role can insert login attempts"
ON public.staff_login_attempts
FOR INSERT
TO service_role
WITH CHECK (true);
