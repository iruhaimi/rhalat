إعادة تصميم صفحة `/apply` لتكون أكثر إحكاماً (compact) وبدون حاجة للتمرير للأسفل على الشاشات العادية.

## الملفات والتغييرات

### 1. `src/pages/Apply.tsx`
- تقليل `py-4 sm:py-5` → `py-2 sm:py-3` في الهيرو
- تقليل `-mt-3 sm:-mt-4` → `-mt-2 sm:-mt-3`
- تقليل `py-1.5 sm:py-2` → `py-1 sm:py-1` في بطاقة الـ stepper
- تقليل `py-3 sm:py-4 pb-20 sm:pb-6` → `py-2 sm:py-3 pb-16 sm:pb-4`
- تقليل `p-4 sm:p-5 md:p-6` → `p-3 sm:p-4 md:p-5`

### 2. `src/components/apply/steps/Step2VisaDetails.tsx`
- تقليل `space-y-3` → `space-y-2`
- تقليل `mb-2` → `mb-1` في العنوان
- تقليل `p-3 sm:p-4 space-y-3` → `p-2.5 sm:p-3 space-y-2` في البطاقة الموحدة
- تقليل `gap-3` → `gap-2` في شبكة الحقول
- تقليل ارتفاع `SelectTrigger` و `DatePicker` من `h-10` → `h-9`
- إخفاء/تقليل disclaimer ملاحظة السفر (`p-2` → `p-1.5`, `text-xs` فقط)
- عدادات المسافرين: `space-y-3` → `space-y-2`, البطاقات `gap-2` → `gap-1.5`
- إزالة/تقليل `pt-2 sm:pt-3` قبل أزرار التنقل
- تقليل ارتفاع زر التالي `h-12` → `h-10`

### 3. `src/components/apply/TravelerCounter.tsx`
- تقليل `p-2.5` → `p-2`
- تقليل `gap-2` → `gap-1`
- تقليل `h-9 w-9` → `h-8 w-8` للأزرار
- تقليل `text-2xl` → `text-xl` للرقم
- تقليل `rounded-2xl` → `rounded-xl`

### 4. `src/components/apply/PriceSummaryCard.tsx`
- تقليل `p-5 sm:p-6` → `p-3 sm:p-4`
- تقليل `mb-4` → `mb-2`, `p-4` → `p-2.5` في بطاقة الدولة
- تقليل `text-lg sm:text-xl` → `text-base sm:text-lg` في العنوان
- تقليل `my-3 sm:my-4` → `my-2 sm:my-3` في الفواصل
- تقليل `px-4 py-3` → `px-3 py-2` في شريط المجموع
- تقليل `text-xl sm:text-2xl` → `text-lg sm:text-xl` للمبلغ الإجمالي
- تقليل `mt-3 sm:mt-4` → `mt-2 sm:mt-3`

## النتيجة المتوقعة
جميع عناصر الصفحة (الدولة، نوع التأشيرة، التاريخ، عدادات المسافرين، ملخص السعر، وزر التالي) تظهر ضمن إطار الشاشة الواحد بدون scroll.