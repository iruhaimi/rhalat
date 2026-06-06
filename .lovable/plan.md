## المشكلة

عندما يضغط المستخدم على "التقديم على فيزا" وهو غير مسجّل، يتم تحويله إلى `/auth`. بعد تسجيل الدخول بنجاح (Google أو إيميل) يتم توجيهه دائماً إلى `/profile` بدل إعادته للصفحة اللي كان فيها (مثلاً `/dashboard/apply/<visaId>`)، فيضطر يعيد كل الخطوات.

## السبب التقني

- `src/pages/VisaDetail.tsx` يرسل `?redirect=...` إلى `/auth` بشكل صحيح.
- `src/pages/Auth.tsx` يتجاهل هذا الباراميتر ويستدعي `navigate('/profile')` في كل المسارات (إيميل، تسجيل جديد، 2FA).
- `src/components/auth/GoogleSignInButton.tsx` يستخدم `redirectPath = '/profile'` ثابتاً.
- تأكيد الإيميل يستخدم `emailRedirectTo: ${origin}/` فيرجع المستخدم للصفحة الرئيسية بدون ذاكرة للوجهة.

## الحل المقترح

### 1. إنشاء helper جديد `src/lib/safeRedirect.ts`
- `isSafeInternalPath(path)`: يقبل فقط مسارات تبدأ بـ `/` ولا تحتوي `//` أو `http`، لمنع open-redirect.
- `stashPendingRedirect(path)` / `consumePendingRedirect()`: يخزّن في `sessionStorage` كـ fallback للتدفقات اللي تخرج من الموقع (Google OAuth، تأكيد الإيميل).

### 2. تعديل `src/pages/Auth.tsx`
- قراءة `searchParams.get('redirect')` مع fallback إلى `sessionStorage`، والتحقق منها عبر `isSafeInternalPath`.
- استبدال كل `navigate('/profile')` بـ `navigate(safeRedirect ?? '/profile')` في:
  - نجاح تسجيل الدخول بالإيميل
  - نجاح إنشاء حساب جديد
  - نجاح 2FA
  - حالة "مستخدم مسجل دخوله أصلاً وزار /auth"
- تمرير الـ redirect داخل `emailRedirectTo` عند `signUp`: `${origin}/auth?redirect=<encoded>`.
- تمرير `redirectPath={safeRedirect}` إلى `<GoogleSignInButton>`.
- مسح `sessionStorage` بعد التوجيه الناجح.

### 3. تعديل `src/components/auth/GoogleSignInButton.tsx`
- إذا لم يُمرَّر `redirectPath` كـ prop، يقرأ من URL/sessionStorage تلقائياً.
- قبل استدعاء `lovable.auth.signInWithOAuth` يستدعي `stashPendingRedirect(safeRedirect)` لأن OAuth يفقد query params.

### 4. مراجعة نقاط الدخول للتأكد من تمرير `?redirect=`
- `src/pages/VisaDetail.tsx` ✓ (موجود)
- `src/pages/CountryDetail.tsx` — أزرار "ابدأ التقديم"
- `src/components/home/HeroSection.tsx` — CTA الرئيسي
- أي زر "ابدأ التقديم" في صفحة `/tourism` أو غيرها

### 5. استثناء بوابة الموظفين
- مسار `/portal-x7k9m2` لا يقرأ `redirect` إطلاقاً لتجنب أي خلط في صلاحيات الموظفين (يبقى على منطقه الحالي).

## الحالات المغطاة

- ✅ حماية من open-redirect (رفض `//evil.com`، `http://...`، أي مسار بدون `/` في البداية)
- ✅ Google OAuth يفقد query params → sessionStorage fallback
- ✅ تأكيد الإيميل يصل بعد ساعات → الرابط السحري يحمل الـ redirect
- ✅ مستخدم مسجّل دخوله أصلاً ويزور `/auth?redirect=/x` → تحويل فوري إلى `/x`
- ✅ بوابة الموظفين لا تتأثر

## الملفات المعدّلة

- `src/lib/safeRedirect.ts` (جديد)
- `src/pages/Auth.tsx`
- `src/components/auth/GoogleSignInButton.tsx`
- `src/pages/CountryDetail.tsx` (تأكيد تمرير redirect)
- `src/components/home/HeroSection.tsx` (تأكيد تمرير redirect)

لا تغييرات على قاعدة البيانات أو edge functions.
