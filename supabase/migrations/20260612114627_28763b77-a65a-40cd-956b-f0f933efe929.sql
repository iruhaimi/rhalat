
UPDATE public.profiles
SET phone = CASE
  WHEN phone IS NULL OR phone = '' THEN phone
  ELSE (
    -- Strip prefixes after removing non-digits
    CASE
      WHEN regexp_replace(phone, '\D', '', 'g') LIKE '00966%' THEN substring(regexp_replace(phone, '\D', '', 'g') from 6)
      WHEN regexp_replace(phone, '\D', '', 'g') LIKE '966%'   THEN substring(regexp_replace(phone, '\D', '', 'g') from 4)
      WHEN regexp_replace(phone, '\D', '', 'g') LIKE '0%'     THEN substring(regexp_replace(phone, '\D', '', 'g') from 2)
      ELSE regexp_replace(phone, '\D', '', 'g')
    END
  )
END
WHERE phone IS NOT NULL
  AND phone <> ''
  AND phone <> regexp_replace(phone, '\D', '', 'g')
  OR phone ~ '^(0|966|00966)';
