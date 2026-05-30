
-- 1. Audit table for AI tool invocations
CREATE TABLE public.ai_tool_invocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  conversation_id uuid REFERENCES public.ai_assistant_conversations(id) ON DELETE SET NULL,
  tool_name text NOT NULL,
  arguments jsonb NOT NULL DEFAULT '{}'::jsonb,
  result jsonb,
  success boolean NOT NULL DEFAULT true,
  error text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_tool_inv_created ON public.ai_tool_invocations (created_at DESC);
CREATE INDEX idx_ai_tool_inv_tool ON public.ai_tool_invocations (tool_name);

GRANT SELECT ON public.ai_tool_invocations TO authenticated;
GRANT ALL ON public.ai_tool_invocations TO service_role;

ALTER TABLE public.ai_tool_invocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins view AI tool invocations"
ON public.ai_tool_invocations
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- 2. Update ai_* RPC functions to allow super admin bypass
CREATE OR REPLACE FUNCTION public.ai_query_applications(p_status text DEFAULT NULL::text, p_days_back integer DEFAULT 30, p_limit integer DEFAULT 20)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_result JSONB;
  v_lim INTEGER;
BEGIN
  IF NOT (is_super_admin(auth.uid()) OR has_permission(auth.uid(), 'manage_applications')) THEN
    RAISE EXCEPTION 'access_denied';
  END IF;

  v_lim := LEAST(COALESCE(p_limit, 20), 100);

  SELECT jsonb_agg(row_to_json(t)) INTO v_result FROM (
    SELECT a.id, a.display_number, a.status::TEXT, a.created_at, a.travel_date,
           c.name AS country, vt.name AS visa_type,
           p.full_name AS customer_name
    FROM applications a
    JOIN visa_types vt ON vt.id = a.visa_type_id
    JOIN countries c ON c.id = vt.country_id
    JOIN profiles p ON p.id = a.user_id
    WHERE (p_status IS NULL OR a.status::TEXT = p_status)
      AND a.created_at > now() - (p_days_back || ' days')::INTERVAL
    ORDER BY a.created_at DESC
    LIMIT v_lim
  ) t;

  RETURN jsonb_build_object('count', COALESCE(jsonb_array_length(v_result), 0), 'rows', COALESCE(v_result, '[]'::jsonb));
END;
$function$;

CREATE OR REPLACE FUNCTION public.ai_agent_performance(p_days_back integer DEFAULT 30)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_result JSONB;
BEGIN
  IF NOT (is_super_admin(auth.uid()) OR has_permission(auth.uid(), 'view_reports')) THEN
    RAISE EXCEPTION 'access_denied';
  END IF;

  SELECT jsonb_agg(row_to_json(t)) INTO v_result FROM (
    SELECT p.id, p.full_name,
           count(a.id) FILTER (WHERE a.status = 'approved') AS approved_count,
           count(a.id) FILTER (WHERE a.status = 'rejected') AS rejected_count,
           count(a.id) AS total_assigned
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.user_id
    LEFT JOIN applications a ON a.assigned_agent_id = p.id
      AND a.updated_at > now() - (p_days_back || ' days')::INTERVAL
    WHERE ur.role = 'agent'
    GROUP BY p.id, p.full_name
    ORDER BY count(a.id) FILTER (WHERE a.status = 'approved') DESC
  ) t;

  RETURN jsonb_build_object('rows', COALESCE(v_result, '[]'::jsonb));
END;
$function$;

CREATE OR REPLACE FUNCTION public.ai_update_visa_price(p_visa_id uuid, p_new_price numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_old NUMERIC;
  v_name TEXT;
BEGIN
  IF NOT (is_super_admin(auth.uid()) OR has_permission(auth.uid(), 'manage_settings')) THEN
    RAISE EXCEPTION 'access_denied';
  END IF;
  IF p_new_price IS NULL OR p_new_price <= 0 OR p_new_price > 100000 THEN
    RAISE EXCEPTION 'invalid_price';
  END IF;

  SELECT price, name INTO v_old, v_name FROM visa_types WHERE id = p_visa_id;
  IF v_name IS NULL THEN RAISE EXCEPTION 'visa_not_found'; END IF;

  UPDATE visa_types SET price = p_new_price, updated_at = now() WHERE id = p_visa_id;

  PERFORM log_staff_action(
    'ai_update_visa_price',
    'AI: تغيير سعر تأشيرة ' || v_name || ' من ' || v_old || ' إلى ' || p_new_price,
    'ai_assistant',
    'visa_types',
    p_visa_id::TEXT,
    jsonb_build_object('old_price', v_old, 'new_price', p_new_price)
  );

  RETURN jsonb_build_object('success', true, 'visa_name', v_name, 'old_price', v_old, 'new_price', p_new_price);
END;
$function$;

CREATE OR REPLACE FUNCTION public.ai_toggle_offer(p_offer_id uuid, p_active boolean)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_title TEXT;
BEGIN
  IF NOT (is_super_admin(auth.uid()) OR has_permission(auth.uid(), 'manage_offers')) THEN
    RAISE EXCEPTION 'access_denied';
  END IF;

  SELECT title INTO v_title FROM special_offers WHERE id = p_offer_id;
  IF v_title IS NULL THEN RAISE EXCEPTION 'offer_not_found'; END IF;

  UPDATE special_offers SET is_active = p_active, updated_at = now() WHERE id = p_offer_id;

  PERFORM log_staff_action(
    'ai_toggle_offer',
    'AI: ' || CASE WHEN p_active THEN 'تفعيل' ELSE 'إيقاف' END || ' عرض ' || v_title,
    'ai_assistant',
    'special_offers',
    p_offer_id::TEXT,
    jsonb_build_object('active', p_active)
  );

  RETURN jsonb_build_object('success', true, 'title', v_title, 'is_active', p_active);
END;
$function$;

CREATE OR REPLACE FUNCTION public.ai_bulk_notify(p_status_filter text, p_title text, p_message text, p_max_recipients integer DEFAULT 200)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_inserted INTEGER;
BEGIN
  IF NOT (is_super_admin(auth.uid()) OR has_permission(auth.uid(), 'manage_users')) THEN
    RAISE EXCEPTION 'access_denied';
  END IF;
  IF p_title IS NULL OR length(p_title) < 3 OR p_message IS NULL OR length(p_message) < 5 THEN
    RAISE EXCEPTION 'invalid_content';
  END IF;
  IF p_max_recipients > 500 THEN
    RAISE EXCEPTION 'max_recipients_too_high';
  END IF;

  WITH targets AS (
    SELECT DISTINCT a.user_id AS profile_id
    FROM applications a
    WHERE (p_status_filter IS NULL OR a.status::TEXT = p_status_filter)
    LIMIT p_max_recipients
  )
  INSERT INTO notifications (user_id, title, message, type)
  SELECT t.profile_id, p_title, p_message, 'broadcast' FROM targets t;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  PERFORM log_staff_action(
    'ai_bulk_notify',
    'AI: إرسال إشعار مجمع لـ ' || v_inserted || ' عميل: ' || p_title,
    'ai_assistant',
    'notifications', NULL,
    jsonb_build_object('count', v_inserted, 'status_filter', p_status_filter)
  );

  RETURN jsonb_build_object('success', true, 'recipients', v_inserted);
END;
$function$;
