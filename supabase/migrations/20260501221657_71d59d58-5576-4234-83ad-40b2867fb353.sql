
-- Replace the topic-restrictive policy with one that allows authenticated
-- subscriptions. Row-level visibility on postgres_changes is still enforced
-- by the SOURCE table RLS (applications, application_messages, notifications, etc.)
DROP POLICY IF EXISTS "Authenticated can subscribe to own channels" ON realtime.messages;

CREATE POLICY "Authenticated users can subscribe to realtime"
ON realtime.messages
FOR SELECT
TO authenticated
USING (true);
