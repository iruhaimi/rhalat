-- Allow admins/owners to send messages to customers in any application
CREATE POLICY "Admins can send messages to any application"
ON public.application_messages
FOR INSERT
WITH CHECK (
  is_admin(auth.uid())
  AND sender_type IN ('agent', 'admin')
  AND sender_id = get_profile_id(auth.uid())
);

-- Allow admins to mark messages as read
CREATE POLICY "Admins can mark messages as read"
ON public.application_messages
FOR UPDATE
USING (is_admin(auth.uid()))
WITH CHECK (is_admin(auth.uid()));

-- Allow customers to also see admin-typed messages (sender_type='admin')
-- Existing customer SELECT policy already returns all messages of their application,
-- so no change needed there. Same for agent SELECT policy on assigned applications.
