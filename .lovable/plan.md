## المشكلة

السبب أن الحقول لا تظهر في صف واحد على `/apply?country=SCHENGEN`:

عندما يأتي المستخدم من صفحة شنغن، يتم إخفاء حقل اختيار الدولة (`isSchengenFromUrl=true`)، فيتبقى عمودان فقط (نوع التأشيرة + تاريخ السفر). ثم يظهر اختيار "دولة شنغن" كصف منفصل تحت الكل (border-t).

الخط الحالي للأرقام يستخدم `font-display font-black` لكن المستخدم يريد تمييزاً أوضح.

## الخطة

### 1. `Step2VisaDetails.tsx` — إصلاح صف الحقول الثلاثة
- استبدال `Select` المخفي (عند `isSchengenFromUrl`) بحقل اختيار دولة شنغن **داخل نفس الـ grid** بدلاً من أسفله
- إزالة كتلة "Schengen Country Selection" المنفصلة (السطور 304–334)
- النتيجة: عند الدخول من شنغن، الصف يحتوي: [دولة شنغن] [نوع التأشيرة] [تاريخ السفر]
- عند الدخول العادي: [الوجهة] [نوع التأشيرة] [تاريخ السفر]، وإذا اختار شنغن يتحول العمود الأول لاختيار دولة الشنغن

### 2. تحسين خط الأرقام
- **WizardStepper (Desktop)**: حجم الدوائر `w-11 h-11` → `w-12 h-12`، خط الرقم `text-sm` → `text-lg`، إضافة `tabular-nums`
- **WizardStepper (Mobile)**: الرقم الكبير `text-xl` → `text-2xl tabular-nums`
- **TravelerCounter**: الرقم من `text-3xl font-display font-black` → `text-4xl font-display font-black tabular-nums` مع `tracking-tight`
- **PriceSummaryCard**: التحقق من الأرقام وإضافة `tabular-nums font-display` للمبالغ

### الملفات المتأثرة
- `src/components/apply/steps/Step2VisaDetails.tsx`
- `src/components/apply/WizardStepper.tsx`
- `src/components/apply/TravelerCounter.tsx`
- `src/components/apply/PriceSummaryCard.tsx` (فحص فقط)

هل تعتمد الخطة؟
