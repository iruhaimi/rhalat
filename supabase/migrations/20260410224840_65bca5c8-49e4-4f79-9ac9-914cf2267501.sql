
CREATE TABLE public.user_push_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_uuid TEXT NOT NULL UNIQUE,
  onesignal_player_id TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'unknown',
  last_active TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_push_devices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own devices"
ON public.user_push_devices
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access"
ON public.user_push_devices
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
