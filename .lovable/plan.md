## الوضع الحالي (بعد الفحص)

مجلد `public/images/` صار **فاضي فعلاً** (الصور القديمة انحذفت سابقاً)، لكن الملفات اللي تظهر داخل Xcode مصدرها ثلاثة:

1. **`public/pwa-192x192.png` و `pwa-512x512.png`** — أيقونات PWA قديمة بشعار "Rhalat" (اسم قديم مخالف للهوية الحالية "عطلات رحلاتكم").
2. **`public/placeholder.svg`** — مستخدم فعلياً كـ fallback في `SortableDestinationRow.tsx` و `HeroManagement.tsx` (لوحة الإدارة). ضروري.
3. **`sw.js`, `registerSW.js`, `workbox-*.js`, `manifest.webmanifest`** — يولّدها `vite-plugin-pwa` تلقائياً في `dist/` أثناء البناء، ثم Capacitor ينسخ `dist/` كامل داخل iOS. **حذفها من `public/` ما ينفع** لأنها تُنشأ في كل build. وهي مطلوبة لعمل الموقع كتطبيق ويب قابل للتثبيت من المتصفح (ميزة معتمدة في المشروع).
4. **`favicon.ico`, `favicon-32.png`, `apple-touch-icon.png`, `app-icon-1024.png`, `robots.txt`, `llms.txt`, `sitemap.xml`** — كلها ضرورية للموقع.

بالإضافة، ملف `vite.config.ts` فيه هوية PWA قديمة:
- `name: 'رحلات - خدمات التأشيرات'` و `short_name: 'رحلات'` ← مخالف لسياسة العلامة.
- `index.html` (سطر 120) يشير إلى `pwa-512x512.png` كشعار الشركة في JSON-LD.

## الخطة

### 1. استبدال أيقونات PWA القديمة بالهوية الجديدة
- توليد أيقونتين جديدتين بشعار "عطلات رحلاتكم" (نفس ستايل `app-icon-1024.png` الحالي) بمقاسي 192×192 و 512×512.
- حذف `public/pwa-192x192.png` و `public/pwa-512x512.png` القديمتين واستبدالهما بالجديدتين بنفس الاسم (حتى ما تحتاج تعديل مراجع).

### 2. تصحيح هوية PWA في `vite.config.ts`
- `name` → `'عطلات رحلاتكم - خدمات التأشيرات'`
- `short_name` → `'عطلات رحلاتكم'`
- `description` → وصف بالهوية الجديدة.
- الألوان والاتجاه تبقى كما هي.

### 3. تنظيف JSON-LD في `index.html`
- تحديث `"logo"` في السطر 120 ليشير إلى الأيقونة الجديدة (نفس الرابط `pwa-512x512.png` بعد استبدال الملف تلقائياً يصير صحيح، لكن نتأكد من صحة الاسم واللينك المطلق).

### 4. ما لن يتغير (ومبرراته)
- **`sw.js` / `workbox-*` / `registerSW.js` / `manifest.webmanifest`**: تُنشأ عند البناء وضرورية لتثبيت الموقع كـ PWA من المتصفح. حذفها من `public/` بلا فايدة، وحذف `vite-plugin-pwa` كلياً يعطّل ميزة PWA للويب (مذكورة في `mem://technical/mobile/pwa-implementation`).
- **`placeholder.svg`**: مستخدم كصورة احتياطية في مكونات الإدارة، حذفه يكسر الواجهة.
- **`cordova.js` / `cordova_plugins.js`**: يولّدها Capacitor نفسه، ضرورية لتشغيل التطبيق الأصلي.

### 5. بعد التطبيق (خطوات محلية على الماك)
```bash
cd ~/Documents/visa-hub-cloud
git pull
npm run build
npx cap sync ios
```
ثم داخل Xcode: Product → Clean Build Folder → Run. أيقونة `pwa-192x192` اللي كانت تظهر بشعار "Rhalat" بتصير بشعار "عطلات رحلاتكم" الجديد.

## ملاحظة مهمة
أيقونة تطبيق iOS الفعلية (اللي تظهر على شاشة الآيفون الرئيسية) **مختلفة** وتوجد في `ios/App/App/Assets.xcassets/AppIcon.appiconset/` — سبق ووضعتها يدوياً من `app-icon-1024.png`. هذي الخطة ما تمسّها، تعالج فقط الأيقونات اللي تظهر داخل bundle الويب.
