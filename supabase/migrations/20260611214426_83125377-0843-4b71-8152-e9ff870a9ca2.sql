
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT,
  ADD COLUMN IF NOT EXISTS terms_ip_address TEXT,
  ADD COLUMN IF NOT EXISTS terms_user_agent TEXT;

COMMENT ON COLUMN public.applications.terms_accepted_at IS 'Timestamp when customer accepted the terms (legal record).';
COMMENT ON COLUMN public.applications.terms_version IS 'Version identifier of the terms text accepted (e.g. v2026.1).';
COMMENT ON COLUMN public.applications.terms_ip_address IS 'Customer IP at time of consent (PDPL audit trail).';
COMMENT ON COLUMN public.applications.terms_user_agent IS 'Customer browser/device user-agent at time of consent.';
