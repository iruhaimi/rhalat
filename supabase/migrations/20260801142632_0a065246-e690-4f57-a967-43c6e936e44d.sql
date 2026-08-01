DROP POLICY IF EXISTS "Users can submit their own unlock requests" ON public.account_unlock_requests;
DROP POLICY IF EXISTS "Authenticated users can view own unlock requests" ON public.account_unlock_requests;
DROP POLICY IF EXISTS "Authenticated users can submit unlock requests" ON public.account_unlock_requests;
DROP POLICY IF EXISTS "Authenticated users can submit own refund requests" ON public.refund_requests;

CREATE POLICY "Users can submit their own unlock requests"
ON public.account_unlock_requests
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND lower(email) = lower(auth.jwt() ->> 'email')
  AND NOT EXISTS (
    SELECT 1 FROM public.account_unlock_requests aur
    WHERE lower(aur.email) = lower(account_unlock_requests.email)
      AND aur.status = 'pending'
      AND aur.created_at > now() - interval '24 hours'
  )
);

CREATE POLICY "Authenticated users can view own unlock requests"
ON public.account_unlock_requests
FOR SELECT TO authenticated
USING (lower(email) = lower(auth.jwt() ->> 'email'));

CREATE POLICY "Authenticated users can submit own refund requests"
ON public.refund_requests
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND lower(email) = lower(auth.jwt() ->> 'email')
);