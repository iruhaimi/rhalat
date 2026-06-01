## تنفيذ المراحل المتبقية من خطة تحسين SEO

المرحلة 1 (البنية التحتية + GSC) مكتملة. سأنفذ الآن المراحل 2 و3 و4 بالتتابع، مع نقاط توقف بينها للمراجعة.

---

### المرحلة 2: توسيع صفحات الدول والتأشيرات

**قاعدة البيانات (migration):**
- `countries`: إضافة `seo_title`, `seo_description`, `long_description`, `faqs` (JSONB), `processing_steps` (JSONB), `tips` (JSONB).
- `visa_types`: إضافة `seo_description`, `requirements_detailed` (JSONB حسب الجنسية), `common_rejection_reasons` (JSONB), `processing_timeline` (JSONB).
- الحفاظ على RLS الحالية + GRANTs الصحيحة.

**واجهة العميل:**
- إعادة بناء `CountryDetail.tsx` بأقسام جديدة: نظرة عامة، شروط حسب الجنسية (مواطن/مقيم)، خطوات، أسباب الرفض، نصائح، FAQ accordion، CTA.
- تحديث `VisaDetail.tsx` بنفس الأقسام التفصيلية.
- JSON-LD ديناميكي يقرأ من DB (Service + FAQPage + BreadcrumbList).

**لوحة الإدارة:**
- `/admin/seo-content` (Owner + Admin) لتحرير حقول SEO لكل دولة وتأشيرة دون كتابة كود.
- Seed أولي لأكثر 10 دول طلباً: الشنغن، بريطانيا، أمريكا، أستراليا، كندا، اليابان، كوريا، الصين، روسيا، تركيا.
- إضافة العنصر في `AdminLayout` sidebar تحت إذن مناسب.

**Sitemap:**
- يشمل بالفعل كل دولة وتأشيرة من المرحلة 1.

---

### المرحلة 3: نظام المدونة الكامل

**قاعدة البيانات:**
- `blog_categories`: id, slug, name_ar, name_en, description, display_order, is_active.
- `blog_posts`: id, slug (unique), title_ar/en, excerpt_ar/en, content_ar/en (markdown), cover_image_url, category_id, author_id, tags (text[]), seo_title, seo_description, status (draft/published), published_at, views_count.
- RLS: قراءة عامة للمنشور فقط، كتابة لـ Admin/Owner. GRANTs صريحة. + Storage bucket `blog-images` بصلاحيات مناسبة.

**الصفحات العامة:**
- `/blog`: قائمة + فلتر فئات + بحث + ترقيم.
- `/blog/:slug`: محتوى المقال + Helmet + Article JSON-LD + BreadcrumbList + مقالات ذات صلة + CTA للتقديم.

**لوحة الإدارة:**
- `/admin/blog` (قائمة)، `/admin/blog/new`، `/admin/blog/:id/edit`.
- محرر markdown (`@uiw/react-md-editor`)، رفع صور غلاف، معاينة، جدولة نشر.

**Seed 5 مقالات عربية:**
1. أسباب رفض فيزا الشنغن وكيف تتجنبها.
2. كيف تستخرج كشف حساب بنكي معتمد للسفر.
3. دليل تأشيرة بريطانيا للمقيمين في السعودية 2026.
4. الفرق بين فيزا الشنغن السياحية وفيزا الأعمال.
5. كم تستغرق تأشيرة أمريكا من السعودية + نصائح المقابلة.

**Sitemap:**
- تحديث `scripts/generate-sitemap.ts` لتشمل `/blog` و كل `/blog/:slug` للمقالات المنشورة فقط.

---

### المرحلة 4: تدقيق الأداء وتحسينه

1. تشغيل `browser--performance_profile` على الرئيسية وصفحة تأشيرة لقياس Web Vitals.
2. تثبيت `vite-imagetools` وتحويل صور الـ Hero/الأعلام إلى WebP/AVIF.
3. `<link rel="preload" as="image">` لصورة LCP في `index.html`.
4. مراجعة code-splitting: تأكيد `lazy()` لمسارات `/admin/*` و `/agent/*` و `/portal-*`.
5. إضافة `defer` لسكربتات الطرف الثالث (analytics, chat widgets).
6. تشغيل `seo_chat--trigger_scan` ومعالجة كل findings ناتجة.
7. التحقق النهائي: هدف Performance ≥ 90, SEO = 100, Accessibility ≥ 90.

---

### تفاصيل تقنية موحّدة

- كل migration تتبع قاعدة GRANT الصريحة + RLS + `search_path = public` في أي SECURITY DEFINER.
- اللغة الافتراضية عربية، مع hreflang ar/en/x-default.
- لا تغيير في business logic أو نظام المدفوعات أو نظام الوكلاء أو قواعد PDPL.
- لا تعديل على `src/integrations/supabase/types.ts` أو `client.ts` (تُولّد تلقائياً).

---

### نقاط التوقف
- بعد المرحلة 2: مراجعة الـ UI الجديد لصفحات الدول قبل بناء المدونة.
- بعد المرحلة 3: مراجعة المقالات الـ5 والـ admin panel قبل تدقيق الأداء.
- بعد المرحلة 4: تقرير نهائي بنتائج Lighthouse وأي توصيات إضافية.

سأبدأ بالمرحلة 2 فور اعتمادك.
