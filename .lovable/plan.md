## المشكلة

1. **اسم التطبيق في Xcode يظهر "رحلات - خدمات التأشيرات"** بدلاً من "عطلات رحلاتكم" — لأن `CFBundleDisplayName` (Bundle display name) في `ios/App/App/Info.plist` مكتوب يدوياً بهذه القيمة، ولا يتحدّث تلقائياً عند `npx cap sync`.
2. **`appName` في `capacitor.config.ts`** حالياً `"visafaster"` — يجب أن يكون `"عطلات رحلاتكم"` ليكون مصدر الحقيقة لأي إعادة إنشاء مستقبلية.
3. **أيقونة التطبيق القديمة** لا تزال في `ios/App/App/Assets.xcassets/AppIcon.appiconset/` على جهازك — لأن Capacitor لا ينسخ الأيقونات تلقائياً من `public/app-icon-1024.png`؛ يجب استيرادها يدوياً في Xcode.
4. **صور داخل `public/images/`** (`destination-istanbul.jpg`, `london`, `newyork`, `paris`) — غير مستخدمة في أي مكان بالكود، لكن Google فَهرسها لأنها مكشوفة على الدومين.

## الخطة

### 1. تصحيح اسم التطبيق في المصدر
- تعديل `capacitor.config.ts`:
  - `appName: 'عطلات رحلاتكم'`

### 2. حذف الصور غير المستخدمة من `public/`
- حذف `public/images/destination-istanbul.jpg`
- حذف `public/images/destination-london.jpg`
- حذف `public/images/destination-newyork.jpg`
- حذف `public/images/destination-paris.jpg`
- إضافة `Disallow: /images/` في `public/robots.txt` (حماية إضافية لأي بقايا مؤقتة عند Google).

### 3. تعليمات يدوية على جهاز Mac (لا تُنفَّذ من هنا لأن مجلد `ios/` غير موجود في GitHub — يُنشأ محلياً)

بعد `git pull` ثم `npx cap sync ios`، افتح Xcode ونفّذ:

**أ. تصحيح اسم التطبيق المعروض**
- في الشريط الأيسر: `App → App → Info`
- عدّل `Bundle display name` من `رحلات - خدمات التأشيرات` إلى `عطلات رحلاتكم`
- عدّل `Bundle name` (إن وُجد كسلسلة نصية) إلى نفس القيمة

**ب. تصحيح اسم الـ Scheme الغريب**
- في الأعلى بجانب زر ▶︎ يظهر "سبحان الله وبحمده…" — هذا اسم Scheme.
- `Product → Scheme → Manage Schemes…` → اختر الـ Scheme → زر Edit → غيّر الاسم إلى `App` واحذف أي Scheme إضافي.

**ج. استبدال أيقونة التطبيق**
- في الشريط الأيسر: `App → App → Assets.xcassets → AppIcon`
- اسحب `public/app-icon-1024.png` (الأيقونة الرسمية الجديدة) إلى خانة **1024×1024 App Store**
- احذف أي صور قديمة في نفس الـ set
- `Product → Clean Build Folder` (Shift+Cmd+K) ثم أعد التشغيل

### تفاصيل تقنية

- سبب عدم تحديث الاسم تلقائياً: `npx cap sync` يحدّث `capacitor.config.json` داخل iOS، لكن `Info.plist` يبقى ملكاً للمشروع الأصلي ولا يُلمس بعد أول `cap add ios`.
- سبب عدم تحديث الأيقونة تلقائياً: Capacitor لا يدير `AppIcon.appiconset`؛ الحل الرسمي هو أداة `@capacitor/assets` (اختيارية، يمكن إضافتها لاحقاً لأتمتة الأيقونات وشاشة الإطلاق).
- إضافة `Disallow: /images/` في robots.txt يوقف زحف Google للمجلد؛ لإزالة الصور المفهرسة نهائياً استخدم Google Search Console → Removals.