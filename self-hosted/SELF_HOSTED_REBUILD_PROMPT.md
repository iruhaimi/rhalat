# SELF_HOSTED_REBUILD_PROMPT

مرجع لإعادة بناء منصة "عطلات رحلاتكم" (VisaFaster) على بنية تحتية ذاتية الاستضافة دون أي اعتماد على Lovable / Supabase / SaaS مغلقة.

## Stack
- Ubuntu 22.04 + Docker Compose
- Caddy 2 (SSL تلقائي)
- Frontend: React 18 + Vite + TS + Tailwind + shadcn + Framer Motion
- Backend: Node 20 + Fastify + TS + Prisma
- DB: PostgreSQL 16
- Cache/Queue: Redis 7 + BullMQ
- Storage: MinIO (SSE-S3)
- Auth: Lucia + Arctic (Google OAuth) + Argon2id
- Email: Nodemailer + queue table + cron
- Monitoring: Grafana + Loki + Promtail + Prometheus + Uptime Kuma
- CI/CD: Gitea Actions → SSH deploy
- Backups: pg_dump + restic إلى S3 خارجي

## وظائف إلزامية
RBAC (5 أدوار) في `user_roles` — بوابة موظفين على مسار سري — معالج طلبات 3 خطوات — لوحات لكل دور — 2FA بريد + recovery codes SHA-256 — Two-Person Rule — عروض/خصومات — Refund tracker — CMS بـ JSONB — WhatsApp + realtime — تصدير Excel/ZIP — PDPL — SEO — PWA لاحقاً.

## أمن إلزامي
Argon2id — Sessions httpOnly+Secure+SameSite — جميع `SECURITY DEFINER` بـ `search_path=public` — triggers لمنع حذف آخر admin، حماية wallet، audit immutable — rate limit — hCaptcha — HSTS+CSP — login attempts + 15min lockout.

## هيكل
موجود في هذا المجلد `self-hosted/` كمرجع جاهز.

## معايير القبول
- `docker compose up -d` يعمل بدون تدخل.
- `/health` يرد `{ok:true}` خلال 90 ث.
- تسجيل + دخول + 2FA + رفع MinIO نهاية لنهاية.
- DR < 30 دقيقة على VPS فارغ.
- لا أي SaaS مغلق في الكود.