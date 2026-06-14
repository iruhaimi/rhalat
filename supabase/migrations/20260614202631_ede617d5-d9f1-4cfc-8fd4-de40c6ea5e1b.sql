
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_en text,
  icon_name text,
  logo_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.partners TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active partners" ON public.partners
  FOR SELECT USING (is_active = true);

CREATE POLICY "Super admins can view all partners" ON public.partners
  FOR SELECT TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can insert partners" ON public.partners
  FOR INSERT TO authenticated WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update partners" ON public.partners
  FOR UPDATE TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete partners" ON public.partners
  FOR DELETE TO authenticated USING (public.is_super_admin(auth.uid()));

CREATE TRIGGER partners_set_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.partners (name, icon_name, display_order) VALUES
  ('الخطوط السعودية', 'Plane', 1),
  ('بنك الراجحي', 'Landmark', 2),
  ('أرامكو السعودية', 'Factory', 3),
  ('سابك', 'Building2', 4),
  ('الاتصالات السعودية', 'Smartphone', 5),
  ('موبايلي', 'Wifi', 6);

INSERT INTO public.site_content (page, section, content, is_active)
SELECT 'home', 'partners_section',
  jsonb_build_object(
    'enabled', true,
    'eyebrow_ar', 'شركاؤنا في النجاح',
    'eyebrow_en', 'Our partners',
    'title_ar', 'موثوق من قبل أفضل الشركات',
    'title_en', 'Trusted by leading companies'
  ),
  true
WHERE NOT EXISTS (
  SELECT 1 FROM public.site_content WHERE page='home' AND section='partners_section'
);
