## السبب الجذري

الموظف الجديد `dwfts1@gmail.com` تم إنشاؤه بدور **tour_operator** فقط.

دالة Edge `generate-staff-recovery-codes` تفحص حالياً:
```ts
if (!isAdmin && !isAgent) {
  return 403 'Forbidden: staff only'
}
```
ولا تشمل `tour_operator`، فترفض الطلب أثناء خطوة 2FA → الواجهة تعرض "Failed to generate recovery codes".

تأكدت من قاعدة البيانات: لا توجد رموز سابقة لهذا المستخدم (ليست مشكلة 409 conflict)، والدور الوحيد له هو `tour_operator`.

## الإصلاح

### 1) `supabase/functions/generate-staff-recovery-codes/index.ts`
- استدعاء `is_tour_operator` أيضاً، والسماح إذا تحقق أيٌّ من: `is_admin` أو `is_agent` أو `is_tour_operator`.
- بقاء بقية المنطق كما هو (التحقق من عدم وجود رموز سابقة، إنشاء 8 رموز، إدخالها بـ service role).

### 2) لا حاجة لتعديلات أخرى
- جدول `staff_recovery_codes` و RLS موجودة ومناسبة (الإدخال بـ service role).
- منطق الواجهة في `SecureStaffAuth.tsx` يعمل لجميع أدوار الموظفين بمجرد سماح الـ Edge Function.

## التحقق بعد التطبيق
1. نشر الدالة.
2. تسجيل دخول `dwfts1@gmail.com`، إدخال رمز 2FA → يجب أن تظهر شاشة رموز الاسترداد بنجاح.
3. التأكد من ظهور 8 رموز وحفظها في `staff_recovery_codes`.
