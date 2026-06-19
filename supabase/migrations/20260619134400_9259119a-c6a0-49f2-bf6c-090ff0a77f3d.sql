CREATE OR REPLACE FUNCTION public.create_whatsapp_order(p_visa_type_id uuid, p_travel_date date, p_meta jsonb, p_terms jsonb)
 RETURNS TABLE(application_id uuid, display_number text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user uuid;
  v_profile_id uuid;
  v_app_id uuid;
  v_display text;
BEGIN
  v_user := auth.uid();
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF p_visa_type_id IS NULL THEN
    RAISE EXCEPTION 'invalid_visa_type';
  END IF;

  IF coalesce((p_terms->>'accepted')::boolean, false) IS NOT TRUE THEN
    RAISE EXCEPTION 'terms_not_accepted';
  END IF;

  SELECT id INTO v_profile_id FROM public.profiles WHERE user_id = v_user LIMIT 1;
  IF v_profile_id IS NULL THEN
    INSERT INTO public.profiles (user_id, full_name)
    VALUES (
      v_user,
      COALESCE(auth.jwt() -> 'user_metadata' ->> 'full_name', auth.jwt() -> 'user_metadata' ->> 'name', '')
    )
    ON CONFLICT (user_id) DO NOTHING;
    SELECT id INTO v_profile_id FROM public.profiles WHERE user_id = v_user LIMIT 1;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user, 'customer')
  ON CONFLICT (user_id, role) DO NOTHING;

  INSERT INTO public.applications (
    user_id,
    visa_type_id,
    travel_date,
    status,
    submission_method,
    submitted_at,
    purpose_of_travel,
    terms_accepted_at,
    terms_version,
    terms_ip_address,
    terms_user_agent
  ) VALUES (
    v_profile_id,
    p_visa_type_id,
    p_travel_date,
    'whatsapp_pending',
    'whatsapp',
    now(),
    COALESCE(p_meta::text, ''),
    now(),
    COALESCE(p_terms->>'version', 'v2026.1'),
    p_terms->>'ip',
    p_terms->>'userAgent'
  )
  RETURNING applications.id, applications.display_number INTO v_app_id, v_display;

  RETURN QUERY SELECT v_app_id, v_display;
END;
$function$;