
-- 1. Rotate owner account password (was hardcoded in a prior migration)
UPDATE auth.users
SET encrypted_password = crypt(encode(gen_random_bytes(24), 'hex') || '!Aa1', gen_salt('bf')),
    updated_at = now()
WHERE email = 'ibrahim@rhalat.com';

-- 2. Rotate Apple review demo account password to a new value
UPDATE auth.users
SET encrypted_password = crypt('Vf-Rev!7k2Q9pXm4T', gen_salt('bf')),
    updated_at = now()
WHERE email = 'applereview@visafaster.com';

-- 3. Tighten storage INSERT policy for agent work-submissions
DROP POLICY IF EXISTS "Agents can upload work submission files" ON storage.objects;
CREATE POLICY "Agents can upload work submission files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'work-submissions'
  AND public.is_agent(auth.uid())
  AND public.is_assigned_agent(((storage.foldername(name))[2])::uuid, auth.uid())
);

-- 4. Tighten application_status_history INSERT policy
DROP POLICY IF EXISTS "Only staff can insert status history" ON public.application_status_history;
CREATE POLICY "Only staff can insert status history"
ON public.application_status_history
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_admin(auth.uid())
  OR public.is_assigned_agent(application_id, auth.uid())
);
