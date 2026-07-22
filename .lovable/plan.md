الخطة:

1. **اعتماد App ID الصحيح**
   - قيمة `app.lovable.616b2e7f7e454cdc90ea1c048e4da3b0` غير صالحة لـ iOS/Android.
   - القيمة الصحيحة التي يجب أن تكون في مشروعك هي:
     ```text
     com.visafaster.app
     ```

2. **التأكد أن GitHub يحتوي آخر تعديل**
   - عندي في المشروع هنا ملف `capacitor.config.ts` مضبوط حالياً على `com.visafaster.app`.
   - بما أن جهازك بعد `git pull` ما زال يقرأ القيمة القديمة، فهذا غالباً يعني أن آخر تعديل من Lovable لم يصل إلى مستودع GitHub المحلي عندك بعد، أو أن جهازك يحتوي نسخة قديمة من الملف.

3. **الحل العملي على جهازك**
   - افتح الملف المحلي:
     ```bash
     cd ~/Documents/visa-hub-cloud
     cat capacitor.config.ts
     ```
   - إذا ظهر فيه:
     ```text
     app.lovable.616b2e7f7e454cdc90ea1c048e4da3b0
     ```
     غيّره إلى:
     ```text
     com.visafaster.app
     ```

4. **بعد تصحيح الملف المحلي**
   - نفّذ:
     ```bash
     npm install
     npx cap add ios
     npx cap sync ios
     npx cap open ios
     ```

5. **داخل Xcode**
   - افتح دائماً:
     ```text
     ios/App/App.xcworkspace
     ```
   - تأكد من:
     ```text
     Bundle ID = com.visafaster.app
     Team = حسابك في Apple Developer
     Capability = Sign in with Apple
     ```

ملاحظة مهمة: بعد أي تعديل Native/Capacitor، اسحب آخر نسخة من GitHub ثم شغّل `npx cap sync`. ويفضل مراجعة مقال Lovable عن تحويل التطبيق إلى Native/Capacitor قبل الإرسال النهائي.