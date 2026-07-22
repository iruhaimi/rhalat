## الهدف
إيقاف أي تحويل داخل تطبيق iPhone إلى صفحة Lovable أو أي نطاق Lovable، والتأكد أن التطبيق يفتح ملفات المشروع المحلية باسم وهوية "عطلات رحلاتكم" فقط.

## ما تم التحقق منه الآن
- ملف `capacitor.config.ts` الحالي لا يحتوي على `server.url` ولا رابط `lovableproject`.
- البحث في الكود أظهر أن الرابط المتبقي المهم موجود داخل `index.html` كسكربت تحويل من بعض نطاقات `lovable.app` إلى `visafaster.com`، وليس داخل إعداد Capacitor الحالي.
- إذا كان تطبيق iPhone ما زال يفتح صفحة Lovable، فالاحتمال الأكبر أن Xcode/مجلد iOS المحلي عندك ما زال يستخدم build أو ملف native قديم تم إنشاؤه قبل حذف `server.url`، أو أنك تفتح مشروع iOS قديم وليس المشروع النظيف الحالي.

## خطة الإصلاح

### 1. تنظيف الكود من أي تحويل متعلق بـ Lovable
- إزالة سكربت التحويل الموجود في `index.html` الذي يتحقق من نطاقات `lovable.app`.
- الإبقاء على روابط الإنتاج الرسمية فقط: `visafaster.com` واسم العلامة "عطلات رحلاتكم".
- عدم لمس مكتبة المصادقة `@lovable.dev/cloud-auth-js` لأنها مستخدمة للمصادقة في الويب وليست سبب ظهور صفحة Lovable داخل التطبيق.

### 2. تثبيت إعداد Capacitor للإنتاج فقط
- التأكد أن `capacitor.config.ts` يحتوي فقط على:
  - `appId: 'com.visafaster.app'`
  - `appName: 'عطلات رحلاتكم'`
  - `webDir: 'dist'`
- عدم وجود أي `server.url` نهائياً، لأن هذا هو الإعداد الذي يجعل التطبيق يفتح رابط خارجي بدل ملفات `dist`.

### 3. إضافة فحص يمنع رجوع الخطأ
- إضافة سكربت فحص بسيط قبل مزامنة iOS يمنع وجود:
  - `server.url`
  - `lovableproject.com`
  - `forceHideBadge`
  - `app.lovable...`
- الهدف: لو رجع أي إعداد Lovable بالغلط مستقبلاً، يظهر الخطأ قبل بناء التطبيق بدل ما تكتشفه بعد فتحه على iPhone.

### 4. إعطاؤك أوامر تنظيف محلية نهائية على الماك
بعد التعديل سأعطيك أوامر واضحة تمسح نسخة iOS القديمة وتعيد إنشاءها من الصفر، مثل:

```bash
cd ~/Documents/visa-hub-cloud
git pull
rm -rf ios
npm install
npm run build
npx cap add ios
npx cap sync ios
npx cap open ios
```

ثم داخل Xcode:
- التأكد من Bundle Identifier: `com.visafaster.app`
- Bundle display name: `عطلات رحلاتكم`
- إضافة Sign in with Apple
- Clean Build Folder ثم تشغيل التطبيق

### 5. التحقق النهائي
- عند فتح التطبيق لا يظهر أي شعار أو صفحة أو شريط Lovable.
- لا يوجد تحويل إلى `lovable.dev` أو `lovableproject.com`.
- التطبيق يبدأ من واجهة "عطلات رحلاتكم" المحلية.
- الشعار والاسم والأيقونة تكون للعلامة الحالية فقط.