-- Fix: Restrict agents from creating notifications for arbitrary users
-- Agents should only notify users whose applications they are assigned to

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Staff can create notifications for others" ON public.notifications;

-- Admins can create notifications for anyone
CREATE POLICY "Admins can create notifications for others"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin(auth.uid())
);

-- Agents can only create notifications for users whose applications they are assigned to
CREATE POLICY "Agents can notify assigned application users"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  is_agent(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.applications a
    WHERE a.assigned_agent_id = get_profile_id(auth.uid())
    AND a.user_id = notifications.user_id
  )
);