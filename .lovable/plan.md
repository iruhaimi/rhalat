## المشكلتان

**1) الويب: `invalid_client` من Apple**
السبب: Apple's OAuth يتطلب أن يكون **Return URL** في Services ID مطابقاً تماماً لعنوان الـ callback الذي يستقبل الرد. Supabase يستخدم دائماً:
```
https://hgxvwziiumjxifpgpjce.supabase.co/auth/v1/callback
```
لكنك أضفت في Apple فقط `https://visafaster.com/` و `https://www.visafaster.com/`. لذلك Apple ترفض الطلب فوراً بـ `invalid_client`.

**2) iOS: `Unacceptable audience in id_token: [com.visafaster.app]`**
السبب: قائمة **Client IDs** في لوحة Cloud → Apple لا تحتوي على `com.visafaster.app` (Bundle ID). Supabase يستقبل id_token صالحاً من Apple لكن جمهوره (`aud`) غير مُصرّح به في القائمة.

---

## الإصلاح — كل الخطوات يدوية، لا يوجد كود يتغيّر

### أ) في Apple Developer Console
افتح **Identifiers → Services IDs → `com.visafaster.signin` → Sign In with Apple → Configure**.

في **Return URLs** أضف السطر التالي (احتفظ بالسطور الحالية):
```
https://hgxvwziiumjxifpgpjce.supabase.co/auth/v1/callback
```
اضغط **Next → Done → Save**.

### ب) في لوحة Lovable Cloud → Users → Auth Settings → Apple
تحقّق أن خانة **Client IDs** تحتوي على **الاثنين** (كل واحد في سطر منفصل):
```
com.visafaster.signin
com.visafaster.app
```
إذا كان `com.visafaster.app` مفقوداً، أضِفه واضغط **Save**.

لا تُعِد توليد Client Secret — الحالي صالح للـ Services ID.

---

## التحقق بعد الحفظ

1. **الويب**: https://visafaster.com/auth → زر Apple → يجب أن تفتح صفحة تسجيل دخول Apple عادية (بدلاً من `invalid_client`) وترجع مسجّلاً.
2. **iOS**: افتح التطبيق → زر Apple → Face ID → دخول مباشر بدون خطأ `Unacceptable audience`.

أخبرني بالنتيجة بعد الخطوتين.
