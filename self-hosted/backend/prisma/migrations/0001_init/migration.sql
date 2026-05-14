-- ============================================================
-- VisaFaster — Initial Schema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE app_role AS ENUM ('customer', 'agent', 'admin', 'super_admin', 'tour_operator');

CREATE TYPE staff_permission AS ENUM (
  'manage_applications','manage_users','manage_staff','manage_settings',
  'manage_offers','manage_countries','manage_hero','view_reports',
  'process_refunds','manage_unlock_requests','view_revenue','manage_appointments'
);

CREATE TYPE application_status AS ENUM (
  'draft','pending_payment','submitted','under_review','documents_required',
  'processing','approved','rejected','cancelled','whatsapp_pending'
);

CREATE TYPE document_status AS ENUM ('pending','verified','rejected');
CREATE TYPE payment_status  AS ENUM ('pending','completed','failed','refunded');
CREATE TYPE wallet_tx_type  AS ENUM ('deposit','withdrawal','payment','refund','reward');

-- ============================================================
-- CORE: users / sessions / roles / permissions
-- ============================================================
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           CITEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  is_locked       BOOLEAN NOT NULL DEFAULT FALSE,
  locked_until    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lucia sessions
CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at  TIMESTAMPTZ NOT NULL,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Roles in a SEPARATE table — never store on profiles (privilege escalation prevention)
CREATE TABLE user_roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role        app_role NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, role)
);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

CREATE TABLE staff_permissions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  permission   staff_permission NOT NULL,
  granted_by   UUID REFERENCES users(id) ON DELETE SET NULL,
  granted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, permission)
);

-- has_role helper (replaces Supabase SECURITY DEFINER)
CREATE OR REPLACE FUNCTION has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION has_permission(_user_id UUID, _perm staff_permission)
RETURNS BOOLEAN LANGUAGE SQL STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM staff_permissions WHERE user_id = _user_id AND permission = _perm);
$$;

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE profiles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name         TEXT,
  phone             TEXT,
  avatar_url        TEXT,
  date_of_birth     DATE,
  nationality       TEXT,
  passport_number   TEXT,
  passport_expiry   DATE,
  address           TEXT,
  city              TEXT,
  country           TEXT,
  wallet_balance    NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Protect wallet_balance from direct UPDATE outside of wallet_transactions flow
CREATE OR REPLACE FUNCTION protect_wallet_balance() RETURNS trigger AS $$
BEGIN
  IF NEW.wallet_balance <> OLD.wallet_balance
     AND current_setting('app.allow_wallet_update', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'wallet_balance must be modified through wallet_transactions';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_wallet
BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION protect_wallet_balance();

-- ============================================================
-- COUNTRIES + VISA TYPES
-- ============================================================
CREATE TABLE countries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  code          TEXT NOT NULL UNIQUE,
  flag_url      TEXT,
  is_schengen   BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE visa_types (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_id        UUID NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  description       TEXT,
  requirements      JSONB NOT NULL DEFAULT '[]',
  price             NUMERIC(10,2) NOT NULL,
  child_price       NUMERIC(10,2),
  infant_price      NUMERIC(10,2),
  government_fees   NUMERIC(10,2),
  processing_days   INT NOT NULL DEFAULT 7,
  validity_days     INT,
  max_stay_days     INT,
  entry_type        TEXT NOT NULL DEFAULT 'single',
  fee_type          TEXT,
  price_notes       TEXT,
  price_notes_en    TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_visa_types_country ON visa_types(country_id);

-- ============================================================
-- APPLICATIONS
-- ============================================================
CREATE TABLE applications (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number         TEXT UNIQUE,
  user_id                  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  visa_type_id             UUID NOT NULL REFERENCES visa_types(id),
  status                   application_status NOT NULL DEFAULT 'draft',
  travel_date              DATE,
  return_date              DATE,
  purpose_of_travel        TEXT,
  accommodation_details    TEXT,
  emergency_contact_name   TEXT,
  emergency_contact_phone  TEXT,
  assigned_agent_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  agent_notes              TEXT,
  admin_notes              TEXT,
  rejection_reason         TEXT,
  submitted_at             TIMESTAMPTZ,
  approved_at              TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_applications_agent ON applications(assigned_agent_id);
CREATE INDEX idx_applications_status ON applications(status);

-- Auto-generate VF-YYYY-XXXX reference
CREATE SEQUENCE IF NOT EXISTS app_ref_seq;
CREATE OR REPLACE FUNCTION gen_app_reference() RETURNS trigger AS $$
BEGIN
  IF NEW.reference_number IS NULL THEN
    NEW.reference_number := 'VF-' || EXTRACT(YEAR FROM NOW())::text
      || '-' || LPAD(nextval('app_ref_seq')::text, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_app_reference
BEFORE INSERT ON applications
FOR EACH ROW EXECUTE FUNCTION gen_app_reference();

CREATE TABLE application_documents (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  document_type       TEXT NOT NULL,
  bucket              TEXT NOT NULL DEFAULT 'documents',
  object_key          TEXT NOT NULL,
  file_name           TEXT NOT NULL,
  file_size           BIGINT,
  mime_type           TEXT,
  status              document_status NOT NULL DEFAULT 'pending',
  verification_notes  TEXT,
  verified_by         UUID REFERENCES users(id) ON DELETE SET NULL,
  verified_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_app_docs_application ON application_documents(application_id);

CREATE TABLE application_status_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  old_status      application_status,
  new_status      application_status NOT NULL,
  changed_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- PAYMENTS + WALLET
-- ============================================================
CREATE TABLE payments (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id            UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  amount                    NUMERIC(10,2) NOT NULL,
  currency                  TEXT NOT NULL DEFAULT 'SAR',
  status                    payment_status NOT NULL DEFAULT 'pending',
  payment_method            TEXT,
  provider_payment_id       TEXT,
  provider_session_id       TEXT,
  invoice_number            TEXT,
  paid_at                   TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE wallet_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount          NUMERIC(12,2) NOT NULL,
  type            wallet_tx_type NOT NULL,
  description     TEXT,
  reference_id    UUID,
  balance_after   NUMERIC(12,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_wallet_tx_user ON wallet_transactions(user_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'info',
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  action_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read);

-- ============================================================
-- 2FA + RECOVERY CODES
-- ============================================================
CREATE TABLE staff_2fa_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash   TEXT NOT NULL,  -- SHA-256
  expires_at  TIMESTAMPTZ NOT NULL,
  attempts    INT NOT NULL DEFAULT 0,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_2fa_user ON staff_2fa_codes(user_id);

CREATE TABLE recovery_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  code_hash   TEXT NOT NULL,  -- SHA-256, immutable
  used_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, code_hash)
);

-- Recovery code hashes are immutable
CREATE OR REPLACE FUNCTION protect_recovery_hash() RETURNS trigger AS $$
BEGIN
  IF NEW.code_hash <> OLD.code_hash THEN
    RAISE EXCEPTION 'recovery code hash is immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_recovery
BEFORE UPDATE ON recovery_codes
FOR EACH ROW EXECUTE FUNCTION protect_recovery_hash();

-- ============================================================
-- LOGIN ATTEMPTS (DoS protection)
-- ============================================================
CREATE TABLE staff_login_attempts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       CITEXT NOT NULL,
  ip_address  INET,
  user_agent  TEXT,
  success     BOOLEAN NOT NULL,
  failure_reason TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_login_attempts_email ON staff_login_attempts(email, created_at DESC);
CREATE INDEX idx_login_attempts_ip    ON staff_login_attempts(ip_address, created_at DESC);

-- ============================================================
-- AUDIT LOG (immutable)
-- ============================================================
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   UUID,
  metadata    JSONB NOT NULL DEFAULT '{}',
  ip_address  INET,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_audit_actor ON audit_log(actor_id);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);

-- Block UPDATE/DELETE on audit_log
CREATE OR REPLACE FUNCTION audit_immutable() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'audit_log is append-only';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_no_update BEFORE UPDATE ON audit_log
FOR EACH ROW EXECUTE FUNCTION audit_immutable();
CREATE TRIGGER trg_audit_no_delete BEFORE DELETE ON audit_log
FOR EACH ROW EXECUTE FUNCTION audit_immutable();

-- ============================================================
-- EMAIL QUEUE + LOG
-- ============================================================
CREATE TABLE email_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email        TEXT NOT NULL,
  subject         TEXT NOT NULL,
  template        TEXT NOT NULL,
  template_data   JSONB NOT NULL DEFAULT '{}',
  scheduled_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attempts        INT NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending',  -- pending|sent|failed
  last_error      TEXT,
  sent_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_email_queue_status ON email_queue(status, scheduled_at);

CREATE TABLE email_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to_email    TEXT NOT NULL,
  subject     TEXT NOT NULL,
  template    TEXT,
  status      TEXT NOT NULL,
  provider_id TEXT,
  metadata    JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- GUARDRAIL: prevent removing last super_admin / admin
-- ============================================================
CREATE OR REPLACE FUNCTION protect_last_admin() RETURNS trigger AS $$
DECLARE
  remaining INT;
BEGIN
  IF OLD.role IN ('super_admin','admin') THEN
    SELECT COUNT(*) INTO remaining FROM user_roles
      WHERE role = OLD.role AND user_id <> OLD.user_id;
    IF remaining = 0 THEN
      RAISE EXCEPTION 'Cannot remove the last %', OLD.role;
    END IF;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_protect_last_admin
BEFORE DELETE ON user_roles
FOR EACH ROW EXECUTE FUNCTION protect_last_admin();

-- ============================================================
-- updated_at auto-touch
-- ============================================================
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at := NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'users','profiles','countries','visa_types','applications',
    'application_documents','payments'
  ]) LOOP
    EXECUTE format('CREATE TRIGGER trg_touch_%I BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION touch_updated_at();', t, t);
  END LOOP;
END $$;