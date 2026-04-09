-- Add scoped SELECT policy for staff_2fa_codes
CREATE POLICY "Users can view own pending 2FA codes"
ON public.staff_2fa_codes
FOR SELECT
TO authenticated
USING (user_id = auth.uid() AND used = false AND expires_at > now());