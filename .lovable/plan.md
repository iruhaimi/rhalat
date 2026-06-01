
## المرحلة 3: نظام المدونة الكامل

### قاعدة البيانات (migration واحد)
- `blog_categories`: slug فريد، name_ar، name_en، description، display_order، is_active.
- `blog_posts`: slug فريد، title_ar/en، excerpt_ar/en، content_ar/en (markdown)، cover_image_url، category_id (FK)، author_id (uuid)، tags (text[])، seo_title، seo_description، status ('draft'|'published')، published_at، views_count، created_at، updated_at.
- GRANTs صريحة: `anon` و `authenticated` يقرؤون المنشور فقط، Admin/Owner يكتبون عبر RLS باستخدام `has_role` / `has_permission`.
- Storage bucket عام `blog-images` + policies (قراءة عامة، رفع/تعديل/حذف لـ Admin فقط).
- Trigger لتحديث `updated_at`.

### الصفحات العامة
- `/blog` — قائمة مع فلتر فئات، بحث بالعنوان، ترقيم 12/صفحة، SEO عام + ItemList JSON-LD.
- `/blog/:slug` — محتوى ماركداون (react-markdown + remark-gfm)، Helmet + Article JSON-LD + BreadcrumbList، مقالات ذات صلة (نفس الفئة)، CTA لتقديم تأشيرة، زيادة `views_count` عبر RPC.

### لوحة الإدارة
- `/admin/blog` — قائمة + بحث + فلتر حالة، أزرار جديد/تعديل/حذف/نشر.
- `/admin/blog/new` و `/admin/blog/:id/edit` — نموذج كامل: حقول ثنائية اللغة، محرر markdown (`@uiw/react-md-editor`)، رفع صورة غلاف لـ `blog-images`، اختيار فئة، tags، حقول SEO، حالة، جدولة نشر.
- `/admin/blog/categories` — إدارة الفئات.
- إضافة الروابط في `AdminLayout` sidebar تحت إذن `manage_content` (أو ما يماثله).

### بذور (Seed) — 5 مقالات عربية + 3 فئات
1. أسباب رفض فيزا الشنغن وكيف تتجنبها.
2. كيف تستخرج كشف حساب بنكي معتمد للسفر.
3. دليل تأشيرة بريطانيا للمقيمين في السعودية 2026.
4. الفرق بين فيزا الشنغن السياحية وفيزا الأعمال.
5. كم تستغرق تأشيرة أمريكا من السعودية + نصائح المقابلة.

### Sitemap
- تحديث `scripts/generate-sitemap.ts` ليجلب `blog_posts` حيث `status = 'published'` ويضيف `/blog` و `/blog/:slug`.

### Header/Footer
- إضافة رابط "المدونة" في `HeaderArabic` و `FooterArabic`.

---

## المرحلة 4: تدقيق الأداء وتحسينه

1. تشغيل `browser--performance_profile` على `/` وصفحة تأشيرة لقياس Web Vitals الأساسية.
2. تركيب `vite-imagetools` وتحويل صور الـ Hero والأعلام إلى WebP/AVIF.
3. `<link rel="preload" as="image" fetchpriority="high">` لصورة LCP في `index.html`.
4. مراجعة code-splitting في `App.tsx`: تحويل كل صفحات `/admin/*` و `/agent/*` و `/tourism-portal/*` إلى `lazy()` مع `Suspense` fallback.
5. إضافة `defer` لأي سكربتات طرف ثالث في `index.html`.
6. تشغيل `seo_chat--trigger_scan` ومعالجة الـ findings عبر `update_findings`.
7. تقرير نهائي: نتائج Lighthouse المستهدفة (Performance ≥ 90، SEO = 100، Accessibility ≥ 90).

---

## تفاصيل تقنية
- جميع SECURITY DEFINER functions تستخدم `SET search_path = public`.
- لا تعديل على `src/integrations/supabase/client.ts` أو `types.ts` يدوياً.
- المدونة افتراضياً عربية مع دعم EN عبر `LanguageContext` الموجود.
- لا تغيير في business logic أو نظام الدفع أو الوكلاء أو PDPL.
- إضافة الحزم: `@uiw/react-md-editor`، `react-markdown`، `remark-gfm`، `vite-imagetools`.

## نقاط التوقف
- بعد المرحلة 3: مراجعة المدونة وlوحة الإدارة قبل الانتقال للأداء.
- بعد المرحلة 4: تقرير Lighthouse نهائي.
