DO $$
DECLARE
  uids uuid[] := ARRAY['b722b9a0-9448-4140-aa77-0e647ab4712f','97955d8e-4386-4ed8-8cf7-93588b3b2c9f']::uuid[];
BEGIN
  DELETE FROM public.staff_permissions WHERE user_id = ANY(uids);
  DELETE FROM public.user_roles WHERE user_id = ANY(uids);
  DELETE FROM public.staff_2fa_codes WHERE user_id = ANY(uids);
  DELETE FROM public.staff_recovery_codes WHERE user_id = ANY(uids);
  DELETE FROM public.pending_sensitive_operations WHERE target_user_id = ANY(uids) OR requested_by = ANY(uids);
  DELETE FROM public.notifications WHERE user_id IN (SELECT id FROM public.profiles WHERE user_id = ANY(uids));
  DELETE FROM public.profiles WHERE user_id = ANY(uids);
  DELETE FROM auth.identities WHERE user_id = ANY(uids);
  DELETE FROM auth.sessions WHERE user_id = ANY(uids);
  DELETE FROM auth.users WHERE id = ANY(uids);
END $$;