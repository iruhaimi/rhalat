
# خطة معالجة رفض آبل (Submission 8543b9f6)

آبل رفضت الإصدار لـ 7 أسباب. بعضها يُحل بتعديل الكود (نقوم به نحن)، وبعضها يتطلب تعديل داخل حساب **App Store Connect** أو **Apple Developer** (تقوم بها أنت — لا يمكن للكود إصلاحها).

---

## أولاً: إصلاحات في الكود (نقوم بها)

### 1) إخفاء تسجيل الدخول بـ Google داخل تطبيق iOS فقط (يعالج 2.1a + 4.8)
- المراجع شاهد **شاشة خطأ عند تسجيل الدخول بجوجل** على iPad/iPhone. مشكلة OAuth داخل غلاف Despia webview شائعة.
- الحل الأسرع والأأمن: **إخفاء زر Google داخل التطبيق iOS فقط** (يبقى ظاهراً على الموقع). Sign in with Apple + Email/Password يبقيان — وهذا يُلغي تلقائياً مخالفة 4.8 (لأن Google لن يُعرض أصلاً).
- تعديل: `src/pages/Auth.tsx` و `src/components/layout/MobileNavDrawer.tsx` لاستخدام دالة `isIOSApp()` (نفس اكتشاف Despia UA الموجودة في `gtagEvents.ts`).
- تقديم زر Apple فوق زر Google في كل المنصات (ترتيب متوافق مع 4.8).

### 2) إخفاء بانر ملفات تعريف الارتباط داخل iOS (يعالج 5.1.2(i) الثاني)
- آبل رفضت لأن التطبيق يعرض **Cookie Consent** ولا يستخدم ATT.
- بما أننا لا نتتبع فعلياً داخل iOS (gtag معطّل)، الحل: **عدم عرض `CookieConsent` عندما `isIOSApp() === true`**.
- تعديل: `src/components/layout/MainLayout.tsx` أو `CookieConsent.tsx` مباشرة لإرجاع `null` داخل iOS.

### 3) استبدال أيقونة التطبيق (يعالج 2.3.8)
- المراجع اعتبر الأيقونات الحالية "Placeholder".
- نولّد أيقونة احترافية جديدة لعلامة **Visa Faster / عطلات رحلاتكم** بحجم 1024×1024 (متطلب آبل)، نحفظها في `public/app-icon-1024.png`، ونحدّث `pwa-192x192.png` و `pwa-512x512.png` و `favicon` بنفس التصميم.
- ⚠️ **تحتاج أن تحمّلها يدوياً في Despia dashboard** كأيقونة التطبيق قبل إعادة البناء (الكود وحده لا يُحدّث أيقونة iOS build).

### 4) تحديث ملاحظات المراجعة `docs/APP_STORE_REVIEW_NOTES.md`
- توضيح للمراجع:
  - "Google Sign-In مخفي داخل iOS build عمداً؛ استخدم Sign in with Apple أو حساب Demo (email/password)."
  - "لا يُعرض Cookie banner داخل iOS لأننا لا نتتبع؛ لذلك ATT غير مطلوب."
  - "بيانات المراجعة الصحيحة: `applereview@visafaster.com` / `Vf-Rev!7k2Q9pXm4T`."

---

## ثانياً: إجراءات يجب أن تقوم بها أنت (لا يمكن للكود إصلاحها)

### A) Guideline 5.1.1(ix) — اسم الناشر يجب أن يعكس "Visa Faster" 🔴 الأهم
- التطبيق حالياً منشور تحت اسم شخصي: **ibrahim almutairi**.
- آبل صريحة: تطبيقات الخدمات المنظّمة (تأشيرات) يجب أن تُنشر باسم شركة يعكس اسم العلامة.
- الحل: صاحب الحساب (Account Holder) يتواصل مع **Apple Developer Support** لطلب تغيير اسم الشركة إلى **"Visa Faster"** أو الاسم القانوني للوكالة.
  - رابط: https://developer.apple.com/contact/ → "Membership & Account" → "Change organization name".
  - يحتاج مستندات: السجل التجاري / رخصة وزارة السياحة.
- هذه أطول خطوة (5–15 يوم عمل)، ابدأها **اليوم**.

### B) Guideline 5.1.2(i) الأول — تحديث App Privacy Labels
- الملصقات الحالية تقول التطبيق **يتتبع** المستخدم (Email، Photos، Phone، Name، User ID) → آبل تطلب ATT.
- افتح: **App Store Connect → App Privacy → Edit**.
- في قسم **Data Used to Track You** → غيّر إلى **"None"** (لأن gtag معطل داخل iOS).
- احتفظ بالبيانات في قسم **Data Linked to You** و **Data Not Linked to You** كما هي.

### C) Guideline 2.1 — تحديث بيانات الحساب التجريبي
- الحساب المسجل حالياً: `iruhaimii@gmail.com` / `Ibra1983@` (لا يعمل).
- افتح: **App Store Connect → App Information → App Review Information → Sign-in Information**.
- بدّل إلى:
  - Username: `applereview@visafaster.com`
  - Password: `Vf-Rev!7k2Q9pXm4T`
- الصق نص Review Notes المُحدّث من `docs/APP_STORE_REVIEW_NOTES.md` في حقل **Notes**.

### D) رفع الأيقونة الجديدة في Despia
- بعد أن أنتج الأيقونة (خطوة 3 أعلاه) حمّلها في:
  - **Despia dashboard → App Icon** (1024×1024).
  - أعِد بناء التطبيق ورفعه على TestFlight ثم Submit.

---

## Technical details

- iOS detection: نستخدم نفس منطق `src/lib/gtagEvents.ts`:
  ```ts
  export const isIOSApp = () =>
    typeof navigator !== 'undefined' &&
    /Despia|VisaFasterIOS/i.test(navigator.userAgent);
  ```
- سنستخرجه إلى `src/lib/platform.ts` ليُعاد استخدامه في `Auth.tsx` و `MobileNavDrawer.tsx` و `MainLayout.tsx`.
- أيقونة التطبيق: `imagegen` بجودة `premium` (لأنها تحتوي على شعار/نص)، 1024×1024، خلفية زرقاء (لون العلامة `#1e40af`) مع رمز جواز/تأشيرة، بدون شفافية.

---

## ترتيب التنفيذ الموصى به
1. **الآن**: تواصل مع Apple Developer Support لتغيير اسم الشركة (البند A) — أطول خطوة.
2. أوافقني على الخطة لأنفذ التعديلات البرمجية (1–4) وأنتج الأيقونة الجديدة.
3. أنت تُحدّث App Privacy + Demo Account في App Store Connect (البندان B و C).
4. ترفع الأيقونة في Despia وتعيد البناء.
5. Resubmit بعد اكتمال تغيير اسم الشركة.

هل تريد أن أبدأ التنفيذ البرمجي (1–4)؟
