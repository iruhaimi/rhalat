## الوضع الحالي
- الكود يستخدم **gtag.js مباشرة** (AW-16509107883) وليس GTM.
- أحداث التحويل مبرمجة بالفعل: `purchase`, `submit_application`, `sign_up`, `generate_lead`, `begin_checkout`.
- الـ **Conversion Labels** فارغة في الكود لأنها لم تُنشأ بعد في Google Ads.

## الخطة

### المرحلة 1: تخطي Cloudflare Gateway (الآن)
نظرا لاختيارك **gtag.js المباشر**، فإن Google Tag Gateway عبر Cloudflare (في الصورة) خاص بـ GTM Containers فقط ولا حاجة له حاليا. يمكنك إغلاق هذه الواجهة.

### المرحلة 2: إنشاء Conversion Actions في Google Ads (عليك القيام به)
1. افتح **Google Ads** ← **Tools** ← **Conversions** ← **+ New conversion action**.
2. اختر **Website** وأدخل نطاقك (visafaster.com).
3. أنشئ الأحداث التالية بالترتيب:
   - **purchase** — Primary, Value = dynamic, Category = Purchase
   - **submit_application** — Primary, Value = dynamic (سعر التأشيرة), Category = Submit lead form
   - **sign_up** — Secondary, Category = Sign-up
   - **generate_lead** — Secondary, Category = Submit lead form
4. افتح كل حدث وانسخ الـ **Conversion Label** (الجزء بعد `/` مثال: `XxXxXxXxXx`).
5. أرسل لي هذه القيم.

### المرحلة 3: تحديث الكود (أقوم به)
- أدخل الـ Conversion Labels في `src/lib/gtagEvents.ts` بدلا من القيم الفارغة.
- أُفعّل `trackConversion()` ليرسل إلى Google Ads (وليس GA4 فقط).

### المرحلة 4: تفعيل Enhanced Conversions (اختياري لاحقا)
- بعد تفعيل `purchase` في Google Ads، اذهب إلى إعداداته وفعّل **Enhanced Conversions**.
- الكود جاهز لإرسال `user_data` (email/phone hashed) مع حدث الشراء.

---

**الخطوة الوحيدة المطلوبة منك الآن:** إنشاء Conversion Actions في Google Ads وإرسال الـ Labels.