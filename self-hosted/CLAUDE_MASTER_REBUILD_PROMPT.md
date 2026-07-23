# CLAUDE MASTER REBUILD PROMPT — VisaFaster (عطلات رحلاتكم)

> **READ THIS FIRST (Claude):**
> أنت ستبني منصة كاملة باسم **VisaFaster / عطلات رحلاتكم** من الصفر، وفق المواصفات أدناه.
> **القيد المطلق:** صفر اعتماد على أي طرف ثالث مغلق (No Supabase, No Firebase, No Vercel, No Netlify, No Auth0/Clerk, No RevenueCat, No Pusher).
> كل البيانات والكود والمفاتيح يجب أن تعمل على **VPS واحد** يملكه المستخدم، خلف Cloudflare CDN فقط.
> اعرض خطة قبل التنفيذ، نفّذ على دفعات (compose → schema → backend → frontend → mobile → monitoring)، واطلب موافقة قبل أي قرار يخالف القائمة السوداء أعلاه.

---

## 0. كيف تستخدم هذا الملف (للمستخدم)

1. افتح Claude (Sonnet 4.5+ أو Opus) في محادثة جديدة.
2. الصق هذا الملف بالكامل كأول رسالة مع جملة:
   > "ابدأ بقسم 1، اعرض خطة كل قسم، ثم نفّذ بعد موافقتي."
3. Claude سينشئ المشروع في مجلد `visafaster/` بكامل البنية.
4. تستضيفه على VPS (Hetzner CCX23 / STC Cloud / Oracle Jeddah) وفق `docs/DEPLOYMENT.md` الذي سيولّده.

---

## 1. Identity & Mission

**Goal:** بناء منصة سعودية لطلبات التأشيرات والبرامج السياحية، RTL أساسي، PDPL-compliant، تحت سيطرة كاملة للمالك.

**Spec:**
- اسم العلامة (UI): `عطلات رحلاتكم`
- الدومين: `visafaster.com` (+ `notify.visafaster.com` للإيميل)
- الجمهور: عملاء سعوديون، اللغة الأساسية عربي (RTL)، دعم EN كـ fallback.
- المستخدمون: 5 أدوار → customer / agent / admin / super_admin (Owner 👑) / tour_operator
- المنتجات: تأشيرات (Schengen + Non-Schengen) + برامج سياحية + محفظة عملاء + استرداد + رسائل داخلية + لوحات تحكم متقدمة.

**Acceptance:**
- لا يظهر اسم أي مزوّد SaaS مغلق في أي مكان (UI/Code/Logs).
- كل الـ network calls تذهب فقط إلى: `visafaster.com`, `notify.visafaster.com`, `cdn.cloudflare.com`, `<saudi-storage>.example`.

---

## 2. Non-Negotiable Constraints

| # | القيد | السبب |
|---|------|-------|
| 1 | PDPL: جوازات السفر تُخزَّن في **Object Storage داخل السعودية** (STC Cloud / Center3) | نظام حماية البيانات الشخصية السعودي |
| 2 | كل الدفع وOAuth داخل التطبيق المحمول يفتح في **متصفح خارجي** | تجنب رسوم Apple IAP 30% |
| 3 | كلمات المرور بـ **Argon2id** فقط (memory=64MB, t=3, p=4) | OWASP 2024 |
| 4 | كل دالة `SECURITY DEFINER` تحتوي `SET search_path = public` | منع path hijacking |
| 5 | الأدوار في جدول `user_roles` منفصل، **لا** في `profiles/users` | منع privilege escalation |
| 6 | `audit_log` immutable عبر trigger يمنع UPDATE/DELETE | امتثال + تحقيقات |
| 7 | Two-Person Rule لكل عملية حساسة (حذف موظف، تغيير دور Super Admin، تعديل محفظة) | حماية ضد insider |
| 8 | Trigger يمنع حذف آخر `super_admin` أو آخر `admin` | استمرارية الإدارة |
| 9 | كل recovery code يُخزّن SHA-256، الـ hash **immutable** عبر trigger | لا يمكن تزويره حتى من DBA |
| 10 | Sessions cookies: `HttpOnly + Secure + SameSite=Lax + Domain=.visafaster.com` | XSS/CSRF |
| 11 | CSP صارم بدون `unsafe-inline` (استخدم nonce) | XSS |
| 12 | Rate limit: 200/min/IP عام + 5 محاولات تسجيل/15دقيقة → lockout | brute force |
| 13 | Staff portal مخفي على مسار `/portal-x7k9m2` فقط، لا يُربَط من أي UI عام | Security through obscurity layer |
| 14 | كل تحميل لوثيقة جواز يُسجَّل في `document_access_log` + تنبيه عند >5/ساعة | PDPL audit |

---

## 3. Tech Stack (Pinned Versions)

```
Frontend:
  React 18.3 + Vite 5.4 + TypeScript 5.6
  TailwindCSS 3.4 + shadcn/ui (Radix) + Framer Motion 11
  React Router 6 + TanStack Query 5
  React Hook Form + Zod
  date-fns + i18next (ar/en)
  dnd-kit (drag-drop) + recharts + exceljs + jszip

Backend:
  Node 20 LTS + Fastify 4 + TypeScript 5.6
  Prisma 5.22 (PostgreSQL adapter)
  Lucia 3 + Arctic 1.9 (OAuth Google/Apple)
  Argon2id (@node-rs/argon2)
  Zod validation + Pino logger
  ioredis 5 + BullMQ (queues)
  Nodemailer 6 + React Email (templates)
  MinIO SDK 8 + AWS SDK v3 (for STC S3-compat)
  ws (native WebSocket) for realtime

Database:
  PostgreSQL 16 + extensions: citext, pgcrypto, pg_trgm, uuid-ossp

Infra:
  Ubuntu 22.04 LTS + Docker 24 + Docker Compose v2
  Caddy 2 (TLS auto via Let's Encrypt)
  MinIO (S3-compatible, SSE-S3)
  Redis 7
  Cloudflare (CDN + WAF + DDoS, free plan)

Mobile:
  Despia wrapper (web-to-app, no Capacitor server)
  OneSignal Push (self-hosted alt: Gotify)

Monitoring:
  Grafana 11 + Loki 3 + Promtail + Prometheus 2 + Uptime Kuma

CI/CD:
  Gitea Actions (self-hosted) → SSH deploy script
  Restic for encrypted backups → external S3 (Wasabi/Backblaze)
```

---

## 4. Domain Model — Full Schema

### 4.1 Enums
```sql
CREATE TYPE app_role AS ENUM ('customer','agent','admin','super_admin','tour_operator');
CREATE TYPE application_status AS ENUM (
  'draft','pending_payment','submitted','under_review','documents_required',
  'processing','approved','rejected','cancelled','whatsapp_pending'
);
CREATE TYPE document_status AS ENUM ('pending','verified','rejected');
CREATE TYPE payment_status AS ENUM ('pending','paid','failed','refunded','partial_refund');
CREATE TYPE refund_status AS ENUM ('requested','approved','rejected','processing','completed');
CREATE TYPE notification_channel AS ENUM ('in_app','email','sms','push','whatsapp');
```

### 4.2 Core Tables (with triggers)

**users** — هوية فقط، لا أدوار.
```sql
CREATE TABLE users (
  id UUID PK DEFAULT gen_random_uuid(),
  email CITEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,         -- argon2id
  email_verified BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**user_roles** — RBAC منفصل.
```sql
CREATE TABLE user_roles (
  id UUID PK,
  user_id UUID FK→users ON DELETE CASCADE,
  role app_role NOT NULL,
  granted_by UUID FK→users,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);
-- Trigger: prevent removal of last super_admin / admin
CREATE TRIGGER prevent_last_admin BEFORE DELETE ON user_roles ...
-- Function: has_role(_user UUID, _role app_role) SECURITY DEFINER SET search_path=public
```

**profiles** — بيانات شخصية + محفظة.
```sql
CREATE TABLE profiles (
  id UUID PK, user_id UUID UNIQUE FK→users,
  full_name TEXT, phone VARCHAR(9), -- 9 رقم بدون مقدمة
  avatar_url TEXT,
  wallet_balance NUMERIC(12,2) DEFAULT 0 NOT NULL,
  preferred_language VARCHAR(2) DEFAULT 'ar',
  created_at, updated_at
);
-- Trigger: protect_wallet_balance — UPDATE on wallet_balance only via wallet_transactions
```

**profiles_agent_view** — VIEW يخفي الجواز/العنوان للوكلاء.
```sql
CREATE VIEW profiles_agent_view AS
SELECT id, user_id, full_name,
       LEFT(phone,3)||'****' AS phone_masked,
       NULL::TEXT AS passport_number, NULL::TEXT AS address
FROM profiles;
```

**sessions** — Lucia.
```sql
CREATE TABLE sessions (id TEXT PK, user_id UUID FK, expires_at TIMESTAMPTZ, ip INET, ua TEXT);
```

**staff_2fa_codes**
```sql
CREATE TABLE staff_2fa_codes (
  id UUID PK, user_id UUID FK,
  code_hash TEXT NOT NULL,            -- SHA-256 of 6-digit
  expires_at TIMESTAMPTZ NOT NULL,    -- now()+10min
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**recovery_codes** — 10 codes per staff, immutable hash.
```sql
CREATE TABLE recovery_codes (
  id UUID PK, user_id UUID FK,
  code_hash TEXT NOT NULL,            -- SHA-256
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Trigger: code_hash immutable; only super_admin can clear all for a user
```

**login_attempts**
```sql
CREATE TABLE login_attempts (
  id UUID PK, email CITEXT, ip INET, ua TEXT,
  success BOOLEAN, reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Function: lock account after 5 failed in 15min
```

**applications** — الكيان المركزي.
```sql
CREATE TABLE applications (
  id UUID PK,
  reference VARCHAR(20) UNIQUE,        -- VF-YYYY-XXXX
  user_id UUID FK→users,
  assigned_agent_id UUID FK→users,
  country_id UUID FK→countries,
  visa_type_id UUID FK→visa_types,
  status application_status DEFAULT 'draft',
  travelers JSONB,                     -- [{name,age,passport},...]
  expected_travel_date DATE,
  expected_appointment_window JSONB,   -- {start,end}
  total_price NUMERIC(12,2),
  gov_fee_estimate NUMERIC(12,2),
  service_fee NUMERIC(12,2),
  currency VARCHAR(3) DEFAULT 'SAR',
  notes TEXT,
  created_at, updated_at, submitted_at, completed_at
);
-- RPC: create_application_draft(...) SECURITY DEFINER bypasses RLS for initial draft
```

**application_documents**
```sql
CREATE TABLE application_documents (
  id UUID PK,
  application_id UUID FK→applications ON DELETE CASCADE,
  document_type TEXT NOT NULL,         -- passport, photo, bank_statement, etc.
  bucket TEXT NOT NULL,                -- 'documents' | 'passports-saudi'
  object_key TEXT NOT NULL,            -- {user_id}/{app_id}/{uuid}-{filename}
  file_name TEXT, file_size INT, mime_type TEXT,
  status document_status DEFAULT 'pending',
  uploaded_at TIMESTAMPTZ DEFAULT now()
);
```

**application_messages** — Immutable internal chat.
```sql
CREATE TABLE application_messages (
  id UUID PK, application_id UUID FK,
  sender_id UUID FK→users, sender_role app_role,
  body TEXT NOT NULL, attachments JSONB,
  priority TEXT DEFAULT 'normal',      -- normal|urgent
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Trigger: NO UPDATE, NO DELETE
```

**application_status_history**
```sql
CREATE TABLE application_status_history (
  id UUID PK, application_id UUID FK,
  from_status application_status, to_status application_status,
  changed_by UUID FK, reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**document_access_log** — PDPL.
```sql
CREATE TABLE document_access_log (
  id UUID PK, document_id UUID FK→application_documents,
  accessor_id UUID FK→users, accessor_role app_role,
  ip INET, action TEXT,                -- view|download
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Job: alert if accessor views >5 passports/hour
```

**payments / refund_requests / wallet_transactions**
```sql
CREATE TABLE payments (
  id UUID PK, application_id UUID FK,
  user_id UUID FK, amount NUMERIC(12,2), currency,
  provider TEXT,                       -- moyasar|hyperpay|stripe(intl)
  provider_ref TEXT, status payment_status,
  created_at, paid_at
);

CREATE TABLE refund_requests (
  id UUID PK, application_id UUID FK,
  reason TEXT, requested_amount NUMERIC,
  status refund_status DEFAULT 'requested',
  ticket_number VARCHAR(20) UNIQUE,    -- public for /track-refund
  reviewed_by UUID, reviewed_at,
  created_at, updated_at
);

CREATE TABLE wallet_transactions (
  id UUID PK, user_id UUID FK,
  amount NUMERIC(12,2),                -- + credit / - debit
  reason TEXT, related_application_id UUID,
  created_by UUID,                     -- admin only (RLS)
  created_at TIMESTAMPTZ DEFAULT now()
);
-- Trigger after-insert: update profiles.wallet_balance atomically
```

**Catalog: countries / visa_types / visa_documents_required / embassy_appointments**
```sql
countries(id, code, name_ar, name_en, flag_url, is_schengen BOOL, display_order INT)
visa_types(id, country_id, name_ar, name_en, base_price, processing_days, display_order)
visa_documents_required(id, visa_type_id, document_type, label_ar, label_en, required BOOL, display_order)
embassy_appointments(id, country_id, estimated_window JSONB, notes_ar, updated_by, updated_at)
```

**special_offers**
```sql
special_offers(id, title_ar, description_ar, discount_pct, starts_at, ends_at, target_visa_type_id, image_url)
```

**Staff workflows: work_submissions / transfer_requests**
```sql
work_submissions(id, agent_id, application_id, proof_files JSONB, status, reviewed_by, created_at)
transfer_requests(id, from_agent_id, to_agent_id, application_id, reason, status, approved_by, created_at)
```

**Comms: email_queue / email_logs / email_suppression / notifications**
```sql
email_queue(id, to_email, template_key, payload JSONB, status, attempts, scheduled_at, sent_at)
email_logs(id, to_email, template_key, message_id, opened_at, clicked_at, bounced BOOL)
email_suppression(email PK, reason, created_at)
notifications(id, user_id, channel, title, body, link, read_at, created_at)
```

**CMS: site_content** — JSONB for dynamic pages.
```sql
site_content(key TEXT PK, content JSONB NOT NULL, updated_by, updated_at)
-- e.g. keys: 'hero.destinations', 'home.partners', 'order.disclaimer', 'ai.assistant.config'
```

**Tourism: tour_operators / tour_programs / tour_bookings**
```sql
tour_operators(id, user_id UNIQUE FK, company_name, license_number, verified BOOL, ...)
tour_programs(id, operator_id, title, description, price, duration_days, country_id, active BOOL)
tour_bookings(id, program_id, customer_id, travelers JSONB, status, total_price, created_at)
```

**Audit (immutable)**
```sql
audit_log(id, actor_id, action, entity_type, entity_id, metadata JSONB, ip, ua, created_at)
-- Trigger: BEFORE UPDATE OR DELETE → RAISE EXCEPTION
```

### 4.3 Required SQL Functions (all `SECURITY DEFINER SET search_path=public`)
- `has_role(_user UUID, _role app_role) RETURNS BOOLEAN`
- `has_any_role(_user UUID, VARIADIC _roles app_role[]) RETURNS BOOLEAN`
- `create_application_draft(payload JSONB) RETURNS UUID`
- `record_login_attempt(_email CITEXT, _ip INET, _ua TEXT, _success BOOL, _reason TEXT)`
- `consume_2fa_code(_user UUID, _code TEXT) RETURNS BOOLEAN`
- `consume_recovery_code(_user UUID, _code TEXT) RETURNS BOOLEAN`
- `get_agents_for_transfer(_app UUID) RETURNS SETOF agent_brief` (restricts visibility)
- `process_wallet_transaction(_user UUID, _amount NUMERIC, _reason TEXT, _related UUID) RETURNS UUID`
- `assign_application(_app UUID, _agent UUID)` (admins only)
- `transition_application_status(_app UUID, _to application_status, _reason TEXT)`

---

## 5. Auth & RBAC Specification

### Registration (customer)
1. POST /api/auth/register {email,password,full_name,phone(9 digits)}
2. Validate: English-only email/password, phone exactly `^[0-9]{9}$`.
3. Argon2id hash → INSERT users → INSERT profiles → INSERT user_roles('customer')
4. Send verification email (queued).
5. Return 200 with `{message: "check your email"}`.

### Login
1. POST /api/auth/login → check email_verified, not locked.
2. Verify Argon2id.
3. If user has role in (admin/super_admin/agent/tour_operator) → require 2FA → send code email → return `{requires_2fa: true, challenge_id}`.
4. POST /api/auth/2fa {challenge_id, code} → consume_2fa_code → create Lucia session → set cookie.
5. Else (customer) → create session immediately.

### Recovery codes
- Generated on staff 2FA enrollment: 10 codes, format `XXXX-XXXX-XXXX`.
- SHA-256 stored, shown to user **once**.
- Trigger blocks UPDATE on `code_hash`.
- Endpoint POST /api/auth/recovery {email, code}.

### Lockout
- 5 failed attempts in 15min → set `is_locked=true, locked_until=now()+15min`.
- Unlock: super_admin via `/admin/login-attempts` UI OR auto-expire.

### Staff portal
- All staff-only routes guarded server-side AND client-side.
- Client redirects unknown roles away from `/admin/*`, `/agent/*`, `/portal-x7k9m2`.
- Public UI **never** links to `/portal-x7k9m2`.

### OAuth
- Arctic for Google + Apple.
- Mobile (Despia): force open OAuth in external browser via `window.top.location` redirect.

---

## 6. Feature Specs (one by one)

### 6.1 Application Wizard (3 steps)
**Step 1 — Basic Info:** travelers count + ages → calc gov_fee_estimate by age bracket.
**Step 2 — Visa Details:** country (sorted by display_order) → visa_type → travel date → appointment window (read embassy_appointments).
**Step 3 — Documents + Terms + Payment:**
- Accordion of `visa_documents_required` (1:1 inline upload, "select all" applies same file).
- Show price summary: service_fee + gov_fee_estimate (excluded from total, with disclaimer from `site_content['order.disclaimer']`).
- Auto-save draft via `create_application_draft` RPC every 5s of inactivity.
- WhatsApp completion path: if user clicks "أكمل عبر واتساب" → status=`whatsapp_pending`, send Arabic requirements list to admin's WhatsApp.

### 6.2 Customer Dashboard
- `/my-applications`: list with filter, reference VF-YYYY-XXXX, status progress tracker, timeline.
- `/track-refund` (public): enter ticket_number → status only.
- Wallet balance + history (read-only).

### 6.3 Agent Dashboard
- `/agent/dashboard`: monthly performance (approved count, avg time, SLA).
- `/agent/applications`: only assigned, masked sensitive data via `profiles_agent_view`.
- Cannot set `approved` or `rejected` final status — only intermediate.
- Work transfer dialog → creates `transfer_requests` (admin approves).
- Work submission dialog → uploads proof to `work_submissions`.

### 6.4 Admin Hub
Routes:
- `/admin/dashboard` (urgent tasks, charts via recharts)
- `/admin/applications` + `/admin/applications/:id` (full file preview, audit on every passport view)
- `/admin/users` (Staff/Customers/Tour Operators tabs)
- `/admin/owner-settings` (Owner only — delegate roles, two-person rule)
- `/admin/hero` (drag-drop destinations via dnd-kit)
- `/admin/offers` (countdown editor)
- `/admin/refund-requests`
- `/admin/email-logs`, `/admin/login-attempts`, `/admin/document-access-logs`
- `/admin/sensitive-operations` (dual-auth queue)
- `/admin/system-backup` (download ZIP of full DB dump)
- `/admin/cms` (edit site_content keys)
- `/admin/ai-assistant` (configure prompt/tone/model)
- `/admin/embassy-appointments`
- `/admin/footer`, `/admin/portal-security` (rotate `/portal-XXXX` token)
- `/admin/staff-audit`

### 6.5 Tourism Portal
- `/tourism-portal/dashboard|programs|bookings|profile`
- Operator manages own programs via RLS.

### 6.6 Sensitive Operations (Two-Person Rule)
- Examples: delete staff, grant super_admin, manual wallet credit > 1000 SAR, bulk reassign.
- Flow: Admin A submits → status `pending_approval` → Admin B approves → service-role internal endpoint executes with optimistic concurrency check (return 409 on conflict).

### 6.7 Real-time
- Server: WebSocket on `/ws` (Fastify + ws), authenticated by session cookie.
- Redis pub/sub broadcasts: `app:status:changed`, `notification:new`, `message:new`.
- Client hook `useRealtimeSync` invalidates React Query keys.

### 6.8 AI Assistant
- Customer chat widget + agent application summary.
- Backend proxies to OpenAI/Anthropic API using **owner-controlled** API key (env var on VPS).
- Config (model, temperature, prompt template, tone) stored in `site_content['ai.assistant.config']`.
- All conversations logged in `ai_chat_logs` (TTL 90 days).

---

## 7. Frontend Architecture

### Folder structure
```
frontend/
  src/
    main.tsx
    App.tsx (router)
    index.css (HSL design tokens, RTL base)
    contexts/
      AuthContext.tsx          (session, roles, 2FA state)
      ApplicationContext.tsx   (wizard state)
      LanguageContext.tsx      (ar/en, dir)
    lib/
      api.ts                   (fetch wrapper, cookies, error handling — REPLACES supabase-js)
      ws.ts                    (WebSocket client)
      validators.ts            (Zod + inputFilters)
      inputFilters.ts          (English-only auth, 9-digit phone)
      utils.ts, despia.ts, exportToExcel.ts, generateApplicationPDF.ts
    hooks/
      useAuth, useRealtimeSync, useDraftApplication,
      usePermissions, useUrgentTasks, useAdminNotifications, ...
    components/
      ui/                      (shadcn full set)
      auth/, admin/, agent/, apply/, home/, layout/, messages/, notifications/, seo/, tourism/
    pages/
      Home/HomeArabic, Auth, Apply, MyApplications, Profile, ...
      admin/* agent/* tourism-portal/*
      SecureStaffAuth (mounted at /portal-x7k9m2 dynamically from env)
```

### Routing map (highlights)
```
PUBLIC:  / /home /destinations /pricing /tourism /track-application /track-refund
         /faq /contact /privacy /terms /refund /install /special-offers
AUTH:    /auth /reset-password
APP:     /apply /my-applications /my-applications/:id /profile /payment-success
PORTAL:  /portal-x7k9m2 (staff login + 2FA)
ADMIN:   /admin/* (guarded)
AGENT:   /agent/* (guarded)
TOURISM: /tourism-portal/* (guarded)
```

### Design system
- HSL tokens in `index.css`: `--primary`, `--secondary`, `--accent` (blue/gray palette).
- Arabic font: `IBM Plex Sans Arabic` via `<link>` (no @import).
- Latin: `Inter`.
- Direction: `dir="rtl"` default; toggle for EN.
- Animations: Framer Motion for hero/cards; respect `prefers-reduced-motion`.

### `lib/api.ts` (replaces supabase-js)
```ts
const BASE = import.meta.env.VITE_API_URL ?? '/api';
export const api = {
  async req<T>(path: string, init?: RequestInit): Promise<T> {
    const r = await fetch(`${BASE}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
      ...init,
    });
    if (!r.ok) throw await r.json().catch(() => ({ error: r.statusText }));
    return r.json();
  },
  get: <T>(p: string) => api.req<T>(p),
  post: <T>(p: string, body: unknown) => api.req<T>(p, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(p: string, body: unknown) => api.req<T>(p, { method: 'PATCH', body: JSON.stringify(body) }),
  del:  <T>(p: string) => api.req<T>(p, { method: 'DELETE' }),
};
```

---

## 8. Backend Architecture

### Folder structure
```
backend/
  prisma/schema.prisma + migrations/
  src/
    server.ts (Fastify bootstrap)
    lib/ (db, redis, lucia, mailer, minio, s3-saudi, logger, ws-hub)
    middleware/ (rbac, rate-limit, csp, audit)
    auth/routes.ts
    modules/
      applications/  files/  payments/  refunds/  wallet/
      messages/      notifications/  admin/  agent/
      tourism/       cms/   ai/   webhooks/
    jobs/ (email-queue, daily-report, document-access-alert, backup-trigger, ai-cleanup)
    ws/hub.ts
  Dockerfile, tsconfig.json, package.json
```

### Endpoint catalog (subset — Claude must generate full table)
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/2fa
POST   /api/auth/recovery
POST   /api/auth/logout
GET    /api/auth/session
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/auth/oauth/:provider/start
GET    /api/auth/oauth/:provider/callback

GET    /api/me
PATCH  /api/me

GET    /api/countries
GET    /api/visa-types
GET    /api/visa-types/:id/required-documents
GET    /api/embassy-appointments

POST   /api/applications/draft
PATCH  /api/applications/:id
POST   /api/applications/:id/submit
GET    /api/applications/mine
GET    /api/applications/:id
POST   /api/applications/:id/messages
GET    /api/applications/:id/messages

POST   /api/files/presigned-upload
GET    /api/files/presigned-download/:id

POST   /api/payments/init
POST   /api/payments/webhook/:provider
POST   /api/refunds
GET    /api/refunds/track/:ticket

GET    /api/admin/dashboard
GET    /api/admin/applications        (filter, search, paginate)
PATCH  /api/admin/applications/:id/assign
PATCH  /api/admin/applications/:id/status
GET    /api/admin/users
POST   /api/admin/staff (create — sensitive)
DELETE /api/admin/staff/:id (sensitive — two-person)
POST   /api/admin/sensitive-ops/:id/approve
GET    /api/admin/email-logs
GET    /api/admin/login-attempts
POST   /api/admin/login-attempts/:id/unlock
GET    /api/admin/document-access-logs
GET    /api/admin/system-backup            (streams ZIP)
GET    /api/admin/cms/:key
PUT    /api/admin/cms/:key

GET    /api/agent/dashboard
GET    /api/agent/applications
POST   /api/agent/transfer-requests
POST   /api/agent/work-submissions

GET    /api/tourism/programs
POST   /api/tourism/programs
GET    /api/tourism/bookings

POST   /api/ai/chat
POST   /api/ai/summarize/:applicationId

GET    /api/notifications
PATCH  /api/notifications/:id/read

GET    /ws    (WebSocket, session-auth)
GET    /health
```

### Background jobs (BullMQ + cron)
- `email-queue` every 60s: drain `email_queue`, send via Nodemailer, log to `email_logs`, update suppression on bounce.
- `document-access-alert` every 5min: aggregate last hour, notify super_admin if >5 passport views by same accessor.
- `daily-staff-report` 09:00 KSA: email super_admin yesterday's stats.
- `backup-trigger` 03:00 KSA: invoke `infrastructure/backups/backup.sh`.
- `ai-log-cleanup` daily: delete `ai_chat_logs` older than 90 days.

---

## 9. Storage & PDPL Strategy

### Buckets
| Bucket | Backend | Encryption | Access |
|--------|---------|------------|--------|
| `documents` | MinIO (VPS) | SSE-S3 | Presigned only |
| `avatars` | MinIO (VPS) | SSE-S3 | Presigned only |
| `public` | MinIO (VPS) | none | Anonymous read (logos, hero images) |
| `passports-saudi` | **STC Object Storage (Riyadh region)** | SSE-S3 + customer-managed key | Presigned only, audit on every read |

### Object key convention
`{user_id}/{application_id}/{uuid}-{original_filename}`

### Presigned URL policy
- Upload: 10 minutes max.
- Download: 5 minutes max.
- Every download → INSERT `document_access_log` row (sync, before returning URL).
- Sensitive types (`passport`, `national_id`) → MUST go to `passports-saudi` bucket via separate STC client.

---

## 10. Email Infrastructure

- Domain: `notify.visafaster.com` (subdomain isolated from main).
- DNS records the user must add:
  - SPF: `v=spf1 ip4:<vps-ip> -all`
  - DKIM: 2048-bit, selector `default._domainkey.notify`
  - DMARC: `v=DMARC1; p=quarantine; rua=mailto:dmarc@visafaster.com`
- Templates (React Email JSX → render to HTML+text):
  - `auth.confirmation`, `auth.password-reset`, `auth.welcome`
  - `staff.2fa`, `staff.daily-report`
  - `app.submitted`, `app.status-changed`, `app.documents-required`, `app.approved`, `app.rejected`
  - `refund.requested`, `refund.completed`
- Every email MUST include: `<html>`, plain text alternative, unsubscribe link → `/api/email/unsubscribe?token=...`.
- Suppression: bounce/complaint → INSERT `email_suppression`; queue worker skips suppressed addresses.
- Logs viewable at `/admin/email-logs`.

---

## 11. Mobile Distribution (Despia)

- Wrap `https://visafaster.com` via Despia builder; no Capacitor server config.
- AASA file: `public/.well-known/apple-app-site-association`
- Android: `public/.well-known/assetlinks.json`
- Push: OneSignal (or self-hosted Gotify) — token sync endpoint `POST /api/me/push-token`.
- **Hard rule:** all OAuth + payment flows force `window.top.location.href` redirect to break out of any embedded webview, then return via universal link.
- iOS detection in `lib/despia.ts` opens external browser for `/payment` and `/auth/oauth/*`.

---

## 12. DevOps, Backup & DR

### docker-compose.yml services
`postgres-16`, `redis-7`, `minio + minio-init`, `backend`, `frontend (nginx)`, `caddy`. Optional: `monitoring/` separate compose with grafana/loki/promtail/prometheus/uptime-kuma.

### Caddyfile (essence)
```
{$DOMAIN} {
  encode zstd gzip
  header {
    Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    X-Frame-Options "SAMEORIGIN"
    X-Content-Type-Options "nosniff"
    Referrer-Policy "strict-origin-when-cross-origin"
    Content-Security-Policy "default-src 'self'; script-src 'self' 'nonce-{nonce}'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' wss://{$DOMAIN}; frame-ancestors 'self'"
  }
  handle /api/* { reverse_proxy backend:3000 }
  handle /ws    { reverse_proxy backend:3000 }
  handle        { reverse_proxy frontend:80 }
}
```

### Backups
- `pg_dump -Fc` daily 03:00 → gzip → restic encrypted → external S3 (Wasabi/Backblaze).
- MinIO volume → restic snapshot daily.
- Retention: 7 daily / 4 weekly / 6 monthly.
- DR script: fresh VPS → docker → git clone → restore latest restic → up. Target < 30 min.

### Monitoring
- Promtail tails Docker JSON logs → Loki.
- Prometheus scrapes Fastify `/metrics` + node_exporter.
- Grafana dashboards: HTTP latency, queue depth, login failures, 4xx/5xx rate.
- Uptime Kuma external pings: `/health`, MinIO `/minio/health/live`.

### Cloudflare (free plan)
- Proxy ON for apex + www.
- WAF managed rules ON.
- Cache rules: `*.css|js|woff2|png|jpg|svg` → 1 year.
- Bypass cache for `/api/*` and `/ws`.
- Page Rules: `notify.visafaster.com` → DNS only (mail must not proxy).

---

## 13. Migration from managed backend (one-time)

```
# 1. DB
pg_dump -h <supabase-host> -U postgres -d postgres -Fc -f /tmp/legacy.dump
docker compose exec -T postgres pg_restore -U $POSTGRES_USER -d $POSTGRES_DB \
  --clean --if-exists --no-owner --no-acl /tmp/legacy.dump

# 2. Storage → MinIO (script provided)
./infrastructure/minio/migrate-from-supabase.sh \
  --supabase-url $LEGACY_URL --service-key $LEGACY_KEY \
  --buckets documents,avatars,public

# 3. Sensitive bucket → STC
./infrastructure/storage/migrate-passports-to-stc.sh

# 4. DNS cutover
# - Update visafaster.com A record → VPS IP behind Cloudflare proxy
# - notify.visafaster.com → VPS IP (DNS only, no proxy)
```

---

## 14. Acceptance Criteria & Test Plan

### E2E happy path
1. Register customer → confirm email link → login.
2. Create application via wizard 3 steps, upload 5 docs, submit.
3. Admin assigns to agent.
4. Agent uploads work_submission, requests transfer.
5. Admin approves transfer, sets status `processing` → `approved`.
6. Customer receives notification (in-app + email + push).
7. Customer requests refund → ticket number → admin approves → wallet credit.

### Security checklist
- [ ] `npm audit --production` zero critical/high.
- [ ] No secrets in repo (use `.env.example` only).
- [ ] All `SECURITY DEFINER` functions have `SET search_path = public` (verified by SQL query).
- [ ] CSP report-only mode for 1 week before enforcement; zero violations from own code.
- [ ] Lockout works after 5 failed logins.
- [ ] Recovery code can be used once only.
- [ ] Trying to DELETE last super_admin throws SQL exception.
- [ ] Trying to UPDATE recovery_codes.code_hash throws.
- [ ] audit_log UPDATE/DELETE throws.
- [ ] Agent JWT cannot read non-assigned application via API (403).
- [ ] Document download URL is valid only 5 minutes; reused after expiry → 403.

### Performance
- Lighthouse mobile ≥ 90 (perf, a11y, best-practices, SEO).
- p95 API < 300ms.
- WebSocket reconnect within 5s.

### Compliance
- PDPL: passport bucket in Saudi region — verify endpoint URL contains `.sa`.
- GDPR-style data export: `GET /api/me/export` returns ZIP of all user data.
- Account deletion: `DELETE /api/me` soft-deletes + 30 day purge cron.

---

## 15. How to Use This Prompt (instructions for Claude)

You are a senior full-stack engineer + DevOps. Build the entire VisaFaster platform per the spec above. Rules:

1. **Plan first**: present a step-by-step plan for the section you're tackling, wait for approval, then code.
2. **No closed SaaS**: never propose Supabase, Firebase, Vercel, Auth0, Clerk, or RevenueCat. If a spec is ambiguous, choose self-hosted/open-source.
3. **Order of work**:
   1. `docker-compose.yml` + `.env.example` + `Caddyfile`
   2. PostgreSQL schema + Prisma + triggers + RPC functions
   3. Backend: auth → files → applications → admin → agent → tourism → ai
   4. Frontend: design tokens → contexts → public pages → wizard → dashboards
   5. Mobile (Despia config + universal links)
   6. Monitoring + backup scripts
   7. CI workflow + deploy script + DEPLOYMENT.md + DISASTER_RECOVERY.md + SECURITY.md
4. **Every PR-sized chunk** must include: code, migration if any, test (vitest for backend, Playwright for E2E), and a one-paragraph "what changed".
5. **Hard checks before marking done**:
   - `docker compose up -d` boots cleanly on a blank Ubuntu 22.04.
   - `/health` returns 200 within 90s.
   - End-to-end: register → login → 2FA (for staff) → upload doc → submit application.
   - DR script restores from a fresh VPS in <30 min.
6. **Localization**: Arabic-first (RTL). Every UI string in i18n bundles, never hardcoded.
7. **Security**: Argon2id, httpOnly+Secure cookies, CSP nonce, rate limit, audit immutable, PDPL bucket separation. If unsure, default to MORE restrictive.
8. **Don't invent features**: if a spec is missing, ask the user before adding.
9. **Branding**: only "عطلات رحلاتكم" / "VisaFaster". Never "Rahala" or any legacy name.
10. **Done = production-ready**, not "demo". Edge cases (network loss, double-submit, expired session, race on draft save) MUST be handled.

When you finish a section, report:
```
✅ Section X done
Files: <list>
Tests: <pass/fail counts>
Next: Section Y — awaiting approval
```

— END OF PROMPT —
