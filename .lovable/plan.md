## المشكلة
عند تسجيل الدخول عبر Apple من التطبيق (Xcode/iOS)، يظهر الخطأ:
> `Unacceptable audience in id_token: [com.visafaster.app]`

## السبب الجذري
Apple Sign-In الأصلي (Native) على iOS يُصدر `id_token` بـ `audience = bundle ID` وهو `com.visafaster.app`.
لكن مزوّد Apple في Lovable Cloud (Supabase Auth) مُهيّأ حالياً بـ **Services ID** فقط (مثل `com.visafaster.web` أو المُدار من Lovable) — فيرفض أي توكن جمهوره لا يطابق ذلك.

الحل: يجب إضافة `com.visafaster.app` (bundle ID) إلى قائمة **Client IDs / Allowed Audiences** لمزوّد Apple في لوحة Cloud. هذه إعدادات لا تُعدَّل من الكود.

## الخطوات المطلوبة (يدوياً — لوحة Cloud)

1. افتح **Backend → Users → Authentication Settings → Sign In Methods → Apple**.
2. في حقل **Client IDs** (أو Authorized Client IDs / Allowed Audiences)، أضف قيمة إضافية:
   ```
   com.visafaster.app
   ```
   إلى جانب Services ID الحالي (لا تحذف الحالي — الويب يستخدمه).
3. احفظ الإعدادات.
4. أعد المحاولة من التطبيق — لن تحتاج إعادة بناء (`cap sync` غير مطلوب).

## لماذا لا يوجد تغيير كود
- `AppleSignInButton.tsx` صحيح: يمرر `clientId: 'com.visafaster.app'` (bundle ID) لـ `SignInWithApple.authorize` — وهذا هو السلوك الصحيح لـ Native iOS.
- المشكلة حصراً في إعدادات مزوّد Apple على الخادم.

## إجراء زر واحد
سأعرض لك زر فتح لوحة Cloud مباشرة بعد الموافقة على الخطة.
