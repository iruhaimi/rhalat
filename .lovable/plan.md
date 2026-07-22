## المشكلة
- شعار الموقع الحالي: `logo-new.png` (مرفوع على CDN، مستخدم في `src/assets/logo.png.asset.json`)
- أيقونة التطبيق الحالية `public/app-icon-1024.png` **مختلفة** عن شعار الموقع
- عند اختبار التطبيق على iOS الأيقونة لم تظهر أصلاً — السبب الأغلب: **لم يتم رفع الأيقونة داخل `Assets.xcassets/AppIcon` في Xcode**. الملف الموجود في `public/` هو للـ PWA فقط ولا يُقرأ من Capacitor iOS.

## خطة العمل

### 1. توليد أيقونة موحّدة من شعار الموقع
- تنزيل الشعار الرسمي من CDN (`logo-new.png`)
- توليد أيقونة iOS مربعة 1024×1024 بخلفية بيضاء صلبة (iOS يرفض PNG بشفافية للـ AppStore)
- حفظها في `public/app-icon-1024.png` (استبدال القديمة)
- توليد `apple-touch-icon.png` (180×180) و `favicon-32.png` من نفس الشعار

### 2. تحديث ملفات المشروع
- `public/app-icon-1024.png` → الجديدة (شعار الموقع بخلفية بيضاء)
- `public/apple-touch-icon.png` → 180×180
- `public/favicon-32.png` → 32×32
- `public/favicon.ico` → تحديث
- التأكد من `index.html` أنه يشير للأيقونات الصحيحة

### 3. تعليمات ما يجب على المستخدم فعله في Xcode (خارج نطاق الكود)
لأن الأيقونة **لا تظهر داخل التطبيق** حتى لو غيّرناها في `public/`، يجب:

1. `git pull` بعد تنفيذي للتغييرات
2. فتح Xcode → في المتصفح الأيسر: `App/App/Assets.xcassets/AppIcon`
3. سحب `public/app-icon-1024.png` إلى خانة **App Store iOS 1024pt**
4. Xcode 15+ سيولّد باقي الأحجام تلقائياً (أو استخدام موقع مثل appicon.co لتوليد جميع الأحجام دفعة واحدة)
5. زيادة Build Number في General tab
6. `Product → Clean Build Folder` ثم `Archive` مجدداً

## ملاحظات تقنية
- أيقونات iOS **لا تدعم الشفافية** — يجب أن تكون الخلفية صلبة
- الأيقونة في `capacitor.config.ts` لا تتحكم بأيقونة iOS، فقط `Assets.xcassets` يتحكم
- بدون هذه الخطوة اليدوية في Xcode، لن يظهر الشعار مهما عدّلنا الكود