-- CRITICAL: staff_2fa_codes open policies
DROP POLICY IF EXISTS "Allow anonymous to verify 2FA codes" ON public.staff_2fa_codes;
DROP POLICY IF EXISTS "Allow anonymous to mark 2FA codes as used" ON public.staff_2fa_codes;

-- HIGH: staff_login_attempts open insert
DROP POLICY IF EXISTS "Anyone can insert login attempts" ON public.staff_login_attempts;

-- HIGH: security_audit_log open insert
DROP POLICY IF EXISTS "System can insert security logs" ON public.security_audit_log;

-- MEDIUM: refund_requests anon insert
DROP POLICY IF EXISTS "Anyone can submit refund requests" ON public.refund_requests;

-- MEDIUM: get_agents_for_transfer role check
CREATE OR REPLACE FUNCTION public.get_agents_for_transfer(exclude_profile_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(id uuid, full_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL OR NOT (public.is_agent(auth.uid()) OR public.is_admin(auth.uid())) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT p.id, p.full_name
  FROM public.profiles p
  INNER JOIN public.user_roles ur ON p.user_id = ur.user_id
  WHERE ur.role = 'agent'
    AND (exclude_profile_id IS NULL OR p.id != exclude_profile_id);
END;
$function$;