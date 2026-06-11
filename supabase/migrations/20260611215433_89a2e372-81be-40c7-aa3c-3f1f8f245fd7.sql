
-- Allow guest applications (no auth required for WhatsApp path)
ALTER TABLE public.applications ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS guest_full_name text,
  ADD COLUMN IF NOT EXISTS guest_email text,
  ADD COLUMN IF NOT EXISTS guest_phone text,
  ADD COLUMN IF NOT EXISTS guest_country_code text;

-- RPC: create a WhatsApp order without authentication
CREATE OR REPLACE FUNCTION public.create_whatsapp_order(
  p_visa_type_id uuid,
  p_travel_date date,
  p_guest_data jsonb,
  p_terms jsonb
)
RETURNS TABLE(application_id uuid, display_number text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app_id uuid;
  v_display text;
  v_full_name text;
  v_email text;
  v_phone text;
  v_country_code text;
BEGIN
  v_full_name := trim(coalesce(p_guest_data->>'fullName', ''));
  v_email := lower(trim(coalesce(p_guest_data->>'email', '')));
  v_phone := regexp_replace(coalesce(p_guest_data->>'phone', ''), '[^0-9]', '', 'g');
  v_country_code := coalesce(p_guest_data->>'countryCode', '+966');

  IF length(v_full_name) < 2 OR length(v_full_name) > 200 THEN
    RAISE EXCEPTION 'invalid_name';
  END IF;
  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR length(v_email) > 255 THEN
    RAISE EXCEPTION 'invalid_email';
  END IF;
  IF length(v_phone) < 7 OR length(v_phone) > 15 THEN
    RAISE EXCEPTION 'invalid_phone';
  END IF;
  IF p_visa_type_id IS NULL THEN
    RAISE EXCEPTION 'invalid_visa_type';
  END IF;
  IF coalesce((p_terms->>'accepted')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'terms_not_accepted';
  END IF;

  INSERT INTO public.applications (
    user_id,
    visa_type_id,
    travel_date,
    status,
    submission_method,
    submitted_at,
    purpose_of_travel,
    guest_full_name,
    guest_email,
    guest_phone,
    guest_country_code,
    terms_accepted_at,
    terms_version,
    terms_ip_address,
    terms_user_agent
  ) VALUES (
    NULL,
    p_visa_type_id,
    p_travel_date,
    'whatsapp_pending',
    'whatsapp',
    now(),
    p_guest_data::text,
    v_full_name,
    v_email,
    v_phone,
    v_country_code,
    now(),
    coalesce(p_terms->>'version', 'v2026.1'),
    p_terms->>'ip',
    p_terms->>'userAgent'
  )
  RETURNING id, display_number INTO v_app_id, v_display;

  RETURN QUERY SELECT v_app_id, v_display;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_whatsapp_order(uuid, date, jsonb, jsonb) TO anon, authenticated;
