
-- =============================================================
-- 1) staff_recovery_codes: restrict INSERT to service_role only
-- =============================================================
DROP POLICY IF EXISTS "Service role can insert recovery codes" ON public.staff_recovery_codes;

CREATE POLICY "Service role can insert recovery codes"
ON public.staff_recovery_codes
FOR INSERT
WITH CHECK (
  ((current_setting('request.jwt.claims', true))::json ->> 'role') = 'service_role'
);

-- =============================================================
-- 2) tour_bookings: enforce ownership on INSERT
-- =============================================================
DROP POLICY IF EXISTS "Anyone authenticated can create bookings" ON public.tour_bookings;

CREATE POLICY "Authenticated users can create own bookings"
ON public.tour_bookings
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND auth.uid() IS NOT NULL
);

-- =============================================================
-- 3) realtime.messages RLS: scope channel subscriptions per user
-- =============================================================
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

-- Drop any pre-existing permissive policy if it exists
DROP POLICY IF EXISTS "Authenticated can subscribe to own channels" ON realtime.messages;
DROP POLICY IF EXISTS "Staff can subscribe to staff channels" ON realtime.messages;

-- Authenticated users may subscribe to:
--   - their own user-scoped topic:        user:<auth.uid()>
--   - public broadcast topics prefixed:    public:*
-- Staff (admins/agents) additionally may subscribe to:
--   - applications:*  notifications:*  staff:*
CREATE POLICY "Authenticated can subscribe to own channels"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Per-user topics: "user:<uuid>"
  (realtime.topic() = 'user:' || auth.uid()::text)
  OR
  -- Public broadcast topics
  (realtime.topic() LIKE 'public:%')
  OR
  -- Staff-only topics (only allowed if user is staff)
  (
    realtime.topic() ~ '^(applications|notifications|staff|admin|agent):'
    AND (public.is_admin(auth.uid()) OR public.is_agent(auth.uid()))
  )
);

-- =============================================================
-- 4) storage.objects: explicit deny of UPDATE on `documents` bucket
-- =============================================================
DROP POLICY IF EXISTS "No one can update documents" ON storage.objects;

CREATE POLICY "No one can update documents"
ON storage.objects
FOR UPDATE
USING (bucket_id <> 'documents')
WITH CHECK (bucket_id <> 'documents');
