
-- ========== 1. refund_requests: add user_id and tighten policies ==========
ALTER TABLE public.refund_requests
  ADD COLUMN IF NOT EXISTS user_id uuid;

-- Backfill from email where possible
UPDATE public.refund_requests rr
SET user_id = u.id
FROM auth.users u
WHERE u.email = rr.email AND rr.user_id IS NULL;

DROP POLICY IF EXISTS "Authenticated users can submit own refund requests" ON public.refund_requests;
DROP POLICY IF EXISTS "Users can view own refund requests" ON public.refund_requests;

CREATE POLICY "Authenticated users can submit own refund requests"
ON public.refund_requests FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND email = (SELECT u.email FROM auth.users u WHERE u.id = auth.uid())::text
);

CREATE POLICY "Users can view own refund requests"
ON public.refund_requests FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR is_admin(auth.uid())
);

-- ========== 2. document_access_log: only assigned agents may insert ==========
DROP POLICY IF EXISTS "Staff can insert access logs" ON public.document_access_log;

CREATE POLICY "Staff can insert access logs"
ON public.document_access_log FOR INSERT
WITH CHECK (
  is_admin(auth.uid())
  OR (
    is_agent(auth.uid())
    AND is_assigned_agent(application_id, auth.uid())
  )
);

-- ========== 3. realtime.messages: restrict by topic ==========
DROP POLICY IF EXISTS "Authenticated users can subscribe to realtime" ON realtime.messages;

CREATE POLICY "Authenticated users can subscribe to scoped topics"
ON realtime.messages FOR SELECT TO authenticated
USING (
  CASE
    -- Per-user notification channel: notifications-<profile_id>
    WHEN realtime.topic() LIKE 'notifications-%' THEN
      (
        SELECT (substring(realtime.topic() from 'notifications-(.*)'))::uuid
               = public.get_profile_id(auth.uid())
      )
    -- Per-application messages channel: messages-<application_id>
    WHEN realtime.topic() LIKE 'messages-%' THEN
      public.can_access_application(
        (substring(realtime.topic() from 'messages-(.*)'))::uuid,
        auth.uid()
      )
    -- Admin-only channels
    WHEN realtime.topic() LIKE 'admin-%' THEN
      public.is_admin(auth.uid())
    ELSE false
  END
);
