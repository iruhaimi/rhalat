-- Per-visa-type customizable requirements/documents
CREATE TABLE public.visa_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visa_type_id uuid NOT NULL REFERENCES public.visa_types(id) ON DELETE CASCADE,
  code text,
  name_ar text NOT NULL,
  name_en text NOT NULL,
  description_ar text,
  description_en text,
  icon text DEFAULT 'file',
  applies_to text NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all','adult','child','infant')),
  is_required boolean NOT NULL DEFAULT true,
  requires_upload boolean NOT NULL DEFAULT true,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX visa_requirements_visa_type_idx ON public.visa_requirements(visa_type_id, display_order);

GRANT SELECT ON public.visa_requirements TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.visa_requirements TO authenticated;
GRANT ALL ON public.visa_requirements TO service_role;

ALTER TABLE public.visa_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active visa requirements"
  ON public.visa_requirements FOR SELECT
  USING (is_active = true OR public.is_admin(auth.uid()) OR public.has_permission(auth.uid(), 'manage_settings'));

CREATE POLICY "Admins manage visa requirements"
  ON public.visa_requirements FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()) OR public.has_permission(auth.uid(), 'manage_settings'))
  WITH CHECK (public.is_admin(auth.uid()) OR public.has_permission(auth.uid(), 'manage_settings'));

CREATE TRIGGER visa_requirements_updated_at
  BEFORE UPDATE ON public.visa_requirements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed defaults for all existing visa types so the wizard isn't empty
INSERT INTO public.visa_requirements (visa_type_id, code, name_ar, name_en, description_ar, description_en, icon, applies_to, is_required, requires_upload, display_order)
SELECT vt.id, d.code, d.name_ar, d.name_en, d.description_ar, d.description_en, d.icon, d.applies_to, d.is_required, true, d.display_order
FROM public.visa_types vt
CROSS JOIN (VALUES
  ('passport',         'جواز السفر',           'Passport',            'صورة واضحة من جواز السفر سارٍ لمدة 6 أشهر على الأقل', 'Clear copy of passport valid for at least 6 months', 'passport', 'all',    true,  1),
  ('photo',            'الصورة الشخصية',       'Personal Photo',      'صورة شخصية حديثة بخلفية بيضاء',                       'Recent personal photo with white background',       'photo',    'all',    true,  2),
  ('bank_statement',   'كشف الحساب البنكي',    'Bank Statement',      'كشف حساب آخر 3 أشهر بالإنجليزية ومختوم من البنك',     'Last 3 months bank statement in English, stamped',  'bank',     'adult',  true,  3),
  ('hotel_booking',    'حجز الفندق',           'Hotel Booking',       'حجز فندقي مؤكد لمدة الإقامة',                         'Confirmed hotel booking for the stay',              'hotel',    'all',    false, 4),
  ('flight_booking',   'حجز الطيران',          'Flight Booking',      'حجز طيران ذهاب وعودة',                                'Round-trip flight reservation',                     'flight',   'all',    false, 5),
  ('travel_insurance', 'تأمين السفر',          'Travel Insurance',    'وثيقة تأمين سفر سارية',                               'Valid travel insurance policy',                     'insurance','all',    false, 6),
  ('birth_certificate','شهادة الميلاد',        'Birth Certificate',   'شهادة ميلاد مترجمة',                                  'Translated birth certificate',                      'file',     'child',  false, 7),
  ('birth_certificate_infant','شهادة ميلاد الرضيع','Infant Birth Certificate','شهادة ميلاد الرضيع',                       'Infant birth certificate',                          'file',     'infant', false, 8)
) AS d(code, name_ar, name_en, description_ar, description_en, icon, applies_to, is_required, display_order);