سبب الخطأ واضح: نسخة المشروع عندك على الماك ما زالت تستخدم App ID القديم غير صالح:

```text
app.lovable.616b2e7f7e454cdc90ea1c048e4da3b0
```

بينما الإعداد الصحيح في المشروع الحالي هنا هو:

```text
com.visafaster.app
```

الخطة:

1. **تحديث ملف Capacitor في GitHub/المشروع**
   - التأكد أن `capacitor.config.ts` يحتوي على:
     - `appId: 'com.visafaster.app'`
     - اسم التطبيق الصحيح
     - رابط السيرفر الخاص بالتطبيق إن كان مطلوباً للتشغيل داخل التطبيق.

2. **مزامنة النسخة عندك على الماك**
   - بعد اعتماد التعديل، تسحب آخر نسخة داخل:
     ```bash
     cd ~/Documents/visa-hub-cloud
     git pull
     npm install
     ```

3. **إعادة إنشاء iOS من الصفر داخل المشروع الصحيح**
   - إذا كان مجلد iOS لم يُنشأ بعد:
     ```bash
     npx cap add ios
     npx cap sync ios
     npx cap open ios
     ```

4. **إعداد Xcode مرة واحدة**
   - افتح دائماً:
     ```text
     ~/Documents/visa-hub-cloud/ios/App/App.xcworkspace
     ```
   - وليس `.xcodeproj`.
   - داخل Xcode:
     - Team = حساب Apple Developer الخاص بك
     - Bundle ID = `com.visafaster.app`
     - إضافة Capability: **Sign in with Apple**
     - ثم **Product → Clean Build Folder** وبعدها تشغيل التطبيق.

مهم: لا تستخدم أي مشروع قديم على Desktop بعد الآن. المشروع الوحيد الصحيح هو:

```text
~/Documents/visa-hub-cloud
```