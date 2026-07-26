-- =========================================================================
-- Deep RLS Hardening Pass
-- =========================================================================
-- Full audit covering: applications, application_documents,
-- application_messages, application_notes, profiles, user_roles,
-- staff_permissions, staff_2fa_codes, staff_recovery_codes,
-- staff_login_attempts, payments, wallet_transactions, refund_requests,
-- agent_transfer_requests, agent_work_submissions, tour_operators,
-- tour_programs, tour_bookings, notifications, pending_sensitive_operations.
--
-- Every statement below is idempotent (DROP ... IF EXISTS + CREATE, or
-- CREATE OR REPLACE, or ALTER POLICY) and safe to re-run. Nothing here
-- drops a policy without installing an equal-or-stricter replacement.
-- See SECURITY_AUDIT_REPORT.md for full findings, severities, and
-- rationale for each fix below.
-- =========================================================================


-- =========================================================================
-- 0) Defensive re-assertion: RLS enabled on every in-scope table.
--    (All already enabled in prior migrations; re-stated here so this
--    migration is a self-contained, auditable baseline.)
-- =========================================================================
ALTER TABLE IF EXISTS public.applications                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.application_documents        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.application_messages         ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.application_notes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_roles                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staff_permissions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staff_2fa_codes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staff_recovery_codes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.staff_login_attempts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.payments                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.wallet_transactions           ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.refund_requests               ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_transfer_requests       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_work_submissions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tour_operators                ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tour_programs                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tour_bookings                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.notifications                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pending_sensitive_operations  ENABLE ROW LEVEL SECURITY;


-- =========================================================================
-- FIX 1 (CRITICAL): wallet_ledger_forgery
-- =========================================================================
-- The very first migration (20260125200416) created BOTH a service-role
-- insert path AND "Users can insert wallet transactions" (self-insert,
-- WITH CHECK user_id = own profile, arbitrary type/amount/balance_after).
-- Migration 20260618164459 tried to close the self-insert hole but its
-- DROP POLICY targeted the name "Only admins can insert wallet
-- transactions" -- a name that was never created in this codebase's
-- history. Because Postgres RLS policies are OR'd together, the original
-- 20260125200416 self-insert policy was NEVER actually removed and is
-- still live: any authenticated customer can fabricate wallet ledger rows
-- (fake deposits, arbitrary balance_after) via a direct PostgREST call.
DROP POLICY IF EXISTS "Users can insert wallet transactions" ON public.wallet_transactions;

-- Re-assert the intended service-role-only insert policy (idempotent).
DROP POLICY IF EXISTS "Only service role can insert wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Only service role can insert wallet transactions"
  ON public.wallet_transactions
  FOR INSERT
  TO service_role
  WITH CHECK (true);


-- =========================================================================
-- FIX 2 (HIGH): notification_spam_by_any_agent
-- =========================================================================
-- 20260410114820 added two narrow replacement policies ("Admins can
-- create notifications for others" / "Agents can notify assigned
-- application users") specifically to stop any agent from notifying any
-- arbitrary user. Its DROP POLICY targeted "Staff can create
-- notifications for others" -- a name that doesn't match the actual live
-- policy, "Authenticated users can create notifications for others"
-- (created in 20260125200433). That broad policy is still live today: any
-- agent can still insert a notification for any user_id via its
-- is_agent(auth.uid()) branch, the exact gap the later migration believed
-- it had closed. The two narrower replacement policies already cover
-- every legitimate insert path found in the frontend (admin pages +
-- agent's own assigned-application detail page), so dropping the broad
-- policy removes no functionality.
DROP POLICY IF EXISTS "Authenticated users can create notifications for others" ON public.notifications;


-- =========================================================================
-- FIX 3 (HIGH): wallet_balance_trigger_weak_role_check
-- =========================================================================
-- protect_profile_wallet_balance() (20260509105504) is still on the
-- pre-20260605133146 pattern of manually parsing
-- current_setting('request.jwt.claims', true)::json ->> 'role', the exact
-- pattern that migration explicitly replaced elsewhere with auth.role()
-- for consistency and to standardize on Supabase's own verified-session
-- accessor. Align this trigger with that established, already-audited
-- pattern.
CREATE OR REPLACE FUNCTION public.protect_profile_wallet_balance()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.wallet_balance IS DISTINCT FROM OLD.wallet_balance THEN
    IF auth.role() <> 'service_role' THEN
      NEW.wallet_balance := OLD.wallet_balance;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_wallet_balance_trigger ON public.profiles;
CREATE TRIGGER protect_profile_wallet_balance_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_wallet_balance();


-- =========================================================================
-- FIX 4 (HIGH): tour_operator_self_verify
-- =========================================================================
-- "Operators can update own profile" (20260725220044) only checks
-- user_id = auth.uid() -- it does not restrict which columns change. Since
-- is_verified also gates public visibility (tour_operators_public /
-- "Anyone can view approved programs"-style checks), any operator can
-- self-set is_verified = true, forge verified_by/verified_at, and rewrite
-- admin_notes via a normal UPDATE call, self-publishing without admin
-- review. Mirrors the existing trg_protect_document_verification_fields /
-- trg_protect_application_agent_assignment pattern (20260726144204).
CREATE OR REPLACE FUNCTION public.protect_tour_operator_verification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_staff boolean;
BEGIN
  v_is_staff := auth.role() = 'service_role'
             OR public.is_admin(auth.uid())
             OR public.has_permission(auth.uid(), 'manage_staff');

  IF NOT v_is_staff THEN
    NEW.is_verified := OLD.is_verified;
    NEW.verified_by := OLD.verified_by;
    NEW.verified_at := OLD.verified_at;
    NEW.admin_notes := OLD.admin_notes;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_tour_operator_verification ON public.tour_operators;
CREATE TRIGGER trg_protect_tour_operator_verification
BEFORE UPDATE ON public.tour_operators
FOR EACH ROW
EXECUTE FUNCTION public.protect_tour_operator_verification();


-- =========================================================================
-- FIX 5 (HIGH): tour_program_self_approve
-- =========================================================================
-- "Operators can update own programs" (20260725220044) is ownership-only,
-- no column restriction. The frontend (src/pages/tourism-portal/
-- MyPrograms.tsx) only ever writes status 'draft' or 'pending' -- it never
-- sets 'approved'/'rejected' -- confirming those transitions are meant to
-- be admin-only. Without DB enforcement, an operator could call the API
-- directly to self-approve a program (status = 'approved') or forge
-- rejection_reason, bypassing admin review entirely.
CREATE OR REPLACE FUNCTION public.protect_tour_program_review_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_staff boolean;
BEGIN
  v_is_staff := auth.role() = 'service_role'
             OR public.is_admin(auth.uid())
             OR public.has_permission(auth.uid(), 'manage_staff');

  IF NOT v_is_staff THEN
    -- Operators may only move their own program between draft <-> pending
    -- (submit for review / edit a draft). Only staff may approve/reject.
    IF NEW.status IS DISTINCT FROM OLD.status
       AND NEW.status NOT IN ('draft', 'pending') THEN
      NEW.status := OLD.status;
    END IF;

    -- rejection_reason is staff-authored only.
    NEW.rejection_reason := OLD.rejection_reason;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_tour_program_review_fields ON public.tour_programs;
CREATE TRIGGER trg_protect_tour_program_review_fields
BEFORE UPDATE ON public.tour_programs
FOR EACH ROW
EXECUTE FUNCTION public.protect_tour_program_review_fields();


-- =========================================================================
-- FIX 6 (MEDIUM): application_staff_fields_writable_by_owner
-- =========================================================================
-- "Users can update own draft applications" correctly limits customer
-- self-updates to rows currently in draft/documents_required, and
-- trg_protect_application_agent_assignment already locks assigned_agent_id.
-- But agent_notes, admin_notes, rejection_reason and approved_at are not
-- protected: while status stays in draft/documents_required, a customer
-- could set these staff-authored fields directly via the API. No known
-- customer-facing RPC (create_application_draft / create_whatsapp_order /
-- submit_application) ever writes these four columns, so protecting them
-- doesn't affect any legitimate flow.
CREATE OR REPLACE FUNCTION public.protect_application_staff_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_staff boolean;
BEGIN
  v_is_staff := auth.role() = 'service_role'
             OR public.is_admin(auth.uid())
             OR public.is_assigned_agent(NEW.id, auth.uid())
             OR public.has_permission(auth.uid(), 'manage_staff');

  IF NOT v_is_staff THEN
    NEW.agent_notes      := OLD.agent_notes;
    NEW.admin_notes      := OLD.admin_notes;
    NEW.rejection_reason := OLD.rejection_reason;
    NEW.approved_at      := OLD.approved_at;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_application_staff_fields ON public.applications;
CREATE TRIGGER trg_protect_application_staff_fields
BEFORE UPDATE ON public.applications
FOR EACH ROW
EXECUTE FUNCTION public.protect_application_staff_fields();


-- =========================================================================
-- FIX 7 (MEDIUM): message_content_not_actually_immutable
-- =========================================================================
-- application_messages carries the comment "messages are immutable" and
-- deliberately has no UPDATE-of-content or DELETE policy -- but the
-- existing "mark as read" UPDATE policies (customer/agent) only re-check
-- application ownership/assignment, not which columns change. Any sender
-- with UPDATE rights on a thread could rewrite historical content/
-- attachment fields, undermining the audit trail the immutability comment
-- assumes. Lock every column except is_read/read_at.
CREATE OR REPLACE FUNCTION public.protect_message_immutability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() <> 'service_role' THEN
    NEW.application_id  := OLD.application_id;
    NEW.sender_id        := OLD.sender_id;
    NEW.sender_type      := OLD.sender_type;
    NEW.sender_name      := OLD.sender_name;
    NEW.content          := OLD.content;
    NEW.priority         := OLD.priority;
    NEW.attachment_path  := OLD.attachment_path;
    NEW.attachment_name  := OLD.attachment_name;
    NEW.attachment_type  := OLD.attachment_type;
    NEW.created_at       := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_protect_message_immutability ON public.application_messages;
CREATE TRIGGER trg_protect_message_immutability
BEFORE UPDATE ON public.application_messages
FOR EACH ROW
EXECUTE FUNCTION public.protect_message_immutability();


-- =========================================================================
-- FIX 8 (LOW / robustness): unscoped policies calling anon-revoked helpers
-- =========================================================================
-- These policies were never given an explicit "TO authenticated" (unlike
-- their siblings, tightened in 20260719171825 / 20260618164459). Today
-- this is not an actual bypass -- the SECURITY DEFINER helper functions
-- they call have EXECUTE revoked from anon, so an anon request throws a
-- raw permission-denied error rather than a clean RLS deny -- but it's
-- inconsistent with the rest of the schema and relies on an incidental
-- side effect rather than an explicit role scope. ALTER POLICY is
-- non-destructive and idempotent.
ALTER POLICY "Admins can view all notes"                            ON public.application_notes        TO authenticated;
ALTER POLICY "Admins can insert notes"                               ON public.application_notes        TO authenticated;
ALTER POLICY "Agents can insert notes for assigned applications"     ON public.application_notes        TO authenticated;

ALTER POLICY "Agents can create transfer requests for assigned apps" ON public.agent_transfer_requests  TO authenticated;
ALTER POLICY "Agents can view own transfer requests"                 ON public.agent_transfer_requests  TO authenticated;
ALTER POLICY "Admins can view all transfer requests"                 ON public.agent_transfer_requests  TO authenticated;
ALTER POLICY "Admins can update transfer requests"                   ON public.agent_transfer_requests  TO authenticated;

ALTER POLICY "Agents can submit work for assigned apps"              ON public.agent_work_submissions   TO authenticated;
ALTER POLICY "Agents can view own work submissions"                  ON public.agent_work_submissions   TO authenticated;
ALTER POLICY "Admins can view all work submissions"                  ON public.agent_work_submissions   TO authenticated;
ALTER POLICY "Admins can update work submissions"                    ON public.agent_work_submissions   TO authenticated;
