## السبب

في الإصدار السابق، زر "فتح محادثة واتساب" كان يفتح واتساب مع نص الطلب الكامل (الاسم، رقم الطلب، الدولة، نوع التأشيرة، عدد المسافرين، المبلغ، المتطلبات…) عبر `buildWhatsAppMessage()` في `Step6Payment.tsx`.

بعد التحديث الأخير الذي أضاف صفحة `PaymentSuccess.tsx` كوجهة بعد الإرسال، صار زر واتساب في صفحة النجاح يستخدم رابطًا فارغًا:

```ts
// src/pages/PaymentSuccess.tsx
const whatsappUrl = `https://wa.me/966562525665`;  // ← لا يوجد ?text=
```

أيضًا الزر العائم `FloatingWhatsApp.tsx` يستخدم رسالة استفسار عامة فقط.

النتيجة: الرسالة الكاملة تُبنى وتُفتح مرة واحدة فقط داخل `Step6Payment` قبل التحويل، وأي ضغط لاحق على أزرار واتساب يفتح محادثة فارغة.

## الخطة

1. **تمرير رسالة الطلب إلى صفحة النجاح**
   - في `Step6Payment.tsx`: بعد بناء `message = buildWhatsAppMessage(appNumber)`، حفظها في `sessionStorage` بمفتاح `wa_message_<appNumber>` قبل التحويل إلى `/payment-success`.

2. **استخدامها في `PaymentSuccess.tsx`**
   - قراءة `sessionStorage.getItem('wa_message_' + applicationNumber)` عند تحميل الصفحة.
   - بناء الرابط: `https://wa.me/966562525665?text=${encodeURIComponent(savedMessage)}` عند توفر الرسالة، وإلا الرجوع لرسالة افتراضية مختصرة تذكر رقم الطلب فقط.
   - تطبيق نفس منطق `window.top` لتجاوز iframe المعاينة عند الضغط (بدلاً من رابط `<a>` مباشر) لضمان الفتح في نافذة أعلى.

3. **الزر العائم (FloatingWhatsApp)**
   - يبقى للاستفسار العام (سلوك مقصود)، لا تغيير.

## الملفات المتأثرة
- `src/components/apply/steps/Step6Payment.tsx` (حفظ الرسالة في sessionStorage)
- `src/pages/PaymentSuccess.tsx` (قراءة الرسالة وبناء رابط واتساب الكامل + فتح آمن داخل iframe)

لا تغييرات على قاعدة البيانات أو منطق الأعمال.