## الهدف
إيقاف فتح نسخة iOS القديمة التي ما زالت تعرض Lovable، والتأكد أن جهازك المحلي يستلم سكربت التنظيف وأمر `ios:rebuild-clean` فعلياً قبل فتح Xcode.

## ما تم التحقق منه
- داخل المشروع الحالي هنا يوجد الأمر `ios:rebuild-clean` في `package.json`.
- ملف `scripts/rebuild-ios.sh` موجود هنا وقابل للتنفيذ.
- ظهور `Missing script` عندك يعني أن مجلد `~/Documents/visa-hub-cloud` على جهازك لا يحتوي آخر نسخة من هذه التغييرات، حتى لو ظهر `git pull` بأنه محدث.

## الخطة
1. **تثبيت مصدر الحقيقة**
   - التأكد أن الملفات الجديدة موجودة في المشروع الذي سيُرسل إلى GitHub/المزامنة:
     - `package.json` يحتوي `ios:rebuild-clean`
     - `scripts/rebuild-ios.sh` موجود
     - `scripts/guard-mobile-build.mjs` موجود

2. **إضافة بديل يدوي واضح للمستخدم**
   - تجهيز أمر واحد تنسخه وتشغله على جهازك إذا بقي GitHub لا يجلب الملف، ويقوم بإنشاء `scripts/rebuild-ios.sh` محلياً بنفس المحتوى الصحيح.
   - بعدها تشغل:
     ```bash
     npm run ios:rebuild-clean
     ```

3. **منع فتح Xcode قبل التنظيف**
   - التوجيه سيكون: لا تستخدم `npx cap open ios` إلا بعد أن ينتهي السكربت برسالة:
     ```bash
     SUCCESS ✅ — iOS bundle is clean.
     ```

4. **تأكيد نهائي قبل التشغيل**
   - بعد نجاح السكربت: حذف التطبيق القديم من الآيفون/المحاكي.
   - فتح Xcode ثم `Product → Clean Build Folder → Run`.

## النتيجة المتوقعة
بعد تنفيذ هذه الخطة، لن يعتمد iOS على مجلد قديم أو WebView قديم، وسيتم بناء التطبيق من `dist/` المحلي النظيف بدون أي `server.url` أو رابط Lovable.