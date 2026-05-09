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
  -- Normalize input: convert Arabic/Persian numerals to English digits and remove separators/spaces.
  normalized_code := regexp_replace(
    translate(coalesce(p_code, ''), '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789'),
    '[^0-9]',
    '',
    'g'
  );

  IF length(normalized_code) <> 6 THEN
    RETURN false;
  END IF;

  -- Some RTL email clients visually reverse 6-digit codes. Accept both orientations.
  reversed_code := reverse(normalized_code);
  code_hash := encode(sha256(convert_to(normalized_code, 'UTF8')), 'hex');
  reversed_code_hash := encode(sha256(convert_to(reversed_code, 'UTF8')), 'hex');

  UPDATE public.staff_2fa_codes
  SET used = true
  WHERE id = (
    SELECT id
    FROM public.staff_2fa_codes
    WHERE user_id = p_user_id
      AND code IN (code_hash, reversed_code_hash)
      AND used = false
      AND expires_at > now()
    ORDER BY created_at DESC
    LIMIT 1
  )
  RETURNING id INTO found_id;

  RETURN found_id IS NOT NULL;
END;
$$;