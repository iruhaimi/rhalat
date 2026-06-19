## الهدف
صفحة `/apply` تظهر كاملة (Hero + Stepper + محتوى الخطوة + ملخص السعر + زر التالي) في الشاشة بدون تمرير على الديسكتوب.

## التغييرات

### 1. `src/pages/Apply.tsx` — تقليص الـ chrome
- Hero `py-8 sm:py-12` → `py-4 sm:py-5`
- العنوان `text-2xl sm:text-4xl` → `text-lg sm:text-2xl`
- وصف الدولة `mt-2 text-sm sm:text-base` → `mt-1 text-xs sm:text-sm`
- Stepper container `-mt-6 sm:-mt-8` → `-mt-3 sm:-mt-4`، `py-2 sm:py-3` → `py-1.5 sm:py-2`
- Content `py-6 sm:py-10 pb-24 sm:pb-12` → `py-3 sm:py-4 pb-20 sm:pb-6`
- بطاقة المحتوى `p-5 sm:p-8 md:p-10` → `p-4 sm:p-5 md:p-6`
- `rounded-4xl` → `rounded-3xl`

### 2. `WizardStepper.tsx` — تكثيف
- Desktop wrapper `py-4 sm:py-5` → `py-2`
- التسميات تحت الدوائر `mt-2` → `mt-1`

### 3. `Step2VisaDetails.tsx` — تقليل المسافات الرأسية
- `space-y-4 sm:space-y-6` → `space-y-3`
- رأس الخطوة: إخفاء العنوان والوصف على الديسكتوب (موجود في Stepper) أو تقليل `mb-4 sm:mb-8` → `mb-2`، حجم `text-xl sm:text-2xl` → `text-lg sm:text-xl`، الوصف `mt-2` → `mt-0.5`
- البطاقة الموحدة `p-4 sm:p-5 space-y-4` → `p-3 sm:p-4 space-y-3`
- ارتفاع الـ Select/DatePicker `h-12` → `h-10`
- disclaimer `p-3` → `p-2`، `text-xs sm:text-sm` يبقى لكن `leading-relaxed` → `leading-snug`
- شبكة العدّادات `gap-3` → `gap-2`
- زر التالي pt-4 sm:pt-6 → pt-2 sm:pt-3

### 4. `TravelerCounter.tsx` — بطاقة مدمجة
- `p-4` → `p-2.5`، `gap-3` → `gap-2`
- اسم `text-base` → `text-sm`، إخفاء الـ description (`hidden`) للتوفير
- سعر الشخص يبقى `text-xs`
- العدّاد: الرقم `text-3xl` → `text-2xl`، الأزرار `h-11 w-11` → `h-9 w-9`، الأيقونات `h-5 w-5` → `h-4 w-4`

## الملفات
- `src/pages/Apply.tsx`
- `src/components/apply/WizardStepper.tsx`
- `src/components/apply/steps/Step2VisaDetails.tsx`
- `src/components/apply/TravelerCounter.tsx`

## ملاحظة
الخطوات الأخرى (Requirements/Documents/Payment) تحتوي بطبيعتها على قوائم طويلة قد تحتاج تمرير. التغيير يستهدف خطوة "تفاصيل التأشيرة" الافتراضية لتلائم الشاشة، والـ chrome العام يستفيد منه باقي الخطوات.
