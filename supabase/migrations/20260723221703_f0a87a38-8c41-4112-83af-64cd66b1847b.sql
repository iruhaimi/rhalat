
-- Fix 1: Remove permissive storage UPDATE policy that granted any user update rights on non-document buckets
DROP POLICY IF EXISTS "No one can update documents" ON storage.objects;

-- Fix 2: Enforce two-person approval at DB layer for sensitive role/permission removals
CREATE OR REPLACE FUNCTION public.enforce_two_person_rule()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  op_type_text text;
  target uuid;
  approved_exists boolean;
BEGIN
  target := OLD.user_id;

  IF TG_TABLE_NAME = 'user_roles' THEN
    IF OLD.role <> 'admin' THEN RETURN OLD; END IF;
    op_type_text := 'remove_admin_role';
  ELSIF TG_TABLE_NAME = 'staff_permissions' THEN
    IF OLD.permission <> 'manage_staff' THEN RETURN OLD; END IF;
    op_type_text := 'remove_manage_staff_permission';
  ELSE
    RETURN OLD;
  END IF;

  -- Allow when a matching approved sensitive-op exists, approved by someone other than the requester,
  -- within the last hour. delete_staff approvals also unlock the cascading role/permission removals.
  SELECT EXISTS (
    SELECT 1
    FROM public.pending_sensitive_operations
    WHERE target_user_id = target
      AND status = 'approved'
      AND approved_by IS NOT NULL
      AND approved_by <> requested_by
      AND approved_at > now() - interval '1 hour'
      AND operation_type::text IN (op_type_text, 'delete_staff')
  ) INTO approved_exists;

  IF approved_exists THEN
    RETURN OLD;
  END IF;

  RAISE EXCEPTION 'two_person_approval_required'
    USING HINT = 'This action requires an approved pending_sensitive_operations record from a second super admin.';
END;
$$;

DROP TRIGGER IF EXISTS enforce_two_person_rule_user_roles ON public.user_roles;
CREATE TRIGGER enforce_two_person_rule_user_roles
  BEFORE DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_two_person_rule();

DROP TRIGGER IF EXISTS enforce_two_person_rule_staff_permissions ON public.staff_permissions;
CREATE TRIGGER enforce_two_person_rule_staff_permissions
  BEFORE DELETE ON public.staff_permissions
  FOR EACH ROW EXECUTE FUNCTION public.enforce_two_person_rule();
