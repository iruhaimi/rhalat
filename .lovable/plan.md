تكثيف الخطوات 3 و4 و5 بنفس نهج الخطوات 1 و2 — تصغير الـ padding، المسافات، حجم الخطوط، أحجام الأزرار، وتحويل الصفوف العمودية إلى شبكات متجاورة حيث ممكن.

## التغييرات

### 1. `src/components/apply/PathChoiceCard.tsx` (الخطوة 3)
- `space-y-6` → `space-y-3`، `mb-6` → `mb-2`
- العنوان: `text-2xl mb-2` → `text-lg sm:text-xl mb-1`، الوصف `text-sm` → `text-xs sm:text-sm`
- بطاقة بيانات المستخدم: `p-4 space-y-1` → `p-2.5 space-y-0.5`, `text-sm` → `text-xs`
- بطاقة الهاتف المطلوب: `p-4 space-y-3` → `p-2.5 space-y-2`, الأيقونة `w-5 h-5` → `w-4 h-4`
- البطاقتان (Electronic / WhatsApp): `gap-4` → `gap-3`, `p-6` → `p-3 sm:p-4`, الأيقونة `w-12 h-12` → `w-10 h-10`, العنوان `text-lg` → `text-base`, `mb-3` → `mb-2`, القائمة `space-y-1.5` → `space-y-1`
- بطاقة الشروط: `p-4` → `p-2.5`, `text-sm` → `text-xs sm:text-sm`
- زر الرجوع: إضافة `h-9 text-sm`

### 2. `src/components/apply/steps/Step4Documents.tsx`
- `space-y-4 sm:space-y-6` → `space-y-3`, `mb-4 sm:mb-8` → `mb-2`
- العنوان: `text-xl sm:text-2xl` → `text-lg sm:text-xl`, `text-sm sm:text-base mt-2` → `text-xs sm:text-sm mt-0.5`
- شريط الرفع: `p-3 sm:p-4` → `p-2.5`
- شبكة المستندات: `gap-3 sm:gap-4` → `gap-2`, `sm:grid-cols-2` → `sm:grid-cols-2 lg:grid-cols-3`
- بطاقة المستند: `p-4` → `p-2.5`, الأيقونة `w-10 h-10` → `w-8 h-8`, `w-5 h-5` → `w-4 h-4`, `gap-3` → `gap-2`
- نص النوع: `font-medium` → `font-medium text-sm`
- نصائح: `p-4` → `p-2.5`, `space-y-1` → `space-y-0.5`, `text-sm` → `text-xs`
- أزرار التنقل: `h-12` → `h-10`, `pt-4 sm:pt-6` → `pt-2`

### 3. `src/components/apply/steps/Step6Payment.tsx` (الخطوة 5)
- `space-y-4 sm:space-y-6` → `space-y-3`, `mb-4 sm:mb-8` → `mb-2`
- العنوان: `text-xl sm:text-2xl` → `text-lg sm:text-xl`, الوصف mt-0.5 وأصغر
- الشبكة الرئيسية: `gap-4 sm:gap-6` → `gap-3`
- بطاقة الملخص (`CardContent p-4`) → `p-3`, `space-y-4` → `space-y-2.5`
- مجموعات الـ icon+label: `text-sm` يبقى لكن `space-y-2` → `space-y-1.5`
- بطاقة شفافية الرسوم: `p-4` → `p-2.5`, إعطاؤها `text-xs` بدل sm
- العمود الأيمن `space-y-3 sm:space-y-4` → `space-y-2.5`
- تنبيه نقص المستندات: `p-4` → `p-2.5`, الأيقونة `w-5 h-5` → `w-4 h-4`
- خيارات الدفع (RadioGroup): `space-y-2 sm:space-y-3` → `space-y-1.5`, `p-3 sm:p-4` → `p-2.5`, الأيقونات `w-5 h-5 sm:w-6 sm:h-6` → `w-5 h-5`
- شارات الأمان: `p-3 sm:p-4` → `p-2.5`, `mb-2 sm:mb-3` → `mb-1.5`
- زر الدفع: `h-12 sm:h-14` → `h-11 sm:h-12`, `text-base sm:text-lg` → `text-sm sm:text-base`
- بطاقة الشروط: `p-3 sm:p-4` → `p-2.5`

## النتيجة
الخطوات 3-4-5 تُصبح متناسقة مع الخطوتين 1-2: padding أصغر، شبكات أفقية حيث أمكن، خطوط أصغر، وأزرار `h-10/h-11` بدل `h-12/h-14` — مما يقلل التمرير بشكل كبير على شاشة 857px.