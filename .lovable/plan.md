
# المرحلة 4: تدقيق الأداء وتحسين Lighthouse

تنفيذ التحسينات النهائية لرفع أداء الموقع، السرعة، و SEO.

## 1. Code-Splitting الموسّع في `src/App.tsx`
- تحويل جميع صفحات `/admin/*`, `/agent/*`, `/tourism-portal/*` إلى `React.lazy()`.
- لف الـ Routes بـ `<Suspense fallback={<LoadingSpinner />} />`.
- إبقاء الصفحات العامة الحرجة (Home, Auth) محمّلة مباشرة.
- النتيجة المتوقعة: تقليل bundle الأولي بنسبة 40-60%.

## 2. تحسين صور LCP في `index.html`
- إضافة `<link rel="preload" as="image" fetchpriority="high">` لصورة Hero الرئيسية.
- إضافة `<link rel="dns-prefetch">` و `<link rel="preconnect">` لـ Supabase و Google Fonts.

## 3. تحويل الصور إلى WebP
- تركيب `vite-imagetools`.
- تحديث `vite.config.ts` لتفعيل الـ plugin.
- تحويل صور الـ Hero والأعلام الكبيرة في `src/assets/` إلى WebP عبر استيراد `?format=webp&w=...`.

## 4. تحسين تحميل الخطوط
- التأكد من `display=swap` في روابط Google Fonts.
- تقليل أوزان الخطوط المحمّلة (إبقاء الأوزان المستخدمة فعلياً فقط).

## 5. تأجيل السكربتات الخارجية
- إضافة `defer` لأي `<script>` خارجي في `index.html` (مثل Despia, analytics).

## 6. تشغيل SEO Scan
- استدعاء `seo_chat--trigger_scan` لمراجعة شاملة.
- معالجة جميع الـ findings عبر `update_findings` بعد الإصلاح.

## 7. تشغيل Performance Profile
- استخدام `browser--performance_profile` على `/` وصفحة `/country/SCHENGEN`.
- توثيق Web Vitals (LCP, CLS, INP) قبل وبعد.

## تفاصيل تقنية
- لا تغييرات في business logic أو DB أو edge functions.
- جميع التغييرات في: `src/App.tsx`, `index.html`, `vite.config.ts`, `package.json`.
- إضافة حزمة واحدة: `vite-imagetools`.
- الهدف: Lighthouse Performance ≥ 90, SEO = 100, Accessibility ≥ 90.

## تقرير نهائي
بعد التنفيذ، تقرير مختصر بـ:
- حجم bundle قبل/بعد
- نتائج Web Vitals
- عدد الـ SEO findings المُصلحة
