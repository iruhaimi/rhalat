
-- 1) Fix RLS policies that use bare TRUE
DROP POLICY IF EXISTS "Service role full access" ON public.user_push_devices;
CREATE POLICY "Service role full access" ON public.user_push_devices
  FOR ALL TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Anyone can subscribe" ON public.email_subscribers;
CREATE POLICY "Anyone can subscribe" ON public.email_subscribers
  FOR INSERT TO public
  WITH CHECK (
    email IS NOT NULL
    AND length(email) BETWEEN 3 AND 320
    AND position('@' IN email) > 1
  );

-- 2) Revoke EXECUTE on pure trigger functions from all client roles.
DO $$
DECLARE
  trigger_fns text[] := ARRAY[
    'auto_assign_customer_role()',
    'auto_create_tour_operator()',
    'check_excessive_document_access()',
    'enforce_minimum_admins()',
    'enforce_minimum_super_admins()',
    'generate_application_display_number()',
    'handle_new_user()',
    'log_application_status_change()',
    'notify_admin_on_agent_note()',
    'notify_admin_on_transfer_request()',
    'notify_admin_on_whatsapp_order()',
    'notify_admin_on_work_submission()',
    'notify_agent_on_assignment()',
    'notify_agent_on_transfer_decision()',
    'notify_agent_on_work_decision()',
    'notify_application_status_change()',
    'protect_profile_wallet_balance()',
    'protect_wallet_balance()',
    'sync_price_notes_on_fee_type_change()',
    'update_updated_at_column()',
    'validate_application_status_transition()'
  ];
  fn text;
BEGIN
  FOREACH fn IN ARRAY trigger_fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM anon', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM authenticated', fn);
  END LOOP;
END$$;

-- 3) Revoke EXECUTE from anon and PUBLIC on staff-only / authenticated-only helpers and RPCs.
--    Keep authenticated grants intact so RLS and intended RPC calls still work.
DO $$
DECLARE
  staff_fns text[] := ARRAY[
    'has_permission(uuid, staff_permission)',
    'is_super_admin(uuid)',
    'get_user_email(uuid)',
    'get_audit_event_types()',
    'get_failed_attempts_count(text)',
    'get_secure_document_info(uuid)',
    'log_staff_action(text, text, text, text, text, jsonb)',
    'clear_failed_login_attempts(text)',
    'check_2fa_rate_limit(uuid)',
    'check_recovery_rate_limit(uuid)',
    'verify_staff_2fa(uuid, text)',
    'rotate_staff_portal_path(text)',
    'record_login_attempt(text, boolean, text, text)',
    'is_email_locked_out(text)',
    'check_staff_portal_path(text)',
    'create_application_draft(uuid, date, jsonb)',
    'get_agents_for_transfer(uuid)'
  ];
  fn text;
BEGIN
  FOREACH fn IN ARRAY staff_fns LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC', fn);
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM anon', fn);
  END LOOP;
END$$;

-- Note: is_admin, is_agent, is_customer, is_tour_operator, has_role, is_application_owner,
-- is_assigned_agent, is_profile_owner, can_access_application, and get_profile_id are intentionally
-- left callable by anon so that RLS policies on publicly-readable tables (countries, hero_*, visa_types)
-- containing "OR is_admin(auth.uid())" continue to evaluate correctly for anonymous visitors.
