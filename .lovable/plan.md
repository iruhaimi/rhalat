# إصلاح ملخص الطلب الفارغ بعد تسجيل دخول Google

## المشكلة
بعد حذف خطوة "البيانات الأساسية"، لم يعد هناك مصدر يملأ `applicationData.fullName/email/phone`. كما أن Google OAuth لا يُرجع رقم الجوال إطلاقاً.

## الحل (3 طبقات)

### 1) مزامنة تلقائية من حساب المستخدم (Auto-hydrate)
في `ApplicationContext` (أو hook جديد `useHydrateApplicantFromAuth`):
- عند تغيّر `user` أو `profile`، حدّث `applicationData` تلقائياً:
  - `fullName` ← `profile.full_name` أو `user.user_metadata.full_name`
  - `email` ← `user.email`
  - `phone` ← `profile.phone` (قد يكون فارغاً)
  - `countryCode` ← ثابت `+966` (السوق السعودي)
- لا نكتب فوق ما أدخله المستخدم يدوياً (نملأ فقط إذا كان الحقل فارغاً).

### 2) سدّ ثغرة "رقم الجوال" بعد تسجيل دخول Google
المستخدم الجديد من Google لن يكون لديه `phone` في `profiles`. الخيار الأنظف:

**إضافة بطاقة "أكمل بياناتك" (CompleteProfileCard)** تظهر فقط إذا كان `profile.phone` فارغاً:
- تظهر في الخطوة 3 (Path Choice) قبل عرض خياري "إلكتروني / واتساب".
- حقل واحد فقط: رقم الجوال (9 أرقام، نفس الـ validation الحالي من `inputFilters.ts`).
- زر "حفظ ومتابعة" → `UPDATE profiles SET phone = ?` ثم يفتح خيارات المسار.
- لا نطلب الاسم/البريد لأنهما متوفران من Google.

هذا يضمن:
- لا يصل المستخدم إلى ملخص الطلب إلا وبياناته كاملة.
- البيانات تُحفظ في `profiles` (مصدر واحد للحقيقة) وتظهر في كل الطلبات المستقبلية تلقائياً.

### 3) قراءة الملخص من المصدر الموثوق
في `Step6Payment.tsx`، استبدال:
```tsx
{applicationData.fullName}
{applicationData.email}
{applicationData.countryCode} {applicationData.phone}
```
بـ:
```tsx
{profile?.full_name || user?.user_metadata?.full_name}
{user?.email}
+966 {profile?.phone}
```
وكذلك في:
- `buildWhatsAppMessage` (رسالة واتساب)
- `sendConfirmationEmail` (بريد التأكيد)
- `purpose_of_travel` JSON المحفوظ في `applications`
- `PathChoiceCard` (نفس الإصلاح)

بهذا نضمن أن البيانات المعروضة والمُرسلة والمحفوظة كلها من **مصدر واحد** (`auth.users` + `profiles`)، وليست نسخة قد تكون فارغة في `ApplicationContext`.

## الملفات المتأثرة
- `src/contexts/ApplicationContext.tsx` — مزامنة تلقائية مع auth.
- `src/components/apply/CompleteProfileCard.tsx` — **جديد**.
- `src/pages/Apply.tsx` — عرض البطاقة الجديدة قبل Step 3 إذا كان `phone` فارغاً.
- `src/components/apply/steps/Step6Payment.tsx` — قراءة من `profile`/`user`.
- `src/components/apply/PathChoiceCard.tsx` — نفس التعديل.

## فائدة إضافية
المستخدم الذي يسجّل بـ Google ثم يطلب لاحقاً، لن يُسأل عن رقمه مرة أخرى — لأنه محفوظ في `profiles`. تجربة سلسة حقيقية.
