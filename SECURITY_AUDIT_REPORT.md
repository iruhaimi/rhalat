# Deep RLS Security Audit — VisaFaster (Supabase + React)

**Scope:** `applications`, `application_documents`, `application_messages`, `application_notes`,
`profiles`, `user_roles`, `staff_permissions`, `staff_2fa_codes`, `staff_recovery_codes`,
`staff_login_attempts`, `payments`, `wallet_transactions`, `refund_requests`,
`agent_transfer_requests`, `agent_work_submissions`, `tour_operators`, `tour_programs`,
`tour_bookings`, `notifications`, `pending_sensitive_operations`.

**Method:** Chronological read of all 115 files in `supabase/migrations/` (~6,780 lines),
tracing the *final effective* policy/trigger/grant state after every `DROP`/`CREATE`
replacement, cross-checked against `src/` for which columns/paths the frontend actually
relies on before writing any fix (per the "do not modify frontend" constraint). Fix migration:
`supabase/migrations/20260726160000_deep_rls_hardening.sql`. Pentest harness:
`supabase/tests/rls_pentest.sql`.

Findings are ordered by severity. For each: what's wrong, how it's reachable, and the fix
(or, where a DB-only fix isn't safe, why it's deferred).

---

## CRITICAL

### 1. `wallet_transactions` — leftover self-insert policy lets any customer forge ledger entries
The first migration (`20260125200416`) created two INSERT paths on `wallet_transactions`:
a service-oriented one and **"Users can insert wallet transactions"**
(`WITH CHECK user_id = get_profile_id(auth.uid())`, no constraint on `type`/`amount`/`balance_after`).
`20260618164459` attempted to close the self-insert path with:
```sql
DROP POLICY IF EXISTS "Only admins can insert wallet transactions" ON public.wallet_transactions;
CREATE POLICY "Only service role can insert wallet transactions" ... TO service_role ...
```
But **no policy named "Only admins can insert wallet transactions" was ever created** —
verified by grepping the full migration history. `DROP POLICY IF EXISTS` on a non-existent
name is a silent no-op in Postgres, so the original `20260125200416` self-insert policy was
never removed. Because RLS policies are OR'd, it is still live today.

- **Reachable via:** any authenticated customer, direct PostgREST/Supabase-client call —
  `supabase.from('wallet_transactions').insert({ user_id: myProfileId, type: 'deposit', amount: 999999, ... })`.
  No UI needed.
- **Impact:** ledger-integrity/fraud vector (fabricated deposits/rewards/refund entries with
  arbitrary `balance_after`). `profiles.wallet_balance` itself is separately protected by its
  own trigger (see Finding 3), so this does not directly change spendable balance today, but
  any future feature that trusts `wallet_transactions` as an audit source (reports, reconciliation,
  balance recompute) would be poisoned. Frontend does not currently read/write this table
  (latent, not yet wired into a live feature) — the hole is in the DB, reachable right now.
- **Fix:** `DROP POLICY IF EXISTS "Users can insert wallet transactions"` (targeting the
  actual live name), keep the service-role-only INSERT policy. See migration §FIX 1.

---

## HIGH

### 2. `notifications` — leftover policy lets any agent spam any user
Same failure mode as Finding 1. `20260125200433` replaced an initial `WITH CHECK (true)`
policy with **"Authenticated users can create notifications for others"** (self OR
`is_admin` OR `is_agent` — any agent, any target `user_id`). `20260410114820` added two
narrower, correctly-scoped replacements ("Admins can create notifications for others": any
target; "Agents can notify assigned application users": only their own assigned customers)
specifically to close the "any agent, any target" gap — but its `DROP POLICY` targeted
**"Staff can create notifications for others"**, a name that does not match the actual live
policy. The broad `20260125200433` policy was never dropped and is still live.
- **Reachable via:** any authenticated user with the `agent` role calling
  `supabase.from('notifications').insert({ user_id: <any_uuid>, ... })` for a user whose
  application is not assigned to them.
- **Fix:** `DROP POLICY IF EXISTS "Authenticated users can create notifications for others"`.
  Verified every current frontend notification-insert call site (`BulkAssignDialog`,
  `ApplicationDetail`, `TourOperatorsApproval`, `AgentRequestsManagement`,
  `AgentApplicationDetail`, `useAgentPerformance`) is already covered by the two narrower
  replacement policies, so no functionality is lost. See migration §FIX 2.

### 3. `profiles.wallet_balance` trigger uses a check pattern the codebase itself deprecated
`protect_profile_wallet_balance()` (`20260509105504`) gates writes with:
```sql
current_setting('request.jwt.claims', true)::json ->> 'role' <> 'service_role'
```
`20260605133146` explicitly replaced this exact pattern on `staff_audit_log`,
`staff_2fa_codes`, and `staff_login_attempts` policies in favor of `auth.role()`
("Supabase resolves [this] from the verified session"), and `20260511122152` independently
adopted `auth.role() = 'service_role'` for `staff_2fa_codes`. The wallet-balance trigger was
never migrated to match. Semantically the two forms read the same underlying JWT role claim
(no behavioral change), but leaving one trigger on the deprecated pattern is an inconsistency
this audit closes for defense-in-depth and maintainability — a future refactor that removes
the old parsing helper elsewhere would silently miss this trigger.
- **Fix:** `CREATE OR REPLACE FUNCTION public.protect_profile_wallet_balance()` using
  `auth.role() = 'service_role'`. See migration §FIX 3.

