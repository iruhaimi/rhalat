
# خطة: تتبع التحويلات في Google Ads وفق أفضل الممارسات

الهدف: قياس الأحداث الحقيقية المؤثرة على الإيراد (وليس مجرد Page View) لتمكين Google Ads من تحسين الحملات تلقائياً (Smart Bidding) وحساب ROAS.

## الأحداث المقترحة (Conversion Events)

| الحدث | متى يُطلق | القيمة | الأولوية |
|---|---|---|---|
| `sign_up` | عند إكمال تسجيل حساب جديد | 0 | ثانوي |
| `begin_checkout` | عند بدء طلب تأشيرة (الدخول لمعالج التقديم) | تقديري | ثانوي |
| `generate_lead` | عند فتح WhatsApp / إرسال نموذج تواصل | 0 | ثانوي |
| `submit_application` | عند تقديم طلب تأشيرة بنجاح | سعر التأشيرة | **رئيسي** |
| `purchase` | عند نجاح الدفع | المبلغ المدفوع الفعلي | **رئيسي (Primary Conversion)** |

## ما سيتم تنفيذه في الكود

1. **Helper مركزي** `src/lib/gtagEvents.ts`:
   - `trackConversion(eventName, { value, currency, transaction_id, send_to })`
   - يتحقق من وجود `window.gtag` ومن حالة Consent (`ad_storage = granted`)
   - يدعم Enhanced Conversions (تمرير email/phone مشفّر تلقائياً عبر gtag)

2. **ربط الأحداث بنقاط حقيقية في التطبيق**:
   - `purchase` → بعد نجاح الدفع (callback نجاح Stripe/Paddle)
   - `submit_application` → بعد إنشاء الطلب بحالة `pending_payment`
   - `sign_up` → بعد تأكيد البريد الإلكتروني
   - `generate_lead` → عند الضغط على WhatsApp / إرسال نموذج
   - `begin_checkout` → عند الدخول لمعالج التقديم

3. **Enhanced Conversions** (موصى به من Google):
   - تمرير `user_data` (email/phone) مع حدث `purchase` — يرفع دقة المطابقة 5-10%
   - Google يقوم بالـ hashing تلقائياً عند استخدام gtag.js

4. **احترام Consent Mode v2**:
   - الأحداث لا تُرسل إلا بعد `ad_storage = granted`
   - في وضع denied: يُرسل ping بدون بيانات شخصية (سلوك Google الافتراضي)

## ما يحتاجه منك بعد الموافقة

من حساب Google Ads → Tools → Conversions، أنشئ تحويلين وارسل لي:
- **Conversion Label للـ Purchase** (شكل: `AW-16509107883/AbCdEfGhIj`)
- **Conversion Label للـ Submit Application** (اختياري لكن مهم)

بدون الـ Labels لن تظهر التحويلات في Google Ads حتى لو أُرسلت من الموقع.

## ملاحظات تقنية

- لن أضيف Google Tag Manager (GTM) — نستخدم gtag.js المثبّت حالياً مباشرة، أبسط وأخف.
- لن أكرر إرسال نفس `purchase` (نستخدم `transaction_id` لمنع التكرار من Google).
- لن أُرسل قيماً وهمية — الأحداث بدون قيمة فعلية تأخذ `value: 0`.

## ملفات ستتغيّر تقريبياً

- جديد: `src/lib/gtagEvents.ts`
- تعديل: ملفات نجاح الدفع، تقديم الطلب، التسجيل، أزرار WhatsApp، بداية معالج التقديم
- لا تغييرات على `index.html` (gtag موجود)
- لا تغييرات على UI

هل أبدأ التنفيذ؟ وإن كانت الـ Conversion Labels جاهزة الآن أرسلها لأضعها مباشرة، وإلا سأضع placeholder واضح لاستبدالها لاحقاً.
