-- =========================================================================
-- FIX 1: fake_agent_assign
-- =========================================================================

-- 1a. Harden is_assigned_agent(): require the account to actually be an agent
CREATE OR REPLACE FUNCTION public.is_assigned_agent(_app_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.applications a
    JOIN public.profiles p ON a.assigned_agent_id = p.id
    JOIN public.user_roles ur ON ur.user_id = p.user_id
    WHERE a.id = _app_id
      AND p.user_id = _user_id
      AND ur.role = 'agent'
  )
$function$;

-- 1b. Prevent non-admins from changing assigned_agent_id via UPDATE
CREATE OR REPLACE FUNCTION public.protect_application_agent_assignment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
BEGIN
  IF NEW.assigned_agent_id IS DISTINCT FROM OLD.assigned_agent_id THEN
    v_role := COALESCE(current_setting('request.jwt.claims', true)::json ->> 'role', '');

    -- Allow service_role (edge functions) and admins; block everyone else
    IF v_role <> 'service_role'
       AND NOT public.is_admin(auth.uid())
       AND NOT public.has_permission(auth.uid(), 'manage_staff') THEN
      NEW.assigned_agent_id := OLD.assigned_agent_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_application_agent_assignment ON public.applications;
CREATE TRIGGER trg_protect_application_agent_assignment
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.protect_application_agent_assignment();


-- =========================================================================
-- FIX 2: self_verify_docs
-- =========================================================================

-- Reset verification fields on any owner-initiated UPDATE. Only real
-- agents/admins (or service_role) may set status/verified_by/verified_at/
-- verification_notes.
CREATE OR REPLACE FUNCTION public.protect_document_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role text;
  v_is_staff boolean;
BEGIN
  v_role := COALESCE(current_setting('request.jwt.claims', true)::json ->> 'role', '');

  v_is_staff := v_role = 'service_role'
             OR public.is_admin(auth.uid())
             OR public.is_assigned_agent(NEW.application_id, auth.uid())
             OR public.has_role(auth.uid(), 'agent');

  IF NOT v_is_staff THEN
    -- Owner (or anyone else) cannot touch verification fields
    NEW.status            := OLD.status;
    NEW.verified_by       := OLD.verified_by;
    NEW.verified_at       := OLD.verified_at;
    NEW.verification_notes := OLD.verification_notes;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_document_verification_fields ON public.application_documents;
CREATE TRIGGER trg_protect_document_verification_fields
BEFORE UPDATE ON public.application_documents
FOR EACH ROW
EXECUTE FUNCTION public.protect_document_verification_fields();