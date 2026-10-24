# 📢 دليل الحملة الإعلانية — Google Ads

## 1) صور الإعلانات (Image Assets)

الصور جاهزة في `src/assets/ads/` ومتوافقة 100% مع [متطلبات Google](https://support.google.com/adspolicy/answer/10347108):

| الملف | المقاس | النسبة | الاستخدام |
|---|---|---|---|
| `ad-square-passport.jpg` | 1200×1200 | 1:1 | Display / Performance Max — جواز سفر |
| `ad-square-schengen.jpg` | 1200×1200 | 1:1 | شنغن (باريس + روما) |
| `ad-square-uk.jpg` | 1200×1200 | 1:1 | بريطانيا (Big Ben) |
| `ad-square-team.jpg` | 1200×1200 | 1:1 | فريق الدعم |
| `ad-landscape-*.jpg` | 1200×628 | 1.91:1 | Display / Search Ads |

**كيف ترفعها:**
1. Google Ads → Campaigns → افتح حملتك → Assets → + Image
2. ارفع المربعة (1:1) والمستطيلة (1.91:1) لكل وجهة
3. لا تضيف نص داخل الصورة — اتركه لعناوين الإعلان

---

## 2) صفحة الهبوط (Landing Page)

استخدم هذا الرابط في **Final URL** بدلاً من الصفحة الرئيسية:

```
https://visafaster.com/lp/visa
```

مميزاتها:
- بدون هيدر/فوتر ثقيل → تركيز كامل على التحويل
- عنوان واضح + CTA واضح في الأعلى
- نقاط ثقة + شهادات + FAQ
- WhatsApp button (تحويل غير مدفوع)
- متوافقة مع Google Ads Landing Page Experience

**نصيحة:** أضف UTM parameters للحملة:
```
https://visafaster.com/lp/visa?utm_source=google&utm_medium=cpc&utm_campaign=visa_q4
```

---

## 3) تتبع التحويلات (Conversions) — **مهم**

التتبع جاهز في الكود لكن **Conversion Labels فاضية**. بدونها Google Ads ما يعرف إن في تحويلات.

### الخطوات:

1. ادخل [Google Ads](https://ads.google.com) → Tools (🔧) → **Conversions**
2. اضغط **+ New conversion action** → اختر **Website**
3. أنشئ 3 تحويلات بهذه الأسماء:

| اسم التحويل | Category | القيمة | متى يحدث |
|---|---|---|---|
| Visa Purchase | Purchase | Use different values | عند نجاح الدفع |
| Submit Application | Submit lead form | Don't use value | عند تقديم الطلب |
| Lead Contact | Contact | Don't use value | ضغط CTA / واتساب |

4. لكل تحويل، انسخ **Conversion ID/Label** (يكون بشكل: `AW-18502036693/AbCdEfGhIjK`)

5. الصق القيم في `src/lib/gtagEvents.ts` (السطور 21–27) واستبدل `REPLACE_ME_*`:

```ts
const CONVERSION_LABELS = {
  purchase: `${GOOGLE_ADS_ID}/AbCdEfGhIjK`,        // ← من Visa Purchase
  submit_application: `${GOOGLE_ADS_ID}/XyZ123...`, // ← من Submit Application
  generate_lead: `${GOOGLE_ADS_ID}/Lm456...`,      // ← من Lead Contact
};
```

6. احفظ → التحويلات تبدأ تظهر في Google Ads خلال 24-48 ساعة

### للتأكد من العمل:
- ثبّت إضافة [Google Tag Assistant](https://chrome.google.com/webstore/detail/tag-assistant-companion/jmekfmbnaedfebfnmakmokmlfpblbfdm) في Chrome
- ادخل `/lp/visa` → اضغط CTA → افتح Tag Assistant
- لازم تشوف حدث `conversion` مع الـ Label الصحيح

---

## 4) أفكار لعناوين الإعلانات (Headlines)

- "تأشيرة شنغن خلال أيام — ابدأ الآن"
- "خبراء تأشيرات معتمدون · ضمان استرداد"
- "قدّم طلبك من السعودية بأمان"
- "10,000+ تأشيرة ناجحة معنا"

## 5) نصائح حملة فعّالة

- استخدم **Performance Max** للوصول الأوسع
- استهدف المملكة + الإمارات + الكويت + قطر
- اللغة: العربية أساسية، الإنجليزية كخيار ثاني
- ميزانية بداية: 50-100 ريال/يوم لاختبار الإعلانات
- شغّل **Conversion Tracking** أول شيء قبل ما تطلق الحملة
