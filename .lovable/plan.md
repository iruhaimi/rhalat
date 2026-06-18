## الهدف
جعل الموقع متوافقاً مع سياسات إعلانات جوجل لمزودي خدمات التأشيرات غير الحكوميين (2026)، عبر إضافة إخلاء مسؤولية واضح، شفافية الرسوم، تعديل أي وعود مطلقة، وتحسين تجربة الجوال.

## التغييرات

### 1) شريط إخلاء مسؤولية أعلى الصفحة الرئيسية
- إضافة Banner صغير قابل للإغلاق فوق `HeroSection` داخل `src/pages/HomeArabic.tsx` (و `src/pages/Home.tsx` للنسخة الإنجليزية).
- النص (AR): "Visafaster وكالة خاصة مستقلة تقدّم خدمات استشارية وتجهيز ملفات التأشيرات مقابل رسوم. لسنا جهة حكومية ولا تابعين لأي سفارة. يمكن التقديم مباشرة عبر الموقع الرسمي للسفارة بتكلفة أقل."
- النص (EN): الترجمة المطابقة.
- تصميم: شريط بلون `bg-muted` بنص صغير وأيقونة Info، يحتوي رابطاً لقسم "السفارات الرسمية" أسفل الصفحة.

### 2) قسم Footer جديد: "إخلاء مسؤولية ورسوم"
- في `src/components/layout/FooterArabic.tsx` (و `Footer.tsx`): إضافة بلوك مخصص ثابت (غير محرر من DB لضمان عدم حذفه) أعلى السطر السفلي، يحتوي:
  - الفقرة الكاملة لإخلاء المسؤولية (4 عناصر إلزامية).
  - جملة شفافية الرسوم: "الرسوم المدفوعة هي مقابل خدمة التنسيق والاستشارة وتجهيز الملف، وليست رسوم التأشيرة الحكومية الرسمية."
  - رابط عام: "روابط المواقع الرسمية للسفارات والوزارات" يفتح `/embassies` (صفحة جديدة) أو يربط بقسم في `/faq`.

### 3) صفحة جديدة `/official-embassies`
- ملف جديد `src/pages/OfficialEmbassies.tsx` يعرض جدول/قائمة بروابط المواقع الرسمية لكل دولة موجودة في جدول `countries` (حقل جديد اختياري `official_visa_url`، fallback نصي إن لم يوجد). 
- تسجيل المسار في `App.tsx`.
- ربط الصفحة من شريط الإخلاء ومن الـ Footer.

### 4) إزالة الوعود المطلقة
- مراجعة وتعديل العبارات في:
  - `HeroSection.tsx`: "بضمان كامل" → "بأعلى جودة ممكنة". "نسبة النجاح 98%" → "معدل نجاح مرتفع للملفات المؤهلة" (مع إبقاء الرقم كإحصائية تاريخية مع كلمة "حتى الآن").
  - `CTASection.tsx` وأي نص في `FeaturesSection.tsx`/`HowItWorksSection.tsx` يحتوي "ضمان"، "مضمون"، "100%": استبدالها بـ "نساعدك في تحسين جودة ملفك لزيادة فرص القبول".
- تعديل `hero_settings` defaults فقط داخل الكود (لا تغيير في DB حتى لا يتم الكتابة فوق القيم المخصصة من Owner).

### 5) تحسينات الجوال (Quality Score)
- في `src/index.css`: ضبط `html { font-size: 16px; }` كحد أدنى على الجوال (موجود غالباً — تأكد فقط).
- مراجعة `src/components/ui/button.tsx`: التأكد أن variant الافتراضي على الجوال >= 48×48 (إضافة `min-h-[48px] min-w-[48px]` على size `sm` و `default` على الجوال عبر utility class، أو زيادة `h-` في `default`).
- التأكد أن `FloatingWhatsApp` و `Popup`s ليست intrusive interstitials (لا تغطي المحتوى عند التحميل). 

### 6) `index.html` — تحديث meta description
- إضافة كلمة "وكالة خاصة مستقلة" بحيث يكون واضحاً للمراجع البشري في جوجل.

## خارج نطاق هذا التعديل (سأتركها للمستخدم/طلب لاحق)
- Consent Mode v2 / Cookie Banner: يتطلب اختيار مزوّد (Cookiebot / Google Consent Mode JS مباشرة) وإعداد GTM. الموقع لا يحتوي حالياً على GA4/GTM — أحتاج تأكيدك قبل التركيب.
- تحويل الصور لـ WebP عبر `vite-imagetools` (تحسين Core Web Vitals): تعديل بنية build مستقل.

## الملفات المعدلة
- `src/pages/HomeArabic.tsx`, `src/pages/Home.tsx` — إضافة Disclaimer Banner.
- `src/components/layout/FooterArabic.tsx`, `src/components/layout/Footer.tsx` — كتلة إخلاء المسؤولية الثابتة.
- `src/components/home/HeroSection.tsx`, `CTASection.tsx`, `FeaturesSection.tsx`, `HowItWorksSection.tsx` — استبدال كلمات الضمان.
- `src/pages/OfficialEmbassies.tsx` (جديد) + تسجيل في `src/App.tsx`.
- `src/components/ui/button.tsx` — حدّ أدنى 48px للنقر على الجوال.
- `index.html` — تحديث meta description.

## التحقق
- فتح `/` ومعاينة: يظهر الشريط أعلى الـ Hero، يظهر بلوك في الـ Footer.
- بحث `rg "ضمان|100%|مضمون|guaranteed"` يرجع نتائج "نظيفة" فقط (نسخ موافق عليها).
- اختبار `/official-embassies` يعرض القائمة.
- فحص الـ Build ينجح.

هل أمضي قدماً بهذا التنفيذ؟ وهل تريد أن أضيف Cookie Consent Banner + Google Consent Mode v2 الآن كجزء ثانٍ من العمل (أحتاج لمعرفة إن كنت تستخدم GTM أو GA4 مباشرة)؟
