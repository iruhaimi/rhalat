DROP POLICY IF EXISTS "Users can view own pending 2FA codes" ON public.staff_2fa_codes;
REVOKE SELECT ON public.staff_2fa_codes FROM authenticated, anon;