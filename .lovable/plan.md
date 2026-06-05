## المشكلة
أعلام الدول تظهر باهتة في صفحات الدول والوجهات بسبب طبقة gradient `from-navy/30` فوقها وفلتر `saturate-150 contrast-110` غير كافٍ.

## الإصلاح المقترح للأعلام
- **إزالة طبقة الـ navy gradient** من فوق الأعلام في:
  - `src/components/home/CountriesSection.tsx`
  - `src/pages/Destinations.tsx`
  - `src/pages/CountryDetail.tsx`
  - `src/pages/SchengenDetail.tsx`
  - `src/pages/MyApplications.tsx`
  - `src/pages/MyApplicationDetail.tsx`
- **رفع التشبع والوضوح**: `saturate-[1.8] contrast-125 brightness-105` بدل `saturate-150 contrast-110`.
- **إبقاء العلم كاملاً ظاهراً** بدون أي overlay، مع `ring-1 ring-black/5` خفيف للحدّ فقط.
- **رفع جودة الصورة**: استخدام `flagcdn w2560` بدل `w1280` لشاشات Retina.

## المجموعة الثانية: تجديد كامل الصفحات الداخلية
بنفس هوية Bento Minimalist (Navy/Cream، Cairo Black، `rounded-3xl`، framer-motion):

| الصفحة | الملف | الإطار الحالي | بعد التجديد |
|---|---|---|---|
| من نحن | `src/pages/About.tsx` | بسيط | Hero navy + بطاقات قيم + قسم إحصائيات + Timeline |
| الأسئلة الشائعة | `src/pages/FAQ.tsx` | Accordion عادي | Hero + بحث + Accordion `rounded-2xl` + CTA |
| تواصل معنا | `src/pages/Contact.tsx` | نموذج عادي | Split: نموذج بطاقة Bento + بطاقات قنوات تواصل + خريطة |
| الأسعار | `src/pages/Pricing.tsx` | جدول | Hero + 3 بطاقات تسعير `rounded-4xl` بحدود navy + FAQ مصغّر |
| الخصوصية | `src/pages/Privacy.tsx` | نص طويل | Hero navy + Table of Contents جانبي + بطاقات أقسام |
| الشروط | `src/pages/Terms.tsx` | نص طويل | نفس نمط Privacy |
| Refund | `src/pages/Refund.tsx` | نص + form | Hero + بطاقتان: السياسة + التتبع |
| تتبع الاسترداد | `src/pages/TrackRefund.tsx` | form بسيط | Hero + بطاقة بحث كبيرة + Timeline حالة |
| تتبع طلب | `src/pages/TrackApplication.tsx` | form بسيط | Hero + بطاقة بحث + Timeline + بطاقة نتيجة |
| المدونة | `src/pages/Blog.tsx` | grid عادي | Hero + Featured post + grid بطاقات `rounded-3xl` |
| تفاصيل مقال | `src/pages/BlogPost.tsx` | نص | Hero بصورة كبيرة + محتوى مرتّب + Related |
| العروض | `src/pages/SpecialOffers.tsx` | بطاقات | Hero + شبكة Bento بأحجام مختلطة + Countdown بارز |
| السياحة | `src/pages/Tourism.tsx` | grid | Hero + فلاتر + بطاقات برامج كبيرة |
| تفاصيل برنامج | `src/pages/TourismDetail.tsx` | بسيط | Hero بصورة + Bento تفاصيل + بطاقة حجز sticky |
| التسجيل/الدخول | `src/pages/Auth.tsx` | form | Split-screen: نموذج جانب + صورة/Brand جانب |
| 404 | `src/pages/NotFound.tsx` | بسيط | Hero مع illustration + CTA |
| Install (PWA) | `src/pages/Install.tsx` | تعليمات | Hero + 3 خطوات بطاقات |

## القرارات البصرية الموحّدة
- **خلفية الصفحة**: `bg-canvas` (#fafbfc)
- **Hero موحّد**: `bg-gradient-to-br from-navy via-navy/95 to-brand` + عنوان `font-heading-ar` 3xl-5xl
- **بطاقات**: `rounded-3xl border-border shadow-xl shadow-navy/5` + hover-lift
- **حركة**: framer-motion `whileInView` fade-up + stagger 0.08
- **CTA**: `bg-navy text-white rounded-2xl h-12`

## ما لن يتغير
- المنطق، الـ queries، RLS، routes، SEO، Header/Footer، نصوص المحتوى، الـ wizard، الـ admin، الـ auth flow.
- فقط الـ layout والـ visual layer.

## ترتيب التنفيذ المقترح
1. **إصلاح الأعلام** (10 دقائق) — أولوية فورية.
2. **الصفحات الثابتة الأساسية**: About, FAQ, Contact, Pricing, Privacy, Terms.
3. **صفحات التتبع والاسترداد**: TrackApplication, TrackRefund, Refund.
4. **المحتوى والتسويق**: Blog, BlogPost, SpecialOffers.
5. **السياحة**: Tourism, TourismDetail.
6. **خدمية**: Auth, NotFound, Install.

## التحقق
- زيارة كل صفحة بعد تنفيذها والتأكد من RTL سليم وعدم وجود console errors.
- التأكد أن الأعلام أصبحت زاهية وواضحة بدون طبقة داكنة.