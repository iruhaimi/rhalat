## السبب

الأرقام تستخدم حالياً `font-display` (خط **Syne** — خط عرض زخرفي/هندسي مزخرف غير مناسب للأرقام، يجعلها غير واضحة).

## الخطة

### 1. إضافة خط رقمي واضح
في `tailwind.config.ts`: إضافة عائلة جديدة
```ts
numeric: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif']
```
(Plus Jakarta Sans محمّل أصلاً، أرقامه نظيفة وواضحة جداً)

### 2. استبدال `font-display` بـ `font-numeric` في مواضع الأرقام فقط
- `WizardStepper.tsx`: أرقام الخطوات (Desktop + Mobile) + إرجاع الأحجام للسابق (`w-11 h-11 text-sm` و `text-xl`)
- `TravelerCounter.tsx`: رقم العداد + إرجاع الحجم للسابق (`text-3xl` بدل `text-4xl`)
- `PriceSummaryCard.tsx`: المبالغ (breakdown + serviceTotal + governmentTotal + grandTotal) + إرجاع الإجمالي للحجم السابق (`text-xl sm:text-2xl`)

### الملفات
- `tailwind.config.ts`
- `src/components/apply/WizardStepper.tsx`
- `src/components/apply/TravelerCounter.tsx`
- `src/components/apply/PriceSummaryCard.tsx`

النتيجة: نفس الأحجام السابقة، لكن بخط أرقام نظيف وواضح بدلاً من خط Syne المزخرف.
