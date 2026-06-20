# إصلاح: لا تظهر وسائل الدفع في الخطوة الأخيرة

## السبب الجذري

في `src/components/apply/steps/Step6Payment.tsx` (السطر 132):

```ts
const REQUIRED_DOC_TYPES = ['passport', 'photo'];
const uploadedTypes = applicationData.uploadedDocuments.filter(d => d.uploaded).map(d => d.type);
const missingDocs = REQUIRED_DOC_TYPES.filter(t => !uploadedTypes.includes(t));
const docsComplete = missingDocs.length === 0;
```

التحقق يبحث عن نوعَي ملف ثابتَين: `passport` و `photo`.

لكن في `Step4Documents.tsx` (السطر 95) المستندات تُحفظ بـ `slotId` ديناميكي مبني على متطلبات السفارة من قاعدة البيانات:

```ts
slotId: `${req.id}_${category}_${index}`   // مثال: "uuid-xxx_adult_1"
```

النتيجة: `docsComplete` دائماً = `false` لأي تأشيرة (شنغن أو غيرها) بمتطلبات ديناميكية → كتلة وسائل الدفع كاملة (السطر 549) لا تُعرض، ويرى العميل فقط تحذير "يجب رفع المستندات" بدون أي خيار دفع.

## الإصلاح المقترح

### 1. مزامنة منطق التحقق مع Step4

في `Step6Payment.tsx`:

- جلب `visa_requirements` من Supabase بنفس طريقة Step4 (`useQuery` على `visa_type_id`).
- إعادة بناء نفس مصفوفة `expandedRequirements` (نفس صيغة `slotId`).
- حساب المتطلبات الناقصة:
  ```ts
  const requiredSlots = expandedRequirements
    .filter(r => r.isRequired && r.requiresUpload)
    .map(r => r.slotId);
  const uploadedSet = new Set(
    applicationData.uploadedDocuments.filter(d => d.uploaded).map(d => d.type)
  );
  const missingDocs = requiredSlots.filter(s => !uploadedSet.has(s));
  const docsComplete = missingDocs.length === 0;
  ```
- أثناء تحميل المتطلبات (`reqsLoading`) نعرض هيكل تحميل بدل افتراض النقص.

### 2. تحسين رسالة "مستندات ناقصة"

بدل النص الثابت "جواز السفر + الصورة الشخصية"، نعرض أسماء المتطلبات الفعلية الناقصة (بالعربية/الإنجليزية) من DB، مع زر "العودة لرفع المستندات" كما هو.

### 3. (اختياري — لمناقشتك)

Step4 يعرض "الرفع اختياري الآن — أكمل عبر واتساب لاحقاً" لكن Step6 يمنع الدفع. هذا تناقض في تجربة المستخدم. خياران:
- **أ)** إبقاء المنع (الأكثر أماناً للأعمال) — الإصلاح أعلاه يكفي.
- **ب)** السماح بالدفع حتى مع نقص المستندات، ووضع تنبيه أصفر "ستحتاج لإكمال المستندات عبر واتساب". أوصي بـ (أ) للحفاظ على جودة الطلبات.

## ملفات ستتغير

- `src/components/apply/steps/Step6Payment.tsx` — استبدال التحقق الثابت بمنطق ديناميكي + جلب المتطلبات.

## التحقق بعد التطبيق

- تكرار سيناريو المستخدم: تسجيل عميل → شنغن → رفع المستندات الإلزامية → الخطوة 5 يجب أن تُظهر بطاقات الدفع الثلاث (بطاقة / Apple Pay / تحويل بنكي).
- اختبار حالة النقص: ترك مستند إلزامي بدون رفع → يظهر التحذير مع أسماء المستندات الناقصة الفعلية.
