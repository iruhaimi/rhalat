## الهدف

إنشاء حزمة "Self-Hosted Rebuild" كاملة داخل مجلد جديد `self-hosted/` في المشروع الحالي، بحيث يمكن نقلها إلى أي VPS وتشغيل المنصة بالكامل بدون Lovable أو Supabase أو أي طرف ثالث.

⚠️ **ملاحظة مهمة قبل التنفيذ:** هذه الحزمة ستكون **سكافولد/قوالب جاهزة** (Boilerplate)، وليست إعادة بناء كامل لكل مزايا VisaFaster (التي بُنيت على مدى أسابيع وتحوي 200+ ملف). إعادة بناء كل المنطق الوظيفي في مهمة واحدة غير واقعي وسيؤدي لكود مكسور. الحزمة ستوفر:

- بنية تحتية كاملة وتعمل (Docker, DB, Auth, Storage, CI/CD, Monitoring, Backup)
- Schema قاعدة بيانات مطابق لمنطق VisaFaster
- نقاط ربط جاهزة (Auth + RBAC + Files) لإعادة بناء صفحات الواجهة فوقها لاحقاً

---

## الهيكل النهائي

```text
self-hosted/
├── README.md
├── SELF_HOSTED_REBUILD_PROMPT.md
├── .env.example
├── docker-compose.yml
├── docker-compose.prod.yml
├── Caddyfile
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── migrations/0001_init/migration.sql
│   └── src/
│       ├── server.ts                  (Fastify + plugins)
│       ├── lib/{db,redis,minio,lucia,mailer}.ts
│       ├── auth/{routes,2fa,recovery-codes,oauth}.ts
│       ├── middleware/{rbac,rate-limit,audit}.ts
│       ├── modules/
│       │   ├── users/
│       │   ├── applications/
│       │   ├── files/                (presigned upload/download)
│       │   ├── notifications/
│       │   └── admin/
│       └── jobs/{email-queue,cleanup}.ts
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│       ├── main.tsx, App.tsx
│       ├── lib/{api,auth}.ts
│       └── pages/{Login,Register,TwoFactor,Dashboard,Files}.tsx
├── infrastructure/
│   ├── caddy/Caddyfile
│   ├── backups/{backup.sh,restore.sh,disaster-recovery.sh}
│   ├── monitoring/
│   │   ├── docker-compose.monitoring.yml   (Grafana, Loki, Promtail, Prometheus, Uptime Kuma)
│   │   ├── prometheus.yml
│   │   ├── loki-config.yml
│   │   └── promtail-config.yml
│   ├── ci/
│   │   ├── .gitea/workflows/deploy.yml
│   │   └── deploy.sh
│   └── minio/init-buckets.sh
└── docs/
    ├── ARCHITECTURE.md
    ├── DEPLOYMENT.md
    ├── DISASTER_RECOVERY.md
    └── SECURITY.md
```

---

## ما سيُنفَّذ بالتفصيل

### 1) `SELF_HOSTED_REBUILD_PROMPT.md`
حفظ الـ prompt المطوَّل (نسخة محدّثة مفصّلة) كمرجع.

### 2) Docker Compose كامل
- `postgres:16-alpine` (مع volume + healthcheck)
- `redis:7-alpine` (للـ sessions/queue/pubsub)
- `minio/minio` + `minio/mc` لتهيئة الـ buckets تلقائياً (`documents`, `avatars`, `public`)
- `backend` (Node 20 + Fastify)
- `frontend` (Nginx يقدّم build الـ Vite)
- `caddy:2` (SSL تلقائي عبر Let's Encrypt + reverse proxy + redirects)
- شبكات داخلية، healthchecks، ومتغيرات بيئة من `.env`

### 3) Schema قاعدة البيانات (Prisma + SQL migration)
جداول مطابقة لمنطق المشروع الحالي:
- `users` (id, email, password_hash, email_verified, created_at)
- `sessions` (Lucia: id, user_id, expires_at, ip, user_agent)
- `roles` (enum: customer, agent, admin, super_admin, tour_operator)
- `user_roles` (user_id, role) — جدول منفصل (نفس قاعدة "لا تخزّن الدور في profiles")
- `staff_permissions` (user_id, permission)
- `profiles` (full_name, phone, nationality, passport_*, wallet_balance...)
- `countries`, `visa_types`
- `applications` (status enum مطابق للحالي)
- `application_documents` (مرتبط بـ MinIO object key)
- `application_status_history`
- `payments`, `wallet_transactions`
- `notifications`
- `staff_2fa_codes`, `recovery_codes` (مخزنة كـ SHA-256)
- `audit_log` (immutable, append-only — لا UPDATE/DELETE عبر trigger)
- `email_queue`, `email_log`
- Indexes + Foreign keys + Triggers (منع حذف آخر super_admin، حماية wallet_balance)

### 4) Lucia Auth + Security
- تسجيل/دخول/خروج بـ password hash (Argon2id)
- Sessions بكوكيز `httpOnly`, `Secure`, `SameSite=Lax`
- 2FA عبر بريد (كود 6 أرقام، انتهاء 10 دقائق، 5 محاولات ثم قفل 15 دقيقة)
- Recovery codes: 10 أكواد، تُعرض مرة واحدة، مخزنة SHA-256
- OAuth (Google) عبر Arctic
- CAPTCHA (hCaptcha) في endpoints الحساسة
- Rate limiting على /auth/*

### 5) MinIO Integration
- Buckets: `documents` (private)، `avatars` (private with presigned read)، `public` (public-read للوغو/أعلام)
- Server-side encryption (SSE-S3)
- Backend endpoints: `POST /files/presigned-upload` و `GET /files/presigned-download/:id`
- التحقق من الصلاحية (الوكيل لا يرى ملفات غير المُسندة له)
- مكوّن React `<FileUpload />` يستخدم presigned URL مباشرة

### 6) CI/CD + Backups + Disaster Recovery
- ملف Gitea Actions (`deploy.yml`): build → push → ssh deploy → `docker compose pull && up -d` → migrate → healthcheck
- `backup.sh`: `pg_dump` يومي + `restic` لـ MinIO + رفع لتخزين منفصل (S3/Backblaze)
- `restore.sh` + `disaster-recovery.sh`: استرجاع كامل في < 30 دقيقة موثَّق خطوة بخطوة
- Cron jobs داخل container منفصل

### 7) Monitoring Stack
- `docker-compose.monitoring.yml` يضم: Grafana + Loki + Promtail (يجمع logs من كل containers) + Prometheus + Uptime Kuma + Sentry self-hosted (اختياري)
- Dashboards جاهزة لـ Postgres/Redis/Backend
- تنبيهات على: backend down, DB connections > 80%, disk > 85%, failed logins spike

### 8) Caddyfile
- SSL تلقائي
- Redirect: `lovable.app → visafaster.com`، `www → apex`
- Reverse proxy: `/api/*` → backend, البقية → frontend
- Headers أمنية (HSTS, CSP, X-Frame-Options)
- Rate limiting على `/api/auth/*`

---

## ما **لن** يُنفَّذ في هذه المهمة (وتحتاج جلسات لاحقة)

- نقل كل صفحات React الحالية (200+ ملف) إلى `self-hosted/frontend/` — سيُترك كقوالب أساسية فقط
- ترجمة كل Edge Functions الـ 14 إلى Fastify routes كاملة الوظيفة — ستكون stubs مع TODO
- بناء كل لوحات Admin/Agent/Tourism — ستكون pages أساسية للتأكد من عمل Auth+Files
- Capacitor mobile build, OneSignal, Despia — موثَّقة فقط في `docs/`

سيتم توضيح هذا صراحة في `README.md` و`docs/ARCHITECTURE.md` مع خارطة طريق للهجرة.

---

## التحقق بعد التنفيذ

- `docker compose config` يمر بدون أخطاء
- `prisma validate` على الـ schema يمر
- بناء صور Docker (محلياً) يمر بدون أخطاء — لن يُشغَّل الـ stack داخل sandbox Lovable
- ملفات `.sh` تُمنح صلاحية تنفيذ
- توثيق DEPLOYMENT.md يحوي الأوامر الفعلية للنشر على VPS جديد

---

## بعد موافقتك

سأنفّذ كل ما سبق دفعة واحدة في جلسة build التالية. لن يلمس أي شيء داخل الكود الحالي للموقع المنشور — كل شيء سيُضاف داخل مجلد `self-hosted/` معزول تماماً.
