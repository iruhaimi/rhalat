
-- 1) Restrict all helper-based policies to authenticated role so anon short-circuits (returns [] instead of executing revoked SECURITY DEFINER helpers)
ALTER POLICY "Agents can update document verification" ON public.application_documents TO authenticated;
ALTER POLICY "Users can delete own application documents" ON public.application_documents TO authenticated;
ALTER POLICY "Users can insert documents for own applications" ON public.application_documents TO authenticated;
ALTER POLICY "Users can update own application documents" ON public.application_documents TO authenticated;
ALTER POLICY "Users can view own application documents" ON public.application_documents TO authenticated;

ALTER POLICY "Agents can mark messages as read" ON public.application_messages TO authenticated;
ALTER POLICY "Agents can view assigned application messages" ON public.application_messages TO authenticated;
ALTER POLICY "Customers can mark messages as read" ON public.application_messages TO authenticated;
ALTER POLICY "Customers can send messages to own applications" ON public.application_messages TO authenticated;
ALTER POLICY "Customers can view own application messages" ON public.application_messages TO authenticated;

ALTER POLICY "Agents can view notes for assigned applications" ON public.application_notes TO authenticated;
ALTER POLICY "Users can view status history for accessible applications" ON public.application_status_history TO authenticated;

ALTER POLICY "Agents can update assigned applications" ON public.applications TO authenticated;
ALTER POLICY "Agents can view assigned applications" ON public.applications TO authenticated;
ALTER POLICY "Owners can reset pending_payment to draft" ON public.applications TO authenticated;
ALTER POLICY "Users can delete own draft applications" ON public.applications TO authenticated;
ALTER POLICY "Users can update own draft applications" ON public.applications TO authenticated;
ALTER POLICY "Users can update own pending_payment applications" ON public.applications TO authenticated;
ALTER POLICY "Users can view own applications" ON public.applications TO authenticated;

ALTER POLICY "Agents can view payments for assigned apps" ON public.payments TO authenticated;
ALTER POLICY "Users can create payments for own applications" ON public.payments TO authenticated;
ALTER POLICY "Users can view own payments" ON public.payments TO authenticated;

ALTER POLICY "Super admins can create pending operations" ON public.pending_sensitive_operations TO authenticated;
ALTER POLICY "Super admins can update pending operations" ON public.pending_sensitive_operations TO authenticated;
ALTER POLICY "Super admins can view pending operations" ON public.pending_sensitive_operations TO authenticated;

ALTER POLICY "Only super admins can view security logs" ON public.security_audit_log TO authenticated;
ALTER POLICY "Super admins can view audit log" ON public.staff_audit_log TO authenticated;

ALTER POLICY "Super admins can read portal path" ON public.staff_portal_settings TO authenticated;
ALTER POLICY "Super admins can update portal metadata only" ON public.staff_portal_settings TO authenticated;

ALTER POLICY "Super admins can create backups" ON public.system_backups TO authenticated;
ALTER POLICY "Super admins can delete backups" ON public.system_backups TO authenticated;
ALTER POLICY "Super admins can view backups" ON public.system_backups TO authenticated;

-- 2) Provide a SECURITY DEFINER RPC so locked-out staff (no session on main client) can submit an unlock request
CREATE OR REPLACE FUNCTION public.submit_unlock_request(p_email text, p_reason text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_recent int;
  v_id uuid;
BEGIN
  IF p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;
  IF p_reason IS NULL OR length(trim(p_reason)) < 5 THEN
    RAISE EXCEPTION 'invalid_reason';
  END IF;

  SELECT id INTO v_user_id FROM auth.users WHERE lower(email) = lower(trim(p_email)) LIMIT 1;
  IF v_user_id IS NULL THEN
    -- Do not disclose account existence; return a synthetic success id
    RETURN gen_random_uuid();
  END IF;

  -- Rate limit: max 3 pending requests per user in last 24h
  SELECT count(*) INTO v_recent
  FROM public.account_unlock_requests
  WHERE user_id = v_user_id AND created_at > now() - interval '24 hours';
  IF v_recent >= 3 THEN
    RAISE EXCEPTION 'rate_limited';
  END IF;

  INSERT INTO public.account_unlock_requests (user_id, email, reason, status)
  VALUES (v_user_id, lower(trim(p_email)), trim(p_reason), 'pending')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_unlock_request(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_unlock_request(text, text) TO anon, authenticated;
