## خطة تحسين SEO الشاملة لـ visafaster.com

تنفيذ على 4 مراحل متتالية، كل مرحلة قابلة للإطلاق بشكل مستقل.

---

### المرحلة 1: ربط Google Search Console + بنية SEO تحتية (سريع — أساس لكل ما بعده)

1. تثبيت `react-helmet-async` وإضافة `<HelmetProvider>` في `src/main.tsx`.
2. إنشاء مكوّن `SEO` مركزي (موجود جزئياً في `src/components/seo/SEO.tsx`) واستخدامه في كل الصفحات العامة (الرئيسية، الوجهات، تفاصيل الدولة، تفاصيل التأشيرة، الأسعار، العروض، السياحة، من نحن، تواصل، الأسئلة الشائعة).
3. تحديث `index.html`: إزالة `<link rel="canonical">` الثابت (سينتقل إلى Helmet لكل صفحة)، إبقاء og:* العامة كـ fallback، إضافة JSON-LD من نوع `Organization`.
4. التحقق من ملكية الموقع في Google Search Console عبر connector جوجل (إضافة meta tag + استدعاء verify + إضافة الموقع تلقائياً).
5. تحويل `public/sitemap.xml` الثابت إلى مُولِّد ديناميكي `scripts/generate-sitemap.ts` يقرأ الدول والتأشيرات من قاعدة البيانات وقت البناء، ويُضاف عبر `predev`/`prebuild`.

**النتيجة:** كل صفحة لها title/description/canonical فريد، sitemap يتحدث تلقائياً، الموقع موصول بـ GSC.

---

### المرحلة 2: توسيع صفحات الدول والتأشيرات (أكبر أثر سريع)

1. **توسيع جدول `countries`**: إضافة حقول `seo_title`, `seo_description`, `long_description` (نص غني)، `faqs` (JSONB array)، `processing_steps` (JSONB)، `tips` (JSONB).
2. **توسيع جدول `visa_types`**: إضافة `seo_description`, `requirements_detailed` (JSONB حسب الجنسية: مواطن/مقيم)، `common_rejection_reasons` (JSONB)، `processing_timeline` (JSONB).
3. **إعادة بناء `CountryDetail.tsx`**: أقسام جديدة (نظرة عامة، الشروط حسب الجنسية، الخطوات، أسباب الرفض الشائعة، نصائح، FAQ accordion، CTA).
4. **JSON-LD لكل صفحة دولة/تأشيرة**: من نوع `Service` + `FAQPage` + `BreadcrumbList`.
5. **لوحة إدارة المحتوى SEO**: صفحة `/admin/seo-content` (Owner + Admin فقط) لتحرير حقول SEO لكل دولة وتأشيرة بدون كتابة كود، مع `seed` أولي لأكثر 10 دول طلباً (الشنغن، بريطانيا، أمريكا، أستراليا، كندا، اليابان، كوريا، الصين، روسيا، تركيا).
6. تحديث `sitemap` ليشمل كل دولة وكل تأشيرة (`/country/:code`, `/visa/:id`).

**النتيجة:** ~50+ صفحة غنية ومُهيّأة، كل واحدة تستهدف كلمة مفتاحية محددة.

---

### المرحلة 3: نظام المدونة (أكبر أثر طويل المدى)

1. **مخطط قاعدة البيانات**:
   - `blog_categories`: id, slug, name_ar, name_en, description, display_order.
   - `blog_posts`: id, slug (unique)، title_ar, title_en, excerpt_ar, excerpt_en, content_ar (markdown/html), content_en, cover_image_url, category_id, author_id, tags (text[]), seo_title, seo_description, status (draft/published)، published_at, views_count.
   - RLS: قراءة عامة للمنشور فقط، كتابة للـ Admin/Owner، + GRANTs الصحيحة.
2. **صفحات عامة**: `/blog` (قائمة + فلتر فئات + بحث)، `/blog/:slug` (مقال مع Helmet + Article JSON-LD + BreadcrumbList + FAQ مدمج إن وُجد + مقالات ذات صلة + CTA للتقديم).
3. **لوحة إدارة المدونة**: `/admin/blog` و `/admin/blog/new` و `/admin/blog/:id/edit` مع محرر markdown (مثلاً `@uiw/react-md-editor`)، رفع صور غلاف، معاينة، جدولة نشر.
4. **5 مقالات أولية بالعربية** (seeded مع المخطط):
   - أسباب رفض فيزا الشنغن وكيف تتجنبها
   - كيف تستخرج كشف حساب بنكي معتمد للسفر
   - دليل تأشيرة بريطانيا للمقيمين في السعودية 2026
   - الفرق بين فيزا الشنغن السياحية وفيزا الأعمال
   - كم تستغرق تأشيرة أمريكا من السعودية + نصائح المقابلة
