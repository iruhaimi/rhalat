# إعادة تصميم صفحات الدول والتأشيرات (المجموعة 1/4)

## النطاق
خمس صفحات داخلية بنفس هوية الـ Homepage الجديدة (Navy/Cream، Syne + Plus Jakarta Sans + Cairo، بطاقات `rounded-4xl`، Bento، framer-motion).

| الصفحة | الملف | التغيير الرئيسي |
|---|---|---|
| قائمة الدول | `src/pages/Destinations.tsx` | Hero مضغوط + شريط بحث/فلتر زجاجي + شبكة بطاقات كبيرة مع علم بدقة عالية وتشبّع لون |
| تفاصيل دولة | `src/pages/CountryDetail.tsx` | Hero بنتو (علم كبير + إحصائيات + CTA) + قسم تأشيرات بشبكة، Accordion للمتطلبات |
| تفاصيل شنغن | `src/pages/SchengenDetail.tsx` | نفس نمط CountryDetail + شبكة الـ 26 دولة |
| كل التأشيرات | `src/pages/VisaServices.tsx` | شريط فلاتر علوي ثابت + بطاقات تأشيرات `rounded-3xl` بسعر بارز |
| تفاصيل تأشيرة | `src/pages/VisaDetail.tsx` | Hero مع ملخص + عمودان: تفاصيل/متطلبات + بطاقة سعر ثابتة Sticky |

## القرارات البصرية المشتركة
- **خلفية الصفحة**: `bg-canvas` (#fafbfc)
- **Hero داخلي**: شريط مضغوط بـ `bg-gradient-to-br from-navy via-navy/95 to-brand` + نص أبيض + Syne للأرقام الكبيرة
- **عناوين عربية**: `font-heading-ar` (Cairo Black) بحجم 4xl–6xl
- **بطاقات**: `rounded-4xl bg-card border border-border` + `hover:shadow-2xl hover:shadow-navy/5 hover:-translate-y-1`
- **أعلام**: `flagcdn w1280` + `saturate-150 contrast-110` + gradient `from-navy/30` (نفس إصلاح Homepage)
- **CTA رئيسي**: `bg-navy text-white rounded-2xl h-12` ، الثانوي `outline` بحدود `border-border`
- **حركة**: `motion.div` مع `whileInView` fade-up + stagger 0.08 على الشبكات

## ما لن يتغير
- المنطق، الـ queries، الـ RLS، الـ routes، الـ SEO meta، الـ Header/Footer، الـ wizard، الـ admin، الـ auth.
- نصوص الصفحات وترتيب الأقسام يبقى كما هو، فقط الـ layout والـ visual layer.

## التحقق
- زيارة `/destinations`, `/country/AE`, `/country/SCHENGEN`, `/visa-services`, وأي `/visa/:id` بعد التنفيذ والتأكد من RTL سليم وعدم وجود console errors.

## الخطوة التالية بعد الموافقة
بعد اعتمادك للخطة، أنفذ هذه المجموعة بالكامل ثم نعود لاختيار المجموعة الثانية (Apply Wizard / حساب العميل / الصفحات الثابتة).