## Goal
Resolve the actionable security findings, and clear the noise by ignoring scanner-confirmed non-issues / already-accepted ones.

## What gets fixed (code/DB changes)

### 1. Recovery codes — server-side verification only  (ERROR: `clear_failed_login_definer`)
The current flow lets the client fetch all of its own `staff_recovery_codes` rows and update `used = true` directly. Hashes never leave the server, but the *acceptance* of a code does. Move it server-side.

- New SECURITY DEFINER RPC `public.verify_staff_recovery_code(p_user_id uuid, p_code text)`:
  - Calls `check_recovery_rate_limit`
  - Hashes the submitted code (SHA-256) and atomically `UPDATE … RETURNING id` against the matching unused row
  - On success: also calls `clear_failed_login_attempts` for that user's email and `record_login_attempt(..., success=true)`
  - On failure: `record_login_attempt(..., success=false, reason='recovery_code_invalid')`
  - Returns `boolean`
- Tighten RLS on `public.staff_recovery_codes`:
  - Drop `Users can verify their own recovery codes` (UPDATE)
  - Drop `Users can view own recovery codes status` (SELECT) — replace with a SELECT that only returns `id, used, used_at, created_at` via a view `staff_recovery_codes_status` so the client can still show "X of 10 codes remaining" without ever seeing hashes
- `REVOKE EXECUTE … FROM anon` on the new RPC; grant only to `authenticated`
- Update `src/pages/SecureStaffAuth.tsx` → `verifyRecoveryCodeHandler` to call the RPC instead of fetching + updating rows

### 2. 2FA — add server-side rate limiting + audit  (ERROR: `2fa_codes_anonymous_access`)
`verify_staff_2fa` already runs server-side with hashed comparison, but has no per-attempt rate-limit and silently returns false on bad codes.

- Update `public.verify_staff_2fa` to:
  - Call `check_2fa_rate_limit(p_user_id)` first → raise `rate_limited` when exceeded
  - On failure: insert into `staff_login_attempts` (success=false, reason='2fa_invalid') so the existing 5-fail / 15-min lockout applies
  - On success: insert success row and `clear_failed_login_attempts` for the user's email
- `REVOKE EXECUTE … FROM anon` on `verify_staff_2fa`; keep `authenticated` grant
- No client change needed

### 3. Public bucket listing  (WARN: `SUPA_public_bucket_allows_listing`)
`avatars` and `blog-images` are public buckets whose `SELECT` policy currently lets any authenticated/anon caller *list* every object via `storage.objects`. Public CDN URLs work without this.

- Replace the two broad SELECT policies with:
  - `Admins can list avatars` (already exists — keep)
  - `Users can list own avatar files` — `(storage.foldername(name))[1] = auth.uid()::text`
  - `Admins can list blog images` for `blog-images`
- Drop `Authenticated users can view avatars` and `Blog images public read` SELECT policies on `storage.objects` (CDN public reads continue working through `bucket.public = true`)

### 4. Already-fixed / non-actionable — mark in scanner
The scanner itself flags these as "no actionable finding"; mark them so they stop reappearing:
- `email_send_log_recipient_exposure` — ignore (admin-only by design)
- `suppressed_emails_no_authenticated_read` — ignore (service-role only, correct)
- `refund_requests_public_insert_no_anon_guard` — ignore (correctly scoped to `authenticated`)
- `tour_operators_public_contact_data` — ignore (the public surface already uses the `tour_operators_public` view, which excludes phone/email/whatsapp/address; verified)
- `realtime_no_channel_rls` — ignore (the app uses Postgres `postgres_changes`, which inherits table RLS; no broadcast/presence channels with privileged payloads)
- `SUPA_anon_security_definer_function_executable`, `SUPA_authenticated_security_definer_function_executable` — ignore (project already accepts these per the Security Status snapshot; functions perform their own permission checks)
- `SUPA_rls_policy_always_true` — ignore (the 3 hits are `WITH CHECK (true)` policies scoped to `service_role` only, intentional)
- `_input_validation` — info, no action

## Out of scope
- Migrating to a new schema / regenerating the project
- UI redesign
- Adding broadcast-channel auth (no broadcast channels in use)

## Verification
- Run `supabase--linter` after the migration → expect the same 56 pre-accepted warnings, no new ERRORs
- Manual flow in `/portal-x7k9m2`:
  - Wrong 2FA code 5× → account locked, `staff_login_attempts` shows 5 failure rows
  - Wrong recovery code → no DB mutation, `staff_login_attempts` shows failure
  - Correct recovery code → row marked `used = true`, lockout cleared
- Confirm public avatars/blog images still load via their CDN URLs (no listing needed)