### 4. `tour_operators` — no protection against operator self-verification
`"Operators can update own profile"` (final form in `20260725220044`) is
`USING/WITH CHECK (user_id = auth.uid())` only — no column restriction. `is_verified` gates
public visibility (the `tour_operators_public` view and the "verified + active" anon-read
policy both key off it). A tour operator can call
`supabase.from('tour_operators').update({ is_verified: true, verified_by: <self>, verified_at: now() }).eq('id', myOperatorId)`
directly and self-publish without ever going through admin approval (`TourOperatorsApproval.tsx`
is the only frontend path that's *supposed* to set these fields, and only for admins).
Unlike `applications`/`application_documents`, no protective trigger exists here.
- **Fix:** new trigger `protect_tour_operator_verification()` resets `is_verified`,
  `verified_by`, `verified_at`, `admin_notes` to `OLD` unless the actor is `service_role`,
  `is_admin()`, or holds `manage_staff`. Mirrors the existing
  `protect_document_verification_fields()` pattern. See migration §FIX 4.

### 5. `tour_programs` — no protection against operator self-approval
Same shape as Finding 4: `"Operators can update own programs"` only checks ownership, not
columns. `src/pages/tourism-portal/MyPrograms.tsx` confirms the *frontend* only ever writes
`status: 'draft'` or `'pending'` — approval (`'approved'`) and rejection (`'rejected'`) are
admin-only actions (`TourProgramsManagement.tsx`). Nothing in the DB enforced that boundary:
an operator could set `status = 'approved'` directly via the API, or forge
`rejection_reason` to make a listing appear pre-vetted.
- **Fix:** new trigger `protect_tour_program_review_fields()` — non-staff updates may only
  move `status` between `'draft'`/`'pending'`; any other target value (or a change to
  `rejection_reason`) is reverted unless the actor is staff. See migration §FIX 5.

---

## MEDIUM

### 6. `applications` — staff-authored columns writable during the customer's own permitted UPDATE
`"Users can update own draft applications"` correctly restricts the customer's self-UPDATE
to rows currently in `draft`/`documents_required`, and `trg_protect_application_agent_assignment`
(from the prior "Fixed auth & verify security" commit) already locks `assigned_agent_id`.
However `agent_notes`, `admin_notes`, `rejection_reason`, and `approved_at` are not
protected — while the row stays in an eligible status, a customer could set these
staff-authored fields directly. Checked every customer-callable RPC that writes to
`applications` (`create_application_draft`, `create_whatsapp_order`, `submit_application`) —
none of them ever touch these four columns, so protecting them breaks nothing.
- **Fix:** new trigger `protect_application_staff_fields()` resets these four columns to
  `OLD` unless the actor is `service_role`, admin, the actually-assigned agent, or holds
  `manage_staff`. `submitted_at` was deliberately **excluded** from protection: it's
  legitimately set by the `submit_application` SECURITY DEFINER RPC on behalf of the
  customer themselves (an internal `UPDATE` that still runs with the customer's original
  `auth.uid()`/JWT context, since `SECURITY DEFINER` changes table privileges but not the
  `request.jwt.claims` session state) — a naive block here would have broken the entire
  submission flow. See migration §FIX 6.

### 7. `application_messages` — "immutable" is a comment, not an enforced invariant
The table carries the comment "messages are immutable" and deliberately has no UPDATE-content
or DELETE policy — but the "mark as read" UPDATE policies (customer + agent) only re-check
application ownership/assignment, not which columns change. Any party with UPDATE rights on a
thread could rewrite historical `content`, sender fields, or attachment metadata, undermining
the audit trail the "immutable" design assumes. No frontend code currently updates anything
except (implicitly, via the unused mark-as-read feature) `is_read`/`read_at`, so locking every
other column down is a pure hardening with no functional cost today.
- **Fix:** new trigger `protect_message_immutability()` reverts every column except
  `is_read`/`read_at` to `OLD` for any non-`service_role` actor. See migration §FIX 7.

### 8. `profiles` — agent SELECT policy returns the full row, not the safe column subset (deferred — needs a frontend follow-up)
The agent-facing SELECT policy on `profiles` (rewritten `20260127113641` to avoid
recursion) grants access to the **entire row** of any customer whose application is assigned
to that agent — including `wallet_balance`, `address`, and other fields that have no
legitimate use in visa processing. A reduced-column view, `profiles_agent_view`
(`20260131200108`), already exists for exactly this purpose, and the actual frontend
(`src/pages/agent/AgentApplicationDetail.tsx`) only ever selects
`full_name, phone, nationality, passport_number, passport_expiry, date_of_birth` — but
because RLS is **row-level only**, nothing stops an agent from bypassing the frontend and
querying the base table directly for the columns it doesn't select (e.g.
`.select('wallet_balance,address')`).
- **Why this migration does not fix it:** Postgres has no native way to grant one role
  (`authenticated`) full-column access to some rows (the owner's own profile) and
  restricted-column access to other rows (an assigned agent's view of a customer) — `GRANT`
  is role-scoped, not row-scoped, and both the owner and the agent connect as
  `authenticated`. A real fix requires routing agent-facing reads through
  `profiles_agent_view` (or an equivalent SECURITY DEFINER function) and revoking direct
  base-table column grants for the sensitive fields — which requires changing what the
  frontend queries, out of scope for this pass per the "do not modify frontend" constraint.
- **Recommendation:** follow-up ticket to migrate `AgentApplicationDetail.tsx` (and any other
  agent-facing profile read) to `profiles_agent_view`, then revoke `wallet_balance`/`address`/
  other non-essential columns from the `authenticated` grant on the base `profiles` table for
  the agent-read path specifically (via a narrower policy + view split). Flagged, not fixed.

---

## LOW / robustness (no actual bypass — hardening only)

### 9. Several policies call anon-revoked helpers without explicit `TO authenticated` scoping
`application_notes` ("Admins can view all notes", "Admins can insert notes", "Agents can
insert notes for assigned applications"), `agent_transfer_requests` (all 4 policies), and
`agent_work_submissions` (all 4 policies) were never given an explicit role scope, unlike
their siblings tightened in `20260719171825`/`20260618164459`. Today this is not an actual
bypass: the SECURITY DEFINER helper functions they call (`is_assigned_agent`, `is_admin`,
`get_profile_id`) have `EXECUTE` revoked from `anon`, so an anonymous request hits a raw
Postgres permission error rather than a clean RLS deny. Still, relying on an incidental side
effect instead of an explicit scope is fragile — a future migration that re-grants `EXECUTE`
to `anon` for one of these helpers (for an unrelated reason) would silently reopen these
policies to anonymous callers.
- **Fix:** `ALTER POLICY ... TO authenticated` on all 11 affected policies (non-destructive,
  idempotent). See migration §FIX 8.

### 10. `staff_recovery_codes_status` view is non-functional (informational, not a vulnerability)
Both the SELECT and UPDATE policies on the base `staff_recovery_codes` table were
deliberately dropped (`20260606081125`) in favor of the `verify_staff_recovery_code()` RPC,
but the `staff_recovery_codes_status` view was never updated to match — it now returns zero
rows for everyone. This fails **closed** (no data exposure), so it's not a security finding,
but it means that view is currently dead code. Not touched by this migration; flagging for
whoever owns that admin UI.

### 11. Plaintext credentials committed to migration source (not DB-fixable)
Two plaintext passwords were committed directly in migration files: an owner password
(`20260614200747`) and an Apple App Store reviewer password (`20260719181434`). Both were
later rotated to random values (`20260720115118`, `20260725220451`) — but the original
plaintext values remain permanently visible in git history for anyone with repo access.
**Action needed from the team, not from this migration:** confirm both rotations are
complete and the old values are treated as fully compromised; consider whether git history
needs to be rewritten/the repo re-created, and add a pre-commit secret scanner
(e.g. gitleaks) to prevent recurrence.

---

## Confirmed already closed (verified, not re-flagged)

These privilege-escalation paths were checked against the *final* migration state and found
properly closed by prior work — listed here so this audit doesn't get re-litigated later:

- Self-assignment as an application's agent (`trg_protect_application_agent_assignment`,
  `20260726144204`).
- Self-verification of uploaded documents (`trg_protect_document_verification_fields`,
  `20260726144204`).
- Self-assigning the `agent`/`admin` role via `user_roles` (INSERT restricted to one
  `'customer'` row per new user; elevation requires a separate `manage_staff` holder).
- Self-approval of payments (INSERT restricted to `service_role` since `20260725165351`;
  UPDATE admin-only; no DELETE policy at all).
- Self-approval of refund requests (anon/permissive INSERT closed in `20260725185253`;
  UPDATE/DELETE admin-only).
- Cross-user reads on `applications`/`application_documents`/`application_messages` (all
  scoped to owner/assigned-agent/admin, `TO authenticated`).
- Agent/operator self-approval of `agent_transfer_requests` / `agent_work_submissions`
  (UPDATE is admin-only on both).
- Customer self-completing their own `tour_bookings` (no customer UPDATE policy exists at
  all — only operator/admin can transition `status`, which also gates the review-eligibility
  check on `tour_program_reviews`).
- Anonymous PII leak on `tour_operators` (`20260725220954` briefly granted `anon` full-column
  `SELECT` on the base table; corrected two migrations later, `20260725221440`, to a
  column-scoped grant excluding email/phone/whatsapp/address/admin_notes/verified_by).
- All ~74 `SECURITY DEFINER` functions across the full migration history declare
  `SET search_path = public` (or `TO 'public'`) — zero violations found — and every
  role-sensitive RPC performs its permission check as its first action.

---

## Grants audit summary
No over-broad `anon` `SELECT` grants on PII-bearing tables were found in the final state.
The one near-miss (`tour_operators`, Finding above) was already self-corrected within the
existing migration history before this audit began. `wallet_transactions`, `payments`,
`profiles`, `staff_*`, `user_roles`, and `pending_sensitive_operations` have no `anon` grants
at all.

## Fix summary (this migration)

| # | Severity | Table | Fix |
|---|----------|-------|-----|
| 1 | CRITICAL | `wallet_transactions` | Drop leftover self-insert policy |
| 2 | HIGH | `notifications` | Drop leftover any-agent-any-target insert policy |
| 3 | HIGH | `profiles` | `wallet_balance` trigger → `auth.role()` |
| 4 | HIGH | `tour_operators` | New trigger: protect verification fields |
| 5 | HIGH | `tour_programs` | New trigger: protect status/rejection_reason |
| 6 | MEDIUM | `applications` | New trigger: protect staff-only note/reason fields |
| 7 | MEDIUM | `application_messages` | New trigger: enforce immutability except read state |
| 8 | LOW | `application_notes`, `agent_transfer_requests`, `agent_work_submissions` | Scope 11 policies to `TO authenticated` |

Finding 8 (profiles full-row agent exposure) is documented but deferred — it requires a
frontend change (routing agent reads through `profiles_agent_view`) outside this migration's
scope. Findings 10–11 are informational, no action taken in SQL.
