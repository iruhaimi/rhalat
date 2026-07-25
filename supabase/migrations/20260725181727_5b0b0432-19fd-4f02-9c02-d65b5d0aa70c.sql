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
AS $function$
DECLARE
  v_new_status application_status;
  v_missing_required boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not_authenticated';
  END IF;

  IF NOT public.is_application_owner(p_app_id, auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Server-side defense-in-depth: every required + requires_upload requirement
  -- for this visa type must have at least one matching document row.
  SELECT EXISTS (
    SELECT 1
    FROM public.visa_requirements vr
    JOIN public.applications a ON a.id = p_app_id
    WHERE vr.visa_type_id = a.visa_type_id
      AND vr.is_required = true
      AND vr.requires_upload = true
      AND vr.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM public.application_documents ad
        WHERE ad.application_id = p_app_id
          AND ad.document_type = vr.id::text
      )
  ) INTO v_missing_required;

  IF v_missing_required THEN
    RAISE EXCEPTION 'missing_required_documents';
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
$function$;