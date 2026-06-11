DROP POLICY IF EXISTS "Super admins can manage footer settings" ON public.footer_settings;

CREATE POLICY "Super admins can insert footer settings"
  ON public.footer_settings FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update footer settings"
  ON public.footer_settings FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete footer settings"
  ON public.footer_settings FOR DELETE TO authenticated
  USING (public.is_super_admin(auth.uid()));

GRANT SELECT ON public.footer_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.footer_settings TO authenticated;
GRANT ALL ON public.footer_settings TO service_role;