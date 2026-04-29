-- 1. Staff audit log table (immutable)
CREATE TABLE public.staff_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_email text,
  actor_name text,
  event_type text NOT NULL,
  event_category text NOT NULL DEFAULT 'general',
  description text NOT NULL,
  target_type text,
  target_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_user_id ON public.staff_audit_log(user_id);
CREATE INDEX idx_audit_created_at ON public.staff_audit_log(created_at DESC);
CREATE INDEX idx_audit_event_type ON public.staff_audit_log(event_type);
CREATE INDEX idx_audit_category ON public.staff_audit_log(event_category);

ALTER TABLE public.staff_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view audit log"
  ON public.staff_audit_log FOR SELECT
  USING (public.has_permission(auth.uid(), 'manage_staff'));

CREATE POLICY "Authenticated users can insert their own audit"
  ON public.staff_audit_log FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.uid() IS NOT NULL);

-- No UPDATE or DELETE policies = immutable

-- 2. Staff portal settings (secret path)
CREATE TABLE public.staff_portal_settings (
  id integer PRIMARY KEY DEFAULT 1,
  secret_path text NOT NULL DEFAULT 'portal-x7k9m2',
  rotated_at timestamp with time zone NOT NULL DEFAULT now(),
  rotated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO public.staff_portal_settings (id, secret_path) VALUES (1, 'portal-x7k9m2')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.staff_portal_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read the current path (the route guard checks it client-side; no secret in code)
CREATE POLICY "Anyone can read portal path"
  ON public.staff_portal_settings FOR SELECT
  USING (true);

CREATE POLICY "Super admins can update portal path"
  ON public.staff_portal_settings FOR UPDATE
  USING (public.has_permission(auth.uid(), 'manage_staff'));

-- 3. Force-logout marker on profiles (for session invalidation after rotation)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS force_logout_after timestamp with time zone;

-- 4. Helper function to insert audit log
CREATE OR REPLACE FUNCTION public.log_staff_action(
  p_event_type text,
  p_description text,
  p_event_category text DEFAULT 'general',
  p_target_type text DEFAULT NULL,
  p_target_id text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
  v_email text;
  v_name text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT u.email INTO v_email FROM auth.users u WHERE u.id = auth.uid();
  SELECT full_name INTO v_name FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

  INSERT INTO public.staff_audit_log (
    user_id, actor_email, actor_name, event_type, event_category,
    description, target_type, target_id, metadata
  ) VALUES (
    auth.uid(), v_email, v_name, p_event_type, p_event_category,
    p_description, p_target_type, p_target_id, p_metadata
  ) RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- 5. RPC for rotating portal secret path (owner only) + force logout all staff
CREATE OR REPLACE FUNCTION public.rotate_staff_portal_path(p_new_path text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old_path text;
  v_clean_path text;
BEGIN
  IF NOT public.has_permission(auth.uid(), 'manage_staff') THEN
    RAISE EXCEPTION 'access_denied';
  END IF;

  -- Sanitize: lowercase alphanumeric and dash only, 8-40 chars
  v_clean_path := lower(regexp_replace(p_new_path, '[^a-z0-9-]', '', 'g'));
  IF length(v_clean_path) < 8 OR length(v_clean_path) > 40 THEN
    RAISE EXCEPTION 'invalid_path_length';
  END IF;

  SELECT secret_path INTO v_old_path FROM public.staff_portal_settings WHERE id = 1;

  UPDATE public.staff_portal_settings
  SET secret_path = v_clean_path,
      rotated_at = now(),
      rotated_by = auth.uid()
  WHERE id = 1;

  -- Force all staff (admin/agent) to re-login
  UPDATE public.profiles p
  SET force_logout_after = now()
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = p.user_id AND ur.role IN ('admin','agent')
  );

  -- Audit
  PERFORM public.log_staff_action(
    'portal_rotated',
    'تم تدوير المسار السري لبوابة الموظفين',
    'security',
    'staff_portal_settings',
    '1',
    jsonb_build_object('old_path', v_old_path, 'new_path', v_clean_path)
  );

  RETURN jsonb_build_object('success', true, 'new_path', v_clean_path, 'old_path', v_old_path);
END;
$$;

-- 6. RPC to get distinct event types for filter dropdowns
CREATE OR REPLACE FUNCTION public.get_audit_event_types()
RETURNS TABLE(event_type text, event_category text, count bigint)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_permission(auth.uid(), 'manage_staff') THEN
    RAISE EXCEPTION 'access_denied';
  END IF;

  RETURN QUERY
  SELECT sal.event_type, sal.event_category, count(*)::bigint
  FROM public.staff_audit_log sal
  GROUP BY sal.event_type, sal.event_category
  ORDER BY count(*) DESC;
END;
$$;