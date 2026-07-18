DROP POLICY IF EXISTS "Anyone can submit unlock requests" ON public.account_unlock_requests;
CREATE POLICY "Users can submit their own unlock requests"
ON public.account_unlock_requests FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND email = (SELECT email FROM auth.users WHERE id = auth.uid())::text
);