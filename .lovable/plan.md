## المشكلة

الشاشة التي ظهرت لك (شعار Lovable + Log in + شريط `lovable.dev` بالأسفل) ليست شاشة تطبيقك — هي موقع Lovable نفسه فُتح داخل التطبيق. السبب في `capacitor.config.ts`:

```ts
server: {
  url: 'https://616b2e7f-...lovableproject.com?forceHideBadge=true',
  cleartext: true
}
```

هذا الحقل يُستخدم فقط أثناء التطوير (hot-reload من sandbox). وجوده في build الإنتاج يجعل التطبيق يحمّل موقع Lovable بدل ملفاتك من `dist/`. لذلك لا يظهر تصميمك ولا الشعار الخاص بك، ويظهر شعار Lovable وصفحة دخوله.

## الخطة

### 1. تعديل `capacitor.config.ts`
- حذف كتلة `server` بالكامل، حتى يفتح التطبيق ملفات `dist/` المضمّنة محلياً.
- الإبقاء على `appId` و`appName` وإعدادات iOS/Android كما هي.

النتيجة النهائية:

```ts
const config: CapacitorConfig = {
  appId: 'com.visafaster.app',
  appName: 'عطلات رحلاتكم',
  webDir: 'dist',
  ios: { contentInset: 'automatic', preferredContentMode: 'mobile' },
  android: { allowMixedContent: true }
};
```

### 2. الخطوات التي ستنفذها على جهاز الماك بعد التعديل

```bash
cd ~/Documents/visa-hub-cloud
git pull
npm install
npm run build
npx cap sync ios
npx cap open ios
```

ثم في Xcode: **Product → Clean Build Folder** (Shift+Cmd+K)، ثم شغّل التطبيق ▶︎.

### 3. التحقّق بعد التشغيل
- شاشة البداية تعرض شعار "عطلات رحلاتكم"، وليس شعار Lovable.
- لا يوجد شريط `lovable.dev` بالأسفل.
- الواجهة عربية RTL بتصميم موقعك.
- تسجيل الدخول عبر Apple يعمل من داخل التطبيق.

## ملاحظة مهمة

بعد هذا التعديل، التطبيق على الأجهزة **لن يتحدّث تلقائياً** عند كل تغيير في Lovable. لتحديث التطبيق على iPhone بعد أي تعديل مستقبلي، لازم كل مرة:
`git pull` ← `npm run build` ← `npx cap sync ios` ← إعادة البناء في Xcode.

هذا هو السلوك الطبيعي والصحيح لتطبيق إنتاجي يُرفع على App Store.
