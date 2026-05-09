CREATE OR REPLACE FUNCTION public.verify_staff_2fa(p_user_id uuid, p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_id uuid;
  normalized_code text;
  reversed_code text;
  code_hash text;
  reversed_code_hash text;
BEGIN
  normalized_code := regexp_replace(
    translate(coalesce(p_code, ''), '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789'),
    '[^0-9]',
    '',
    'g'
  );

  IF length(normalized_code) <> 6 THEN
    RETURN false;
  END IF;

  reversed_code := reverse(normalized_code);
  code_hash := encode(sha256(convert_to(normalized_code, 'UTF8')), 'hex');
  reversed_code_hash := encode(sha256(convert_to(reversed_code, 'UTF8')), 'hex');

  SELECT id
  INTO found_id
  FROM public.staff_2fa_codes
  WHERE user_id = p_user_id
    AND code IN (code_hash, reversed_code_hash)
    AND used = false
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF found_id IS NULL THEN
    RETURN false;
  END IF;

  UPDATE public.staff_2fa_codes
  SET used = true
  WHERE id = found_id;

  RETURN true;
END;
$$;