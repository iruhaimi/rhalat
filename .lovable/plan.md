## الهدف
تطبيق متطلبات Google على صفحة الشروط والأحكام (`/terms`) لضمان ظهور إخلاء المسؤولية "Above the fold" بنص بارز ولون متباين، مع إعداد البنية التحتية الفنية لـ Consent Mode v2.

## التغييرات

### 1. صفحة الشروط `src/pages/Terms.tsx` — إبراز إخلاء المسؤولية
- إضافة **بانر إخلاء مسؤولية بارز فوق الـ Hero مباشرةً** (Above the fold) بخلفية صفراء/كهرمانية متباينة (`bg-amber-50 border-amber-500`) وأيقونة تحذير وخط عريض، يحتوي على:
  - "نحن وكالة سفر خاصة مرخّصة، لسنا جهة حكومية ولا تابعين لأي سفارة."
  - "الرسوم المدفوعة لنا هي رسوم خدمة، إضافة إلى رسوم التأشيرة الحكومية."
  - "يمكنك الحصول على التأشيرة مباشرة من المواقع الرسمية بتكلفة أقل."
  - رابط `/official-embassies`.
- تكبير حجم الخط (`text-base md:text-lg`) لضمان الوضوح حسب اشتراطات Google.
- يدعم RTL/LTR ويستخدم القيم من `src/config/legal.ts`.
- إصلاح أرقام التواصل والإيميل القديمة (`info@rhalat.com` → `info@visafaster.com`) وتحديث "آخر تحديث" إلى يونيو 2026.
- إضافة قسم جديد "الإفصاح التنظيمي" يكرّر الترخيص + السجل + VAT بشكل ظاهر داخل النص.

### 2. Consent Mode v2 — `index.html`
- إضافة سكربت Google Consent Mode v2 **قبل أي وسم gtag/Analytics/Ads** يضبط الحالة الافتراضية إلى `denied` لـ:
  - `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`
  - مع `wait_for_update: 500`.
- ربط المكوّن الحالي `CookieConsent.tsx` لاستدعاء `gtag('consent','update', {...})` عند قبول/رفض المستخدم (تحديث granted/denied حسب الاختيار).

### 3. ملاحظة
- لن أغيّر أي منطق أعمال أو RLS — فقط واجهة صفحة `/terms`، `index.html`، ومكوّن `CookieConsent` لربطه بـ Consent Mode v2.
- لا تغييرات على `legal.ts` (الأرقام مؤكدة من ZATCA سابقاً عدا CR الذي ينتظر تأكيدك في رسالة سابقة — لن أمسّه هنا).

## التفاصيل التقنية
- البانر الجديد: مكوّن inline داخل `Terms.tsx` (لا حاجة لمكوّن منفصل، خاص بهذه الصفحة).
- ستايل: `bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-500 text-amber-950 dark:text-amber-100 font-medium`.
- Consent Mode: سكربت inline في `<head>` قبل أي tag manager:
  ```js
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500});
  ```
- `CookieConsent.tsx`: عند Accept → `gtag('consent','update',{...:'granted'})`، عند Reject → يبقى denied.
