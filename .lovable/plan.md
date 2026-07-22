## الهدف
إيقاف أي فتح أو تحويل إلى Lovable نهائياً داخل تطبيق iPhone/iPad/Android، والتأكد أن نسخة الجوال تعمل من ملفات التطبيق المحلية فقط باسم وهوية "عطلات رحلاتكم".

## ما تأكدت منه الآن
- `capacitor.config.ts` الحالي لا يحتوي على `server.url`، وهذا صحيح لنسخة متجر التطبيقات.
- `appId` الحالي هو `com.visafaster.app` وليس `app.lovable...`.
- ما زال المشروع يحتوي على إعداد PWA/service worker عبر `vite-plugin-pwa` في `vite.config.ts`.
- ما زالت بعض مسارات تسجيل الدخول الاجتماعي تستخدم `window.location.origin` أو `window.location.href`، وهذا خطر داخل تطبيق الجوال إذا كان الأصل أو جلسة قديمة تشير إلى رابط خارجي.
- الحارس الحالي يمنع بعض مراجع Lovable، لكنه لا يعزل كل مخاطر الجوال مثل Service Worker أو مسارات OAuth داخل التطبيق.

## الخطة بعد موافقتك

### 1. تعطيل PWA/service worker بالكامل الآن
- إزالة `vite-plugin-pwa` من `vite.config.ts` حتى لا يتم توليد service worker أو manifest runtime قديم.
- إزالة dependency غير الضروري من `package.json` إذا لم يعد مستخدماً.
- الهدف: منع أي كاش أو تشغيل قديم قد يعيد فتح روابط أو ملفات غير مرغوبة.

### 2. جعل تسجيل الدخول داخل تطبيق iOS/Android آمناً للجوال
- منع Google OAuth داخل التطبيق native نهائياً.
- إبقاء Apple داخل iOS عبر Apple native فقط.
- منع أي `window.location.assign(data.url)` داخل native app لأي مزود OAuth ويب.
- جعل روابط تأكيد البريد واستعادة كلمة المرور في native تستخدم دومين الموقع الرسمي فقط عند الحاجة، وليس origin من WebView.

### 3. إضافة طبقة حماية عند بدء التطبيق
- إضافة فحص مبكر في `src/main.tsx` أو ملف صغير مستقل:
  - إذا كان التطبيق يعمل داخل Capacitor/native وكان الرابط الحالي يحتوي `lovable.dev` أو `lovable.app` أو `lovableproject.com`، يتم استبداله فوراً بمسار `/` داخل التطبيق.
  - هذا ليس بديلاً عن الإصلاح، لكنه يمنع أي تسريب أو تحويل لو بقي أثر قديم عند المستخدم.

### 4. تقوية حارس البناء للجوال
- توسيع `scripts/guard-mobile-build.mjs` ليمنع:
  - أي Service Worker/PWA registration أو ناتج PWA غير مقصود في إعدادات البناء.
  - أي `server.url` في Capacitor.
  - أي مراجع Lovable في ملفات التطبيق أو إعداداته.
- إبقاء الاستثناءات فقط للوثائق/السكريبت نفسه حتى لا يمنع الفحص بسبب النصوص التوضيحية.

### 5. فحص الملفات العامة والصور غير التابعة للهوية
- حصر محتوى `public/` الذي يدخل تطبيق iOS تلقائياً.
- حذف أو استبعاد الصور القديمة غير التابعة للموقع من نسخة التطبيق.
- إبقاء الأيقونات والملفات الضرورية فقط.

### 6. التحقق قبل تسليمك خطوات Xcode
- تشغيل فحص نصي يؤكد عدم وجود مراجع Lovable في المسارات التي تدخل التطبيق.
- التأكد أن `capacitor.config.ts` خالٍ من `server.url`.
- التأكد أن build guard ينجح.

## خطواتك بعد تنفيذ الإصلاح
بعد موافقتك وتنفيذ التعديلات، ستكون الخطوات على جهازك كالتالي:

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
- افتح فقط `ios/App/App.xcworkspace`.
- احذف التطبيق القديم من الجهاز أو المحاكي.
- Product → Clean Build Folder.
- شغّل التطبيق من جديد.

## حدود الخطة
لن أضيف ميزات جديدة، ولن ألمس لوحة التحكم أو قاعدة البيانات أو التصميم العام. التركيز فقط على إيقاف Lovable داخل تطبيق الجوال وإزالة أسباب التحويل/الكاش القديمة.

<presentation-actions>
  <presentation-open-history>View History</presentation-open-history>
</presentation-actions>

<presentation-actions>
<presentation-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</presentation-link>
</presentation-actions>