DROP POLICY IF EXISTS "Users can only mark own codes as used" ON public.staff_2fa_codes;
CREATE POLICY "Only service role can update 2FA codes"
  ON public.staff_2fa_codes
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);