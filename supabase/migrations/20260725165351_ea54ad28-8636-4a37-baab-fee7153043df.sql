-- Register create_application_draft officially (was live in DB but missing from migrations)
CREATE OR REPLACE FUNCTION public.create_application_draft(
  p_visa_type_id uuid,
  p_travel_date date DEFAULT NULL::date,
  p_draft_data jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_profile_id uuid;
  v_application_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  SELECT id INTO v_profile_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;

  IF v_profile_id IS NULL THEN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (
      auth.uid(),
      COALESCE(auth.jwt() -> 'user_metadata' ->> 'full_name', auth.jwt() -> 'user_metadata' ->> 'name', '')
    )
    ON CONFLICT (user_id) DO NOTHING;
    SELECT id INTO v_profile_id FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.applications (user_id, visa_type_id, travel_date, status, draft_data)
  VALUES (v_profile_id, p_visa_type_id, p_travel_date, 'draft', COALESCE(p_draft_data, '{}'::jsonb))
  RETURNING id INTO v_application_id;

  RETURN v_application_id;
END;
$function$;

-- New RPC: submit an application (bypasses RLS UPDATE gap that blocks draft->submitted transition)
CREATE OR REPLACE FUNCTION public.submit_application(
  p_app_id uuid,
  p_is_bank_transfer boolean,
  p_purpose jsonb,
  p_terms_version text,
  p_terms_ip text,
  p_terms_user_agent text
)
RETURNS TABLE(id uuid, display_number text, status application_status)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_new_status application_status;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT public.is_application_owner(p_app_id, auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  v_new_status := CASE WHEN p_is_bank_transfer THEN 'pending_payment'::application_status
                       ELSE 'submitted'::application_status END;

  UPDATE public.applications
  SET status = v_new_status,
      submission_method = CASE WHEN p_is_bank_transfer THEN 'bank_transfer' ELSE 'online' END,
      submitted_at = now(),
      purpose_of_travel = p_purpose::text,
      terms_accepted_at = now(),
      terms_version = COALESCE(p_terms_version, 'v2026.1'),
      terms_ip_address = p_terms_ip,
      terms_user_agent = p_terms_user_agent,
      updated_at = now()
  WHERE applications.id = p_app_id
    AND applications.status IN ('draft', 'documents_required');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid_status_transition';
  END IF;

  RETURN QUERY
  SELECT a.id, a.display_number, a.status
  FROM public.applications a
  WHERE a.id = p_app_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_application(uuid, boolean, jsonb, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_application(uuid, boolean, jsonb, text, text, text) TO authenticated;

-- Harden payments: block direct client inserts. Only service_role (Edge Functions after webhook verification) may insert.
DROP POLICY IF EXISTS "Users can create payments for own applications" ON public.payments;
DROP POLICY IF EXISTS "Only service role can insert payments" ON public.payments;
CREATE POLICY "Only service role can insert payments"
  ON public.payments FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Slow down brute-force guessing of the staff portal secret path.
CREATE OR REPLACE FUNCTION public.check_staff_portal_path(p_candidate text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_match boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.staff_portal_settings
    WHERE id = 1 AND secret_path = p_candidate
  ) INTO v_match;

  IF NOT v_match THEN
    -- Constant-ish delay on failure to make brute force impractical.
    PERFORM pg_sleep(0.3);
  END IF;

  RETURN v_match;
END;
$$;