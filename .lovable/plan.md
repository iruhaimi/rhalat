## الوضع الحالي
اخترت **Your own credentials** وأدخلت `com.visafaster.app` كـ Client ID. النموذج يطلب الآن **Client Secret (JWT)** — بدونه لن يُحفظ الإعداد.

هذا الـ JWT يُولَّد من مفاتيح حسابك في Apple Developer. لا يمكن إنشاؤه من الكود؛ لا بد من ٤ قيم من Apple Developer Console.

## ما تحتاجه من Apple Developer (https://developer.apple.com/account)

| القيمة | من أين | الشكل |
|---|---|---|
| **Team ID** | أعلى يمين الصفحة تحت اسم الحساب | 10 أحرف/أرقام (مثل `A1B2C3D4E5`) |
| **Key ID** | Certificates, IDs & Profiles → **Keys** → أنشئ مفتاح جديد، فعّل **Sign in with Apple**، احفظ Key ID | 10 أحرف/أرقام |
| **ملف .p8** | نفس الخطوة السابقة — يُنزَّل مرة واحدة فقط عند الإنشاء | ملف نصي يبدأ بـ `-----BEGIN PRIVATE KEY-----` |
| **Client ID** | جاهز = `com.visafaster.app` (Bundle ID) | ✅ |

> مهم: عند إنشاء الـ Key اربطه بـ **Primary App ID = `com.visafaster.app`**.

## الخطوات داخل لوحة Cloud (بعد جمع القيم)

1. ابقَ في نفس الشاشة الحالية (**Apple settings → Your own credentials**).
2. اضغط الشريط السفلي **Generate secret** — سيفتح نموذجاً يطلب:
   - Team ID
   - Key ID
   - Client ID (= `com.visafaster.app`)
   - محتوى ملف `.p8` (افتحه بمحرر نصوص والصق كامل المحتوى)
3. سيولّد Lovable تلقائياً الـ JWT ويعبّئ حقل Client Secret.
4. اضغط **Save**.

## بديل أبسط (موصى به إن كنت لا تحتاج تخصيص Apple)
ارجع لخيار **Managed by Lovable** — لكن هذا يستخدم Services ID الخاص بـ Lovable، ولن يقبل الـ id_token الأصلي من تطبيقك (نفس خطأ `Unacceptable audience`).

لذا: **يجب اختيار Your own credentials** ما دمت تستخدم Native Apple Sign-In على iOS.

## بعد الحفظ
- لا حاجة لأي تغيير في الكود.
- أعد تجربة الدخول من التطبيق مباشرة.

## هل تحتاج مساعدتي؟
أخبرني إن كنت تريد شرح كيفية إنشاء **Key** في Apple Developer بالتفصيل، أو أن الشاشة مختلفة عندك.
