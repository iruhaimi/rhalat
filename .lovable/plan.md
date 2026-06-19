# حزمة إعلانية كاملة — Google Ads لخدمات التأشيرات

سأنفذ "كل ما سبق" مع التركيز على خدمات التأشيرات (وجهات متعددة) ومطابقة 100% لـ [Image Assets format requirements](https://support.google.com/adspolicy/answer/10347108).

---

## 1) صور إعلانية لـ Google Ads (8 صور)

سأولّد صور احترافية بمقاسين معتمدين، تحفظ في `src/assets/ads/`:

**مربع 1:1 (1200×1200):**
- `ad-square-passport.jpg` — جواز سعودي + ختم تأشيرة + خلفية زرقاء فاخرة
- `ad-square-schengen.jpg` — برج إيفل/الكولوسيوم + علم شنغن
- `ad-square-uk.jpg` — بيغ بن + جواز
- `ad-square-team.jpg` — موظف دعم سعودي يبتسم (ثقة)

**أفقي 1.91:1 (1200×628):**
- `ad-landscape-passport.jpg`
- `ad-landscape-schengen.jpg`
- `ad-landscape-uk.jpg`
- `ad-landscape-team.jpg`

**ضمانات المطابقة لسياسة Google:**
- المحتوى المهم في وسط 80%
- بدون نصوص داخل الصورة (أو أقل من 20%)
- بدون شعارات/أزرار وهمية/إطارات
- جودة عالية، حجم < 5MB، JPG
- صور أصلية (مولّدة) — لا تنتهك حقوق نشر

---

## 2) صفحة هبوط مخصصة للإعلان `/lp/visa`

صفحة Landing Page محسّنة للتحويل (تختلف عن الصفحة الرئيسية):

**الهيكل:**
```text
[Hero بصورة + عنوان واضح + CTA "ابدأ طلبك الآن"]
[3 نقاط ثقة: سرعة + خبرة + ضمان استرداد]
[شريط الوجهات الأكثر طلباً (شنغن، بريطانيا، أمريكا...)]
[How it works — 3 خطوات]
[شهادات عملاء (من useTestimonials الموجود)]
[FAQ مختصر — 5 أسئلة]
[CTA ثاني + WhatsApp]
```

**خصائص:**
- صفحة واحدة بدون Header/Footer ثقيلة (تركيز كامل على التحويل)
- Mobile-first
- وقت تحميل سريع (lazy loading للصور تحت الفولد)
- مطابقة لـ Google Ads Landing Page Experience
- SEO + Meta tags + OG image

**التتبع المدمج في الصفحة:**
- `gtag('event', 'page_view')` تلقائي
- `gtag('event', 'cta_click')` عند الضغط على "ابدأ طلبك"
- `gtag('event', 'whatsapp_click')` عند الضغط على واتساب

---

## 3) تتبع التحويلات (Conversions)

`src/lib/gtagEvents.ts` فيه `CONVERSION_LABELS` معطّل. سأفعّله بهيكل واضح:

```ts
export const CONVERSION_LABELS = {
  purchase: 'AW-16509107883/XXXX',         // عند الدفع الناجح
  submit_application: 'AW-16509107883/YYYY', // عند تقديم الطلب
  generate_lead: 'AW-16509107883/ZZZZ',    // عند ضغط CTA / واتساب
};
```

سأترك الـ Labels بقيم placeholder واضحة `REPLACE_ME` مع تعليمات داخل الكود. **محتاج منك Conversion Labels من حسابك في Google Ads** (Tools → Conversions → افتح كل تحويل → انسخ الـ Label) عشان أركّبها.

أحداث التتبع المربوطة:
- `purchase` → موجود في `PaymentSuccess.tsx`
- `submit_application` → موجود في `Step6Payment.tsx`
- `generate_lead` (جديد) → في صفحة الـ Landing Page

---

## ملاحظات تقنية

- **الصور**: توليد بـ `imagegen` بجودة premium (مهم للنص/الجودة) — كل صورة منفصلة
- **الصفحة الجديدة**: route جديد `/lp/visa` في `src/App.tsx`
- **بدون كسر شيء**: مالك للهوية الحالية (الأزرق/الرمادي، RTL، fonts العربية)
- **gtagEvents.ts**: أحدّث `CONVERSION_LABELS` فقط — ما أغيّر منطق `trackConversion`

---

## ما سيتم تسليمه

1. 8 صور إعلانية جاهزة للرفع في Google Ads
2. صفحة هبوط `/lp/visa` احترافية محسّنة للتحويل
3. تتبع تحويلات مفعّل (يحتاج Labels منك لاحقاً)
4. ملف توجيهي مختصر `ADS_GUIDE.md` فيه:
   - أبعاد الصور ومتى تستخدم كل واحدة
   - رابط Landing Page للحملة
   - خطوات نسخ Conversion Labels من Google Ads

هل أبدأ التنفيذ؟
