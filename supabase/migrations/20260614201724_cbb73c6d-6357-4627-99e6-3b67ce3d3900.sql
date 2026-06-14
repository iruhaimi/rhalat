CREATE POLICY "Super admins can view all footer settings"
ON public.footer_settings
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));