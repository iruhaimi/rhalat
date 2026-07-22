## ما تحققت منه الآن في الكود (بدون تعديل)

- `capacitor.config.ts`: نظيف — `appId: com.visafaster.app`, `appName: عطلات رحلاتكم`, **لا يوجد `server.url`**.
- `index.html`: لا يحتوي أي إشارة إلى `lovable` أو أي `redirect` أو `server`.
- `src/main.tsx`: يستدعي `enforceNativeUrlSafety()` قبل تركيب React، وهذا يمنع أي URL يحتوي `lovable.*` من الاستمرار داخل التطبيق.
- `src/`: لا توجد أي مرجعية لـ `lovable.dev` / `lovable.app` / `lovableproject.com` (فقط داخل قائمة الحماية في `nativeSafety.ts` والحارس، وهذا مطلوب).
- `vite.config.ts`: خالٍ من `vite-plugin-pwa` / `VitePWA` / أي service worker.
- `package.json`: لا يحتوي `vite-plugin-pwa` ولا `@lovable.dev/cloud-auth-js`.
- `public/`: لا يوجد `index.html` بديل ولا manifest لـ PWA. يوجد `sw.js` وهو **kill-switch فقط** (لا يُسجَّل من أي مكان في الكود، ووظيفته حذف الكاش القديم عند التفعيل من متصفح قديم).
- `scripts/guard-mobile-build.mjs`: يمنع أي إشارة `lovable*` أو PWA من الدخول للبناء ويعمل تلقائياً قبل `vite build` عبر `prebuild`.

**النتيجة:** المستودع نفسه نظيف تماماً. اللقطة التي أرسلتها تُظهر أن التطبيق فتح صفحة `lovable.dev` داخل WebView. بما أن الكود المصدري خالٍ من أي رابط أو تحويل لهذا الموقع، فالمصدر الوحيد الممكن هو **مجلد `ios/` قديم مبني قبل الإصلاح**: ملف `ios/App/App/capacitor.config.json` أو محتوى `ios/App/App/public/` المُبيَّت داخل التطبيق ما زال يحمل `server.url` القديم الذي يشير إلى Lovable.

## الخطة

### 1. تقوية Capacitor config كطبقة أمان إضافية
- إضافة `server.androidScheme` و `server.iosScheme` صريحين (`https`) في `capacitor.config.ts` مع تعليق يمنع أي `server.url`.
- تحديث `scripts/guard-mobile-build.mjs` ليفشل البناء صراحةً إذا احتوى `capacitor.config.ts` على أي مفتاح `server.url` أو `hostname` أو `allowNavigation` يشير لأصل خارجي.
- إضافة قائمة `server.allowNavigation` فارغة/محصورة على الدومين الرسمي فقط عند الحاجة، ومنع أي أصل غير `visafaster.com` من التنقل داخل WebView.

### 2. تقوية `nativeSafety` ليقفل WebView على أصل التطبيق فقط
- توسيع `enforceNativeUrlSafety` بحيث:
  - يعمل مبكراً جداً (قبل React) — يقوم بذلك بالفعل، سنُبقي هذا.
  - يعترض أي `window.open` / `location.assign` / `location.href` يشير لأصل يحتوي `lovable*` أو أي أصل خارجي غير مسموح، ويستبدله بـ `/`.
  - يُلغي تسجيل أي Service Worker قديم — موجود، سنُبقيه.
- الهدف: حتى لو بقي ملف قديم داخل نسخة التطبيق على جهاز أحد المستخدمين، أول جافاسكربت يعمل يمنع التحويل.

### 3. حذف `public/sw.js` من نسخة التطبيق
- سيبقى فقط لمتصفح الويب حتى ينظف نفسه. للتطبيق native، سنستثنيه من `webDir` عبر خطوة post-build صغيرة في `scripts/guard-mobile-build.mjs` تحذفه من `dist/` بعد البناء إذا كانت البيئة native.
- بديل أبسط وأكيد: نحذفه نهائياً الآن — لم يعد ضرورياً لأنه لا PWA أصلاً في المشروع.

### 4. إضافة سكربت تنظيف ذري وأتمتة إعادة البناء
إضافة `scripts/rebuild-ios.sh` يقوم تلقائياً بـ:
```bash
rm -rf ios dist node_modules/.vite
npm ci
npm run build
# فحص إثبات النظافة قبل ما نلمس Xcode
grep -R -i "lovable\|server\.url\|forceHideBadge" dist && exit 1
npx cap add ios
npx cap sync ios
# فحص ثانٍ داخل مجلد iOS المُوَلَّد
grep -R -i "lovable\|lovableproject" ios/App/App/capacitor.config.json ios/App/App/public && exit 1
echo "iOS clean. Open ios/App/App.xcworkspace"
```
هذا يضمن أنه لا يمكنك أن تفتح Xcode إلا بعد أن يثبت السكربت أن الحزمة نظيفة.

### 5. اختبار قبل التسليم
سأقوم قبل تسليمك بـ:
- تشغيل `npm run build` والتأكد أن حارس الجوال يمر.
- تشغيل بحث نصي على `dist/` بعد البناء للتأكد من خلوه من أي `lovable.*` أو `forceHideBadge` أو `server.url`.
- إخراج نتيجة الفحص كاملة في الرد النهائي حتى تراها بعينك قبل ما تعيد البناء.

### 6. خطواتك على جهازك بعد التنفيذ
```bash
cd ~/Documents/visa-hub-cloud
git pull
bash scripts/rebuild-ios.sh
npx cap open ios
```
ثم في Xcode:
- احذف التطبيق نهائياً من المحاكي/الجهاز (long-press → Remove App → Delete App).
- Product → Clean Build Folder.
- شغّل التطبيق.

## ما لن ألمسه
- لا تصميم، لا لوحة تحكم، لا قاعدة بيانات، لا edge functions، لا مسارات موقع الويب.
- فقط: إعدادات Capacitor + حارس البناء + `nativeSafety` + سكربت إعادة بناء iOS + حذف `public/sw.js`.

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>