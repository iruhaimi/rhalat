## الاتجاه المختار

نفّذ **Bento Minimalist** (v1) — الأكثر توافقاً مع اختياراتك (Bento Grid + لوحة أزرق نقي/كريمي + Bold Statement typography) والأنسب للموقع الإنتاجي. (تخطّيت السؤال فاخترتُ بدلاً منك).

## نطاق العمل

إعادة تصميم كاملة لكل أقسام `HomeArabic.tsx` مع الحفاظ على:
- جميع البيانات الديناميكية من Supabase (countries, visa_types, hero_destinations, hero_settings, special_offers, testimonials, FAQs)
- جميع المسارات والـ CTAs الحالية (`/destinations`, `/apply`, `/track-application`, إلخ)
- الـ CMS الخلفي (لا تغييرات في schema، فقط استهلاك)
- RTL Arabic primary + LTR fallback
- جميع الـ realtime/loading states

## الأقسام المعاد تصميمها

1. **HeroSection (bento)** — شبكة 12-col:
   - بطاقة كبيرة (col-8): عنوان ضخم بـ Syne/Cairo Black + بحث + CTA رئيسي
   - بطاقة navy (col-4): "5 أيام" بحجم 7xl + تكدّس avatars + "+10k عميل"
   - 3 بطاقات داعمة: 98% نجاح، صورة وجهة مميزة، +50 دولة

2. **CountriesSection** — شبكة 4-up بطاقات مرتفعة الزوايا (rounded-[2rem])، صورة + شارة قارة + سعر "تبدأ من" + أيقونة

3. **HowItWorksSection** — 3 خطوات بأرقام ضخمة 01/02/03 بـ Syne على خلفية كريمي (#e8ecf1)

4. **StatsSection** — شريط navy داكن بـ 4 إحصائيات بأرقام Syne ضخمة وفواصل عمودية

5. **TestimonialsSection** — بطاقتان كبيرتان مع نجوم تقييم + علامة اقتباس خلفية شفافة

6. **PartnersSection** — شبكة شعارات بسيطة على خلفية كريمي

7. **FAQSection** — accordion نظيف بحدود رفيعة

8. **CTASection** — بطاقة زرقاء كبيرة (rounded-[3.5rem]) مع زرّين متباينين وهالات blur

9. **OffersSection** (إن وُجد): يتكامل بنفس النمط البطاقي

## تفاصيل تقنية

- **الخطوط**: إضافة `<link>` لـ Syne + Plus Jakarta Sans في `index.html` (Cairo/Tajawal موجود مسبقاً). Syne للأرقام الكبيرة فقط، Cairo للعناوين العربية، Tajawal للنصوص.
- **الألوان**: تحديث tokens في `src/index.css` + `tailwind.config.ts`:
  - `--background: 210 17% 98%` (#fafbfc)
  - `--muted: 215 20% 92%` (#e8ecf1)
  - `--primary: 217 91% 60%` (#3b82f6)
  - `--secondary/navy: 215 51% 25%` (#1e3a5f)
  - كل الألوان HSL، لا hex مباشر في components
- **الـ Header الحالي** (`HeaderArabic`) يبقى — فقط تأكد من توافق ألوانه مع الـ palette الجديد
- **Animations**: framer-motion للـ fade-up على scroll، عدّاد متحرك للأرقام (counters)، hover lift على بطاقات Bento
- **Responsive**: bento ينهار إلى single-column على mobile (md:col-span-X → col-span-12)
- **الصور**: نواصل استخدام `hero_destinations.image_url` من DB. صور البطاقات الكبيرة الجديدة (London/Paris/Tokyo) نستخدم flagcdn الحالي أو unsplash CDN ضمن الـ destinations data.
- **Lazy loading**: الأقسام تحت الـ fold تبقى lazy عبر `React.lazy` كما هي.

## ملفات ستُعدَّل

- `src/index.css` — tokens
- `tailwind.config.ts` — font families + colors
- `index.html` — `<link>` للخطوط
- `src/components/home/HeroSection.tsx` — كتابة كاملة جديدة
- `src/components/home/CountriesSection.tsx` — إعادة تصميم البطاقات
- `src/components/home/HowItWorksSection.tsx` — إعادة كاملة
- `src/components/home/StatsSection.tsx` — شريط navy
- `src/components/home/TestimonialsSection.tsx` — بطاقات جديدة
- `src/components/home/PartnersSection.tsx` — شبكة شعارات
- `src/components/home/FAQSection.tsx` — accordion جديد
- `src/components/home/CTASection.tsx` — بطاقة زرقاء كبيرة
- `src/components/home/FeaturesSection.tsx` — اختياري: يندمج مع HowItWorks
- `src/pages/HomeArabic.tsx` — تأكد من الترتيب

## ما **لن** يتغيّر

- لا تغييرات في DB schema / RLS / edge functions
- لا تغييرات في الـ Header/Footer/FloatingWhatsApp/CookieConsent
- لا تغييرات في `/admin`, `/agent`, أو منطق الـ auth
- لا تغييرات في wizard التقديم
