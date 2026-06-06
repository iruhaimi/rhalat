
-- 1. Tighten work-submissions storage policies (scope to assigned applications)
DROP POLICY IF EXISTS "Agents can read work submission files" ON storage.objects;
DROP POLICY IF EXISTS "Agents can delete their work submission files" ON storage.objects;

CREATE POLICY "Agents can read assigned work submission files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'work-submissions'
  AND (
    public.is_admin(auth.uid())
    OR (
      public.is_agent(auth.uid())
      AND public.is_assigned_agent(
        ((storage.foldername(name))[2])::uuid,
        auth.uid()
      )
    )
  )
);

CREATE POLICY "Agents can delete own assigned work submission files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND (storage.foldername(name))[1] = 'work-submissions'
  AND (
    public.is_admin(auth.uid())
    OR (
      public.is_agent(auth.uid())
      AND public.is_assigned_agent(
        ((storage.foldername(name))[2])::uuid,
        auth.uid()
      )
      AND EXISTS (
        SELECT 1 FROM public.agent_work_submissions aws
        WHERE aws.file_path = storage.objects.name
          AND aws.agent_id = public.get_profile_id(auth.uid())
      )
    )
  )
);

-- 2. Hide internal admin fields from tour operators viewing own profile
DROP POLICY IF EXISTS "Operators can view own profile" ON public.tour_operators;

CREATE OR REPLACE VIEW public.tour_operators_self AS
SELECT
  id, user_id, company_name, company_name_en, description, description_en,
  logo_url, cover_image_url, whatsapp_number, phone, email, website,
  address, city, country, is_active, created_at, updated_at
FROM public.tour_operators
WHERE user_id = auth.uid();

GRANT SELECT ON public.tour_operators_self TO authenticated;

-- Allow operators to view only safe columns through column-level grant pattern via the view.
-- Re-create a SELECT policy for operators that excludes admin-only columns by restricting raw table reads
-- to admins only. Operators must use the view above.
CREATE POLICY "Admins can read full tour operator rows"
ON public.tour_operators FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));
