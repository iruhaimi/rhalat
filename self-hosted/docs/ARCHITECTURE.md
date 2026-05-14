# Architecture

```
              ┌─────────────────┐
 Internet ──► │  Caddy (TLS)    │ ──► frontend (Nginx + React build)
              │  /api/*  ───────┼─► backend (Fastify)
              └─────────────────┘          │
                                           ├─► PostgreSQL 16  (data + audit)
                                           ├─► Redis 7        (sessions, queue)
                                           └─► MinIO (S3)     (documents, avatars)

 Monitoring stack (separate compose file):
    Promtail ──► Loki ──► Grafana ◄── Prometheus  +  Uptime Kuma
```

## Layers

- **Edge**: Caddy terminates TLS via Let's Encrypt, redirects www → apex, sets HSTS/CSP, rate-limits `/api/auth/*`.
- **Frontend**: Static SPA from Vite build, served by Nginx with SPA fallback.
- **Backend**: Fastify + TypeScript. Modules: `auth`, `files`, `applications`, `notifications`, `admin`. Sessions via Lucia + Prisma adapter (cookies httpOnly).
- **Auth**: Email + password (Argon2id), email-2FA for staff (10-min code, SHA-256 stored), recovery codes (SHA-256, immutable), Google OAuth via Arctic.
- **Database**: PostgreSQL 16. Roles in a separate `user_roles` table. `audit_log` is immutable (triggers block UPDATE/DELETE). `wallet_balance` protected by trigger. `recovery_codes` hashes immutable. Last super_admin/admin cannot be removed.
- **Storage**: MinIO with three buckets (`documents` private+SSE, `avatars` private+SSE, `public` anonymous read). All access through presigned URLs minted by backend after RBAC check.
- **Jobs**: `email-queue` worker (cron every minute) drains `email_queue` table with retry + suppression.
- **Observability**: Promtail tails Docker container JSON logs → Loki. Prometheus scrapes backend `/metrics`. Grafana dashboards. Uptime Kuma external pings.

## Why no third-party SaaS

- No Lovable, Supabase, Firebase, Vercel, Auth0.
- All dependencies are free open-source and run inside Docker on a VPS you own.
- Migration to a different VPS = `git clone` + restore restic snapshots = under 30 minutes.