
# خطة تسريع الموقع

العميل يشعر بالبطء عند فتح الموقع والتنقل بين الصفحات. الخطة تركز على تقليل وقت أول رسم للصفحة وتسريع التنقل دون تغيير أي وظيفة أو تصميم.

## التحسينات

### 1. تحسين React Query (Cache عالمي)
حالياً `QueryClient` بدون إعدادات، فكل تنقل يعيد جلب نفس البيانات.
- إضافة `defaultOptions`: `staleTime: 5 دقائق`، `gcTime: 30 دقيقة`، `refetchOnWindowFocus: false`، `retry: 1`.
- النتيجة: الصفحة الرئيسية والقوائم تُفتح فوراً عند العودة إليها.

### 2. نقل جلب البيانات في الرئيسية إلى React Query
`HomeArabic.tsx` يستخدم `useEffect + useState` لجلب الدول وأنواع التأشيرات في كل زيارة.
- استبدالها بـ `useQuery` مع نفس `staleTime` لتشاركها مع باقي الصفحات (Destinations, Pricing).
- النتيجة: بعد أول زيارة، التنقل بين الصفحات لا يطلب نفس البيانات مرة ثانية.

### 3. تأجيل الأقسام أسفل الصفحة (Below-the-fold)
الرئيسية تُحمّل 9 أقسام دفعة واحدة. سنُبقي `Hero` و `Countries` فقط في الـ bundle الأولي، ونلفّ بقية الأقسام (HowItWorks, Features, Stats, Partners, Testimonials, FAQ, CTA) بـ `React.lazy` + `Suspense` خفيف.
- النتيجة: bundle أولي أصغر = أول رسم أسرع.

### 4. Preload للصورة الرئيسية (LCP)
إضافة `<link rel="preload" as="image">` للصورة الأولى في قسم Hero عند توفرها من قاعدة البيانات، وإزالة `loading="lazy"` عن صورة Hero الرئيسية فقط (lazy على الـ LCP يضرّ السرعة المُدركة).

### 5. Code-splitting لمكتبات ثقيلة في الـ Admin
المكتبات الثقيلة (`exceljs`, `jspdf`, `jspdf-autotable`, `jszip`, `@uiw/react-md-editor`, `recharts`) تُستخدم فقط في صفحات الإدارة. التأكد من أنها مستوردة عبر `import()` ديناميكي داخل الـ handlers (مثل زر التصدير) بدل الاستيراد العادي.
- النتيجة: المستخدم العادي لا يُحمّل ميجابايتات من JS لا يحتاجها.

### 6. تحسين الصور
- إضافة `width`/`height` على صور Countries و Hero لمنع Layout Shift.
- استخدام `fetchpriority="high"` للصورة الأولى و `loading="lazy"` للباقي (موجود جزئياً).

### 7. تقليل عمل AuthContext على أول رسم
`fetchProfile` يُشغّل استعلامين متتاليين (profiles ثم user_roles).
- تحويلها إلى `Promise.all` لتعمل بالتوازي وتسريع تحميل الصفحات المحمية.

### تفاصيل تقنية
```text
src/App.tsx          → QueryClient defaults + lazy imports للأقسام السفلية
src/pages/HomeArabic.tsx     → useQuery بدل useEffect/useState
src/components/home/HeroSection.tsx → preload + fetchpriority للصورة المميزة
src/contexts/AuthContext.tsx → Promise.all للـ profile + roles
index.html           → dns-prefetch موجود، إضافة preload للخط الأساسي إن لزم
```

## ما لن يتغير
- لا تعديل على التصميم أو الألوان أو الترتيب البصري.
- لا تعديل على قاعدة البيانات أو الـ RLS.
- لا تغيير في الوظائف (تأشيرات، دفع، 2FA، إلخ).

## التحقق بعد التنفيذ
- إعادة تحميل الرئيسية والتنقل إلى /destinations ثم العودة → يجب ألا يحدث طلب شبكة مكرر.
- فحص bundle: تأكد أن صفحات الـ admin لم تعد ضمن initial chunk.
