## المشكلة

1. **الوكيل السياحي عالق على "بانتظار اعتماد الإدارة"** بدون أي واجهة موافقة في لوحة المدير.
   - الكود في `src/pages/tourism-portal/Dashboard.tsx` يفحص `tour_operators.is_verified`، وإذا `false` يعرض الرسالة.
   - في قاعدة البيانات يوجد سجلان معلقان (`is_verified=false`):
     - `dwfts1@gmail.com` (anas)
     - `iruhaimi@hotmail.com` (ibrahim alruhaimi)
   - بحثت في `src/pages/admin/` فلا توجد أي صفحة لإدارة `tour_operators` أو الموافقة عليهم. صفحة `TourProgramsManagement` تدير البرامج فقط، لا حسابات الوكلاء.
   - ولذلك المدير لا يجد طلبًا ليوافق عليه.

2. **الوكلاء السياحيون لا يظهرون في قائمة الموظفين** رغم أن الفلتر في `UsersManagement` يضمّ `tour_operator`. سبب اختفائهم في الصورة: لا يوجد طريقة في الواجهة لإظهار حالة "بانتظار التفعيل" بجانب اسم الوكيل السياحي، فيظنّ المستخدم أنهم غير مضافين. (السجلات موجودة فعلًا في DB.)

3. **عدم تطابق ترتيب رؤوس الأعمدة مع الصفوف** في `AdminTable`: عناصر `<TableHeader>` تُعرض RTL بينما `<TableBody>` يُعرض LTR لأن الجدول لا يفرض `dir="rtl"` صراحة على وسم `<table>`، فيرث الاتجاه من سياقات مختلفة بحسب موضع الجدول.

---

## الخطة

### 1) صفحة "اعتماد الوكلاء السياحيين" في لوحة الإدارة

ملف جديد: `src/pages/admin/TourOperatorsApproval.tsx`
- يجلب من `tour_operators` كل السجلات مع `profiles.full_name` و`email`.
- بطاقة إحصائية في الأعلى: عدد المعلّقة، عدد المعتمدة، الإجمالي.
- جدول باستخدام `AdminTable` يعرض: الشركة، البريد، رقم الجوال، تاريخ التسجيل، الحالة (معلّق/معتمد)، إجراءات.
- زرّان لكل صف: **اعتماد** (يحدّث `is_verified=true`) و**رفض/تعطيل** (يحدّث `is_verified=false` أو يعرض حوار حذف).
- إشعار realtime/refetch بعد كل تغيير.

تعديل `src/App.tsx`: مسار `/admin/tour-operators` محمي بدور `admin`.

تعديل sidebar الإدارة (`src/components/admin/AdminLayout.tsx` أو ما يعادله) لإضافة عنصر "اعتماد الوكلاء السياحيين" مع badge بعدد المعلّقة.

تعديل RLS عند الحاجة: التحقق أن `tour_operators` تسمح للمشرف بقراءة وتحديث جميع السجلات. سأفحص السياسات الحالية وأضيف:
```sql
CREATE POLICY "Admins manage all tour operators"
  ON public.tour_operators FOR ALL
  USING (is_admin(auth.uid()))
  WITH CHECK (is_admin(auth.uid()));
```
(فقط إذا لم تكن موجودة.)

### 2) تمييز الوكلاء السياحيين في قائمة الموظفين

في `src/components/admin/StaffUsersTable.tsx`:
- إن كان الدور `tour_operator` ولم يكن لديه سجل `tour_operators.is_verified=true`، تُعرض شارة صفراء "بانتظار التفعيل" بجانب البادج.
- زر سريع "اعتماد" داخل قائمة الإجراءات (DropdownMenu) إذا لم يكن معتمدًا.

سيتطلب جلب `is_verified` ضمن `fetchUsers` في `UsersManagement.tsx` (join بسيط على `tour_operators`).

### 3) إصلاح اتجاه الجدول

في `src/components/admin/AdminTable.tsx`:
- إضافة `dir="rtl"` على `<div>` الخارجي و`<Table>` لضمان أن `<TableHeader>` و`<TableBody>` يتشاركان الاتجاه نفسه ويتطابق ترتيب رؤوس الأعمدة مع الصفوف.
- التأكد أن `text-right` تظل سارية للرؤوس بعد twMerge.

سأطبّق `dir="rtl"` بشكل افتراضي مع إمكانية تجاوزه عبر prop `dir` للمستقبل.

### 4) إشعار للمدير عند تسجيل وكيل سياحي جديد

- إدراج صف في `notifications` (إن وُجد الجدول) عند إنشاء `tour_operators` جديد عبر trigger، أو تجاهلها لاحقًا. (سأتحقق من وجود نظام الإشعارات قبل تطبيقها.)

---

## الملفات المتوقع تعديلها/إنشاؤها

```text
+ src/pages/admin/TourOperatorsApproval.tsx          (جديد)
~ src/App.tsx                                          (مسار جديد)
~ src/components/admin/AdminLayout.tsx                (عنصر sidebar + badge)
~ src/components/admin/AdminTable.tsx                 (dir="rtl")
~ src/components/admin/StaffUsersTable.tsx            (شارة بانتظار التفعيل)
~ src/pages/admin/UsersManagement.tsx                 (جلب is_verified)
+ supabase migration                                  (RLS لو نقصت + trigger إشعار اختياري)
```

---

## التحقق بعد التطبيق

1. تسجيل الدخول كمشرف → فتح `/admin/tour-operators` → ظهور الوكيلين المعلّقين (`anas`, `ibrahim alruhaimi`) → الضغط على "اعتماد".
2. تسجيل الدخول كـ `dwfts1@gmail.com` → اختفاء بطاقة "بانتظار الاعتماد" من لوحة الوكيل السياحي.
3. فحص قائمة الموظفين → ظهور الوكلاء السياحيين مع شارة "بانتظار التفعيل" قبل الموافقة.
4. التحقق من تطابق ترتيب أعمدة الجدول: رأس "الموظف" يقع فوق عمود الأفاتار، "إجراءات" فوق زر `…`، إلخ.
