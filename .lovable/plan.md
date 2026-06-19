## المشكلة
في صفحة الهبوط `/lp/visa` رقم الواتساب وهمي:
```
const WHATSAPP = "https://wa.me/966500000000";
```
بينما الرقم الصحيح المستخدم في `FloatingWhatsApp` هو `966562525665`.

كذلك `window.open` لا يعمل دائماً داخل iframe المعاينة/تطبيق Despia (حسب ذاكرة المشروع: يجب استخدام `window.top` للهروب من iframe).

## الإصلاح
في `src/pages/LandingVisa.tsx`:
1. تحديث الرقم إلى `966562525665` مع رسالة عربية افتراضية (مطابقة لـ FloatingWhatsApp).
2. تعديل `handleWhatsApp` ليستخدم `window.top.location.href` مع fallback إلى `window.open`، حتى يعمل الرابط على الموبايل وداخل التطبيق وفي المعاينة.
3. إبقاء استدعاء `trackConversion('generate_lead', ...)` كما هو.

لا تغييرات أخرى.