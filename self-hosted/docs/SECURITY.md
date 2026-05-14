# Security

- **Argon2id** password hashing.
- **Lucia sessions**: cookies httpOnly + Secure + SameSite=Lax + Domain scoped.
- **2FA for staff**: 6-digit email code, SHA-256 hashed, expires 10 min.
- **Recovery codes**: SHA-256, immutable hashes (DB trigger).
- **RBAC**: roles in dedicated `user_roles` table — never on profiles.
- **Triggers**: prevent removing last super_admin/admin; protect wallet_balance; audit_log immutable.
- **Rate limiting**: 200/min/IP global; tighter on `/api/auth/*`.
- **Login attempts** logged with IP+UA. 5 failures in 15 min → 15 min lockout.
- **MinIO**: SSE-S3 encryption, presigned URLs only (5–10 min), every download audited (PDPL).
- **Caddy**: TLS 1.2+, HSTS preload, X-Frame-Options=SAMEORIGIN, Referrer-Policy.
- **Backups**: restic encrypted at rest with `RESTIC_PASSWORD`, offsite, 7d/4w/6m retention.