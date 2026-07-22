## الهدف
تفعيل تسجيل الدخول عبر Apple من مكانين:
- **تطبيق iOS الأصلي** (Xcode/Capacitor) — يستخدم Bundle ID `com.visafaster.app` ✅ (جاهز)
- **الموقع** visafaster.com و www.visafaster.com — يحتاج **Services ID** جديد (لأن Apple لا يسمح باستخدام Bundle ID للويب)

---

## ما ستفعله في Apple Developer (يدوياً)

### 1) إنشاء Services ID جديد
- في القائمة المفتوحة عندك الآن، اضغط **Services IDs** (بدل App IDs).
- ستجد القائمة فارغة → اضغط زر **+** الأزرق بجانب "Identifiers".
- اختر **Services IDs** → **Continue**.
- املأ:
  - **Description**: `Visa Faster Web Sign In`
  - **Identifier**: `com.visafaster.signin` (لا يمكن أن يطابق Bundle ID)
- **Continue** → **Register**.

### 2) تفعيل Sign In with Apple على الـ Services ID
- افتح الـ Services ID الجديد الذي أنشأته للتو.
- ✅ فعّل **Sign In with Apple** → اضغط **Configure**.
- **Primary App ID**: اختر `com.visafaster.app`.
- **Domains and Subdomains** (سطر واحد لكل نطاق):
  ```
  visafaster.com
  www.visafaster.com
  ```
- **Return URLs**:
  ```
  https://visafaster.com
  https://www.visafaster.com
  ```
- **Next** → **Done** → **Save**.

### 3) إعادة استخدام نفس المفتاح (.p8) الذي أنشأته سابقاً
- المفتاح `M7P3CQPHYS` صالح لكل من Bundle ID والـ Services ID الجديد (لأن كلاهما تحت نفس Primary App ID).
- لا حاجة لإنشاء مفتاح جديد.

---

## ما ستفعله في لوحة Lovable Cloud

### 4) تحديث إعدادات Apple Auth
افتح: **Cloud → Users → Auth Settings → Sign In Methods → Apple**

في حقل **Client IDs** أضف الاثنين معاً (مفصولين بفاصلة أو سطر):
```
com.visafaster.app
com.visafaster.signin
```

في **Redirect URLs** فعّل:
- ✅ `visafaster.com`
- ✅ `www.visafaster.com`

في **Generate Secret** (إذا طُلب مجدداً):
- **Client ID**: `com.visafaster.signin` (Services ID للويب)
- **Team ID**: `7VFVD6Z3SG`
- **Key ID**: `M7P3CQPHYS`
- **.p8**: نفس الملف

اضغط **Save**.

---

## ما لا يحتاج تغيير في الكود
- `AppleSignInButton.tsx` جاهز بالفعل لكلا الحالتين:
  - على iOS Native → يستدعي `SignInWithApple.authorize` مع Bundle ID.
  - على الويب → يستدعي `lovable.auth.signInWithOAuth('apple')` الذي سيستخدم Services ID تلقائياً.
- لا تعديلات على `capacitor.config.ts` أو `AppleSignInButton.tsx` أو أي ملف آخر.

---

## التحقق بعد الحفظ
1. **الويب**: افتح https://visafaster.com/auth → اضغط زر Apple → يجب أن تفتح صفحة Apple ثم يعود المستخدم مسجّلاً دخوله.
2. **iOS**: افتح التطبيق من Xcode → زر Apple → تظهر شاشة Apple الأصلية (Face ID) → دخول مباشر.

---

## ملاحظة
لن يظهر لك سؤال "أيهما Services ID أم Bundle ID" في لوحة Cloud لأنها تقبل قائمة Client IDs متعددة. Supabase يطابق الـ audience تلقائياً حسب مصدر الطلب.

هل تريد أن أنتظر بعد ما تحفظ وتجرّب، أم عندك سؤال قبل البدء؟