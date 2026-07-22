
DROP POLICY IF EXISTS "Agents can update assigned applications" ON public.applications;
CREATE POLICY "Agents can update assigned applications"
ON public.applications
FOR UPDATE
USING (is_assigned_agent(id, auth.uid()))
WITH CHECK (is_assigned_agent(id, auth.uid()));

DROP POLICY IF EXISTS "Users can update own draft applications" ON public.applications;
CREATE POLICY "Users can update own draft applications"
ON public.applications
FOR UPDATE
USING (
  is_application_owner(id, auth.uid())
  AND status = ANY (ARRAY['draft'::application_status, 'documents_required'::application_status])
)
WITH CHECK (
  is_application_owner(id, auth.uid())
  AND status = ANY (ARRAY['draft'::application_status, 'documents_required'::application_status])
);