5. تحديث `sitemap` ليشمل المقالات المنشورة (`/blog`, `/blog/:slug`).

**النتيجة:** قناة جلب زيارات عضوية مجانية مستمرة + سلطة موضوعية (Topical Authority).

---

### المرحلة 4: تدقيق الأداء وتحسينه

1. تشغيل `browser--performance_profile` على الرئيسية وصفحة تأشيرة لقياس Web Vitals الفعلية.
2. بناءً على القياس:
   - تحويل صور الأعلام والـ Hero إلى WebP/AVIF عبر `vite-imagetools`.
   - `<link rel="preload" as="image">` لصورة LCP.
   - مراجعة code-splitting (تأكيد lazy loading لمسارات `/admin/*` و `/agent/*` و `/portal-*`).
   - تأجيل تحميل سكربتات الطرف الثالث (analytics, chat widgets) بـ `defer`.
   - مراجعة bundle size عبر `rollup-plugin-visualizer`.
3. تشغيل scan SEO الداخلي (`seo_chat--trigger_scan`) ومعالجة كل findings.
4. التحقق النهائي من Lighthouse: هدف Performance ≥ 90, SEO = 100, Accessibility ≥ 90.

**النتيجة:** سرعة تحميل < 2.5 ثانية، Core Web Vitals خضراء، جاهزية كاملة للأرشفة.

---

### تفاصيل تقنية مهمة

- **اللغة في الـ SEO**: العربية أساسية. كل `<html lang="ar" dir="rtl">` ثابت، Helmet يحقن `lang` إذا تغيّرت اللغة.
- **hreflang**: إضافة `<link rel="alternate" hreflang="ar">` و `hreflang="en">` و `hreflang="x-default"` لكل صفحة لها نسختان.
- **canonical**: كل صفحة فريد، لا تكرار، يستخدم `https://visafaster.com` (بدون www، بدون trailing slash موحّد).
- **منع أرشفة الصفحات الإدارية**: إضافة `<meta name="robots" content="noindex">` عبر Helmet في `AdminLayout`, `AgentLayout`, `TourOperatorLayout`, `SecureStaffAuth`, `Auth`, `MyApplications*`, `Profile`.
- **robots.txt**: إبقاء البنية الحالية + إضافة `Disallow: /portal-x7k9m2`, `Disallow: /admin`, `Disallow: /agent` صراحةً (طبقة دفاع إضافية).
- **JSON-LD المُستخدم**:
  - الموقع كله: `Organization` + `WebSite` (SearchAction).
  - الرئيسية: `Organization` فقط.
  - صفحة دولة: `Service` + `BreadcrumbList` + `FAQPage`.
  - مقال مدونة: `Article` + `BreadcrumbList`.
  - تواصل: `ContactPage`.
  - الأسئلة الشائعة: `FAQPage`.
- **التتبع**: التأكد من وجود Google Analytics 4 موصول (إن لم يكن، سيُطلب من المستخدم client ID).
- **الأمان**: كل جداول/RPC جديدة تتبع قواعد المشروع (GRANT صريح، RLS، `search_path = public` في كل SECURITY DEFINER، حماية الكتابة بأدوار Owner/Admin فقط).
- **المحافظة على القائم**: لا تغيير في business logic، الـ admin AI Assistant، نظام المدفوعات، نظام الوكلاء، أو أي قواعد PDPL.

---

### الترتيب الزمني المقترح
- المرحلة 1 → قابلة للإطلاق فوراً، تتيح GSC يبدأ بقراءة الموقع.
- المرحلة 2 → الأكبر أثراً لأن الصفحات موجودة وتحتاج محتوى فقط.
- المرحلة 3 → مشروع مستمر، تُسلَّم البنية + 5 مقالات والمستخدم يكمل النشر.
- المرحلة 4 → بعد استقرار المحتوى لقياس واقعي.

سأبدأ بالمرحلة 1 فور موافقتك، وننتقل للمراحل الأخرى واحدة تلو الأخرى مع رسائل توقف بينها لمراجعتك.
