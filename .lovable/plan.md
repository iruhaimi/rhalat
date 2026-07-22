## سبب المشكلة

في الصورة، شاشة الـ Splash تعرض الشعار **مقصوص من الجانبين** (يظهر "طلات رحلاتك" بدل "عطلات رحلاتكم" كاملاً).

السبب: `LaunchScreen.storyboard` في Xcode يستخدم `UIImageView` بوضع `Content Mode = Scale To Fill` أو `Aspect Fill` مع صورة splash عريضة/غير مربعة، فيتمدد الشعار ويُقصّ على شاشات iPhone الطويلة.

هذا ملف **iOS Native** (خارج كود الويب) — لا يمكنني تعديله من هنا، لكن الحل يدوي بسيط في Xcode.

## الحل في Xcode (يدوي — دقيقتان)

### الخيار 1 (الأسرع — موصى به): استخدم أيقونة التطبيق نفسها كصورة Splash

1. في Xcode → `App/App/Assets.xcassets` → كليك يمين → **New Image Set** → سمّه `SplashLogo`
2. اسحب `public/app-icon-1024.png` (نفس أيقونة التطبيق) إلى خانة `1x` أو `2x`
3. افتح `LaunchScreen.storyboard` → اختر الـ `Splash` ImageView في الجانب الأيسر
4. في الـ Attributes Inspector (يمين):
   - **Image**: غيّرها إلى `SplashLogo`
   - **Content Mode**: غيّرها إلى **`Aspect Fit`** (بدل Scale To Fill)
5. في Size Inspector → تأكد أن الـ Constraints:
   - Width & Height: **250pt** (ثابتة، ليس Fill Superview)
   - Center X & Center Y in Superview
6. الخلفية: اختر الـ View الرئيسي (الأزرق الفاتح) → غيّر Background إلى **White** لمطابقة الأيقونة

### الخيار 2: استبدل صورة الـ Splash الحالية
لو تفضّل الإبقاء على تصميم الـ Splash الحالي، افتح `Assets.xcassets` → ابحث عن `Splash` Image Set → استبدل الصور الثلاث (1x/2x/3x) بأيقونات مربعة من `public/app-icon-1024.png` بأحجام 250/500/750 px.

## بعد التعديل

1. `Product → Clean Build Folder` (Cmd+Shift+K)
2. زوّد Build Number
3. Archive → Upload

## ما لن أفعله (لأنه خارج نطاق كود الويب)

- تعديل `ios/App/App/Base.lproj/LaunchScreen.storyboard` — هذا ملف Xcode native، والمشروع لا يحتوي مجلد `ios/` مُتتبَّع (يُولَّد عند `npx cap add ios` على جهازك).
- أي تغيير في الكود لن يؤثر على شاشة الـ Splash — هي مضبوطة 100% من Storyboard.
