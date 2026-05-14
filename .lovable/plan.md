
# خطة: إنشاء `CLAUDE_MASTER_REBUILD_PROMPT.md`

## الهدف
ملف واحد ضخم (~40-60 ألف كلمة) تعطيه لـ Claude (أو أي LLM متقدم) فيقوم ببناء **visafaster.com** كاملاً من الصفر — Frontend + Backend + DB + DevOps + Mobile — بحيث **كل البيانات والكود تحت سيطرتك أنت فقط** على VPS خاص، بدون Lovable ولا Supabase ولا أي SaaS مغلق.

## مكان الملف
`self-hosted/CLAUDE_MASTER_REBUILD_PROMPT.md` (بجانب `SELF_HOSTED_REBUILD_PROMPT.md` الموجود حالياً، لكن أعمق بكثير).

## بنية الملف (14 قسم)

### 1. Identity & Mission (هوية المشروع)
- اسم العلامة: "عطلات رحلاتكم" / VisaFaster
- الجمهور: عملاء سعوديون، RTL أساسي
- المهمة: منصة طلبات تأشيرات + برامج سياحية
- شرط مطلق: **صفر اعتماد على طرف ثالث مغلق**. قائمة سوداء صريحة (Lovable, Supabase, Firebase, Vercel, Netlify, Auth0, Clerk, RevenueCat).

### 2. Non-Negotiable Constraints (قيود حازمة)
- PDPL (نظام حماية البيانات السعودي) — جوازات في تخزين سعودي
- لا Apple IAP — كل الدفع عبر متصفح
- Argon2id فقط للباسوورد
- جميع `SECURITY DEFINER` بـ `search_path=public`
- Roles في جدول `user_roles` منفصل (لا في profiles)
- Audit log immutable عبر triggers
- Two-Person Rule للعمليات الحساسة

### 3. Tech Stack (مفصّل بأرقام إصدارات)
- Frontend: React 18.3 + Vite 5 + TS 5.6 + Tailwind 3 + shadcn + Framer Motion + React Query + React Router 6
- Backend: Node 20 + Fastify 4 + Prisma 5 + Lucia 3 + Arctic + Zod
- DB: PostgreSQL 16 + Citext
- Cache/Queue: Redis 7 + BullMQ
- Storage: MinIO (SSE-S3) + STC Object Storage للبيانات الحساسة
- Email: Nodemailer + queue + DKIM/SPF/DMARC
- Mobile: Despia wrapper + OneSignal
- Infra: Ubuntu 22.04 + Docker Compose + Caddy 2 + Cloudflare CDN
- Monitoring: Grafana + Loki + Prometheus + Uptime Kuma
- CI: Gitea Actions

### 4. Domain Model (الكيانات الكاملة)
سرد كل جدول مطلوب مع أعمدته الأساسية:
users, sessions, user_roles, profiles, profiles_agent_view (masked), staff_2fa_codes, recovery_codes, login_attempts, applications, application_documents, application_messages, application_status_history, document_access_log, payments, refund_requests, wallet_transactions, special_offers, countries, visa_types, visa_documents_required, embassy_appointments, work_submissions, transfer_requests, audit_log, email_queue, email_logs, email_suppression, notifications, site_content (CMS JSONB), tour_operators, tour_programs, tour_bookings, partner_logos, hero_destinations.

كل جدول مع: PK، FKs، indexes حرجة، RLS/checks، triggers (مثل `protect_wallet_balance`، `prevent_last_admin_removal`، `recovery_codes_immutable`).

### 5. Auth & RBAC Specification
- 5 أدوار: customer, agent, admin, super_admin, tour_operator
- تدفق التسجيل: email confirm → auto-create profile → auto-assign customer
- تدفق الدخول: password → (إن staff) 2FA email code → session
- 2FA: 6 digits, SHA-256, expires 10 min
- Recovery codes: 10 أكواد، SHA-256، عرض مرة واحدة، immutable
- CAPTCHA + 5 محاولات/15 دقيقة → lockout
- Sessions: httpOnly + Secure + SameSite=Lax
- Staff portal على مسار سري `/portal-x7k9m2` فقط
- Google + Apple OAuth عبر Arctic

### 6. Feature Specs (واحد واحد)
لكل ميزة: المدخلات، المخرجات، قواعد العمل، RBAC.
- Application Wizard 3 خطوات + auto-draft عبر RPC
- Dynamic document requirements (accordion)
- Dynamic pricing (gov fee تقديري، shown excluded)
- Travel dates + Embassy appointment windows
- Whatsapp completion flow
- Special offers + countdown
- Refund tracker (`/track-refund`)
- Internal messaging (immutable)
- Work transfer + verification
- Agent performance reports
- Admin: User mgmt, Owner settings, Hero CMS, Email logs, Login audit, Document access logs, Sensitive ops (dual auth via service-role edge), System backup ZIP, AI assistant config
- Tourism portal (operators)
- AI customer chat + agent summaries (عبر LLM gateway مدفوع مباشرة من VPS، مثل OpenRouter/Anthropic API key يملكها المستخدم)

### 7. Frontend Architecture
- هيكل المجلدات الكامل (pages/components/hooks/contexts/lib)
- Routing map (public, /portal-x7k9m2, /admin/*, /agent/*, /tourism-portal/*)
- Contexts: Auth, Application, Language (RTL/LTR)
- Validation: src/lib/inputFilters.ts (English-only auth, 9-digit phone)
- Design system: tokens HSL في index.css، palette أزرق/رمادي، خط عربي + لاتيني
- API layer: `lib/api.ts` بديل supabase-js (fetch + cookies)
- Realtime: WebSocket عبر Fastify + ioredis pub/sub (بديل Supabase realtime)

### 8. Backend Architecture
- Modules: auth, files, applications, payments, refunds, wallet, messages, notifications, admin, agent, tourism, cms, ai
- Endpoint catalog (120+ endpoint) — جدول كامل: METHOD / PATH / RBAC / Body / Response
- Background jobs: email-queue, document-cleanup, daily-staff-report, backup, audit-rollup
- WebSocket events
- AI gateway proxy (يخفي مفتاح OpenAI/Anthropic عن العميل)

### 9. Storage & PDPL Strategy
- Buckets: documents (private+SSE), avatars (private+SSE), public (anon read)
- بنية المفاتيح: `{customer_id}/{application_id}/{uuid}-{filename}`
- جوازات → STC Object Storage (Saudi region) عبر edge مخصصة
- Presigned URLs: upload 10min, download 5min، كل تحميل يُسجَّل في audit
- Document access alert > 5 views/hour

### 10. Email Infrastructure
- Domain: notify.visafaster.com
- DKIM/SPF/DMARC records
- قوالب React Email للـ: confirmation, staff-2fa, status updates, refund, password reset
- Unsubscribe + suppression list
- Logs viewable في `/admin/email-logs`

### 11. Mobile Distribution
- Despia wrapper config (لا Capacitor server)
- OneSignal push
- AASA + assetlinks.json
- Universal links للـ apple/android
- كل OAuth/Payment يُفتَح في external browser لتفادي Apple IAP 30%

### 12. DevOps, Backup, DR
- docker-compose.yml كامل
- Caddyfile مع HSTS/CSP
- backup.sh: pg_dump يومي + restic لـ MinIO إلى S3 خارجي مشفّر
- DR script: VPS فارغ → استرجاع كامل في < 30 دقيقة
- Monitoring stack منفصل
- Cloudflare في الواجهة (CDN + WAF + DDoS)

### 13. Migration from Lovable/Supabase
- خطوات تصدير بيانات supabase → pg_dump → import
- سكربت نقل ملفات Storage → MinIO (يستعمل Supabase REST + minio mc)
- إعادة توجيه DNS تدريجي

### 14. Acceptance Criteria & Test Plan
- E2E: register → confirm email → login → 2FA → upload doc → submit application → admin approves → notification
- DR drill < 30min
- Lighthouse > 90 (mobile)
- Security: zero critical في `npm audit`، no plaintext secrets، CSP بدون unsafe-inline
- لا أي domain خارجي في Network tab غير: visafaster.com، notify.visafaster.com، cloudflare cdn، STC storage

## أسلوب الكتابة في الملف
- عربي + إنجليزي مختلطين (عربي للسياق، إنجليزي لأسماء الجداول/الأكواد).
- كل قسم يبدأ بـ "Goal" ثم "Spec" ثم "Acceptance".
- صناديق كود لـ schema/SQL/Prisma/Caddyfile/compose snippets قابلة للنسخ مباشرة.
- Markdown بنية واضحة (H1/H2/H3 فقط).
- في النهاية: قسم **"How to Use This Prompt"** يشرح لـ Claude:
  > "أعد بناء كامل المشروع وفق هذه المواصفات. لا تستخدم أي SaaS مغلق. ابدأ بـ docker-compose ثم schema ثم backend ثم frontend ثم mobile ثم monitoring. اعرض الخطوات قبل التنفيذ، واطلب موافقة قبل أي قرار يخالف القائمة السوداء."

## Deliverable
ملف واحد: `self-hosted/CLAUDE_MASTER_REBUILD_PROMPT.md` (~50KB).
بعد إنشائه، تستطيع نسخ محتواه وتمريره لـ Claude في محادثة جديدة → سيبني لك المشروع كاملاً تحت سيطرتك أنت فقط.

## ملاحظة صريحة
- الملف **لا يصدّر بيانات** الإنتاج (هذا يحتاج جلسة منفصلة لتشغيل `pg_dump` على Supabase الحالي).
- الملف **مرجع بناء** — يفترض أن Claude لديه القدرة على كتابة الكود؛ نحن نعطيه المواصفات الكاملة فقط.
- بعد موافقتك، أنشئ الملف مباشرة في خطوة واحدة.

هل أبدأ الإنشاء؟
