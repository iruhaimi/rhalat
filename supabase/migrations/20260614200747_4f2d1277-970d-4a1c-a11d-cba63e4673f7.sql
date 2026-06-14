
DO $$
DECLARE
  v_new_user_id uuid := gen_random_uuid();
  v_encrypted_pw text;
BEGIN
  ALTER TABLE public.user_roles DISABLE TRIGGER USER;
  ALTER TABLE public.staff_permissions DISABLE TRIGGER USER;

  -- Clear all dependent tables that reference profiles/applications/users
  TRUNCATE TABLE
    public.application_status_history,
    public.application_messages,
    public.application_notes,
    public.application_documents,
    public.agent_transfer_requests,
    public.agent_work_submissions,
    public.document_access_log,
    public.payments,
    public.refund_requests,
    public.wallet_transactions,
    public.tour_bookings,
    public.tour_program_reviews,
    public.tour_operators,
    public.applications,
    public.notifications,
    public.staff_2fa_codes,
    public.staff_recovery_codes,
    public.staff_login_attempts,
    public.staff_audit_log,
    public.staff_permissions,
    public.user_roles,
    public.account_unlock_requests,
    public.pending_sensitive_operations,
    public.role_activity_log,
    public.security_audit_log,
    public.ai_assistant_conversations,
    public.ai_assistant_messages,
    public.ai_tool_invocations,
    public.user_push_devices,
    public.email_send_log,
    public.email_send_state,
    public.email_subscribers,
    public.email_unsubscribe_tokens,
    public.suppressed_emails,
    public.system_backups,
    public.profiles
  RESTART IDENTITY CASCADE;

  DELETE FROM auth.identities;
  DELETE FROM auth.sessions;
  DELETE FROM auth.refresh_tokens;
  DELETE FROM auth.users;

  v_encrypted_pw := crypt('Ibra1983@', gen_salt('bf'));

  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_new_user_id,
    'authenticated',
    'authenticated',
    'ibrahim@rhalat.com',
    v_encrypted_pw,
    now(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"إبراهيم - المالك"}'::jsonb,
    now(), now(), '', '', '', ''
  );

  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id,
    last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_new_user_id,
    jsonb_build_object('sub', v_new_user_id::text, 'email', 'ibrahim@rhalat.com', 'email_verified', true),
    'email',
    v_new_user_id::text,
    now(), now(), now()
  );

  INSERT INTO public.profiles (user_id, full_name)
  VALUES (v_new_user_id, 'إبراهيم - المالك')
  ON CONFLICT (user_id) DO NOTHING;

  DELETE FROM public.user_roles WHERE user_id = v_new_user_id;
  INSERT INTO public.user_roles (user_id, role) VALUES (v_new_user_id, 'admin');

  INSERT INTO public.staff_permissions (user_id, permission)
  SELECT v_new_user_id, p
  FROM unnest(enum_range(NULL::staff_permission)) AS p
  ON CONFLICT DO NOTHING;

  ALTER TABLE public.user_roles ENABLE TRIGGER USER;
  ALTER TABLE public.staff_permissions ENABLE TRIGGER USER;
END $$;
