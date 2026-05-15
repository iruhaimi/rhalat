## السبب الجذري لكل مشكلة

### 1) "الموظفون الجدد لا يظهرون في القائمة"
ليس هناك حد أقصى للعرض. فحصت قاعدة البيانات وسجلات Edge Function:
- آخر موظف أنشأته فعلاً هو **anas** بدور `tour_operator` (وكيل سياحي).
- شاشة "الموظفون (المشرفين والوكلاء)" تستخدم فلتر صريح في `UsersManagement.tsx` (سطر 437):
  ```ts
  const isStaff = u.roles.includes('admin') || u.roles.includes('agent');
  ```
  أي أن **tour_operator مستبعد عمداً** من تبويب الموظفين، لذلك anas لا يظهر مع أنه أُنشئ بنجاح.
- أيضاً Edge Function نجحت في إنشاء المستخدم لكن **إيميل الترحيب فشل** (Resend في وضع testing — يسمح فقط بالإرسال إلى `iruhaimii@gmail.com`). هذا لا يمنع الإنشاء لكنه يربك المستخدم.

### 2) "تنسيق الأعمدة غير مرتب"
في `StaffUsersTable.tsx`:
- لا يوجد `colgroup` أو `width` ثابت لكل عمود → كل صف يحسب عرض الخلية حسب محتواه (الصف الذي فيه شارتان "مالك + مشرف" يدفع الأعمدة)
- البريد الإلكتروني يحوي زر نسخ يظهر فقط عند hover → يغيّر العرض الحقيقي
- الجوال LTR داخل خلية RTL بدون عرض ثابت
- نفس المشكلة موجودة في جداول أخرى (CustomersTable, ApplicationsList, AgentApplicationsList, TourProgramsManagement, RefundRequestsManagement, OffersManagement, EmailLogsManagement, LoginAttemptsManagement, UnlockRequestsManagement, AgentRequestsManagement, StaffAuditLog, DocumentAccessLogs)

---

## الخطة

### المرحلة 1 — إصلاح ظهور الموظفين (سريع، عالي الأولوية)

1. **توسيع تبويب "الموظفون" ليشمل tour_operator**
   `src/pages/admin/UsersManagement.tsx`:
   - تعديل فلتر `staff`: `admin || agent || tour_operator`
   - تعديل `customers`: استبعاد tour_operator أيضاً
   - إضافة بطاقة إحصائية جديدة "وكلاء سياحيون" بجانب المشرفين/الوكلاء
   - تحديث عنوان التبويب إلى "الموظفون (المشرفون، الوكلاء، الوكلاء السياحيون)"

2. **تحسين رسائل النجاح/الخطأ في `CreateStaffDialog`**
   - عند نجاح الإنشاء مع فشل الإيميل: toast تحذيري واضح "تم إنشاء الحساب لكن لم يُرسل إيميل الإعداد — استخدم Reset Password يدوياً"
   - استدعاء `fetchUsers()` فوراً بعد الإنشاء (موجود لكن نتأكد)

3. **(اختياري الآن، توصية لاحقاً)** ربط Resend بدومين `visafaster.com` لإنهاء قيود وضع testing.

### المرحلة 2 — توحيد تنسيق الجداول الإدارية

إنشاء **مكون موحّد** `src/components/admin/AdminTable.tsx` يطبّق:
- `table-fixed` + `colgroup` بعروض محددة لكل عمود
- ارتفاع صف ثابت `h-16` ومحاذاة عمودية موحدة
- خلية الإجراءات (`...`) بعرض ثابت `w-[60px]`
- خلية الأفاتار/الاسم بعرض `w-[260px]` مع truncation
- خلية البريد بعرض `w-[280px]` مع truncation وزر نسخ **دائم الظهور** (بدون hover)
- خلية الجوال بعرض `w-[140px]` مع `dir="ltr"` و `tabular-nums`
- خلية التاريخ بعرض `w-[160px]` مع `whitespace-nowrap`
- خلية الشارات بعرض `min-w-[140px]` مع `flex-wrap` لكن العرض ثابت

**تطبيق التحديث على الجداول التالية بنفس النمط:**

```text
src/components/admin/StaffUsersTable.tsx
src/components/admin/CustomersTable.tsx
src/pages/admin/ApplicationsList.tsx
src/pages/admin/RefundRequestsManagement.tsx
src/pages/admin/OffersManagement.tsx
src/pages/admin/EmailLogsManagement.tsx
src/pages/admin/LoginAttemptsManagement.tsx
src/pages/admin/UnlockRequestsManagement.tsx
src/pages/admin/AgentRequestsManagement.tsx
src/pages/admin/StaffAuditLog.tsx
src/pages/admin/DocumentAccessLogs.tsx
src/pages/admin/TourProgramsManagement.tsx
src/pages/agent/AgentApplicationsList.tsx
```

كل جدول يحصل على:
- `<colgroup>` بعروض ثابتة لكل عمود
- صف header بنفس النمط البصري (نفس الـ padding، نفس tracking، نفس الـ background)
- صفوف بنفس الارتفاع وحدود سفلية موحدة
- responsive: على الشاشات < 1024px نخفي أعمدة ثانوية بدلاً من scroll أفقي يكسر التنسيق

### المرحلة 3 — التحقق

- فحص بصري لكل جدول إداري بعد التعديل (browser screenshot)
- اختبار إنشاء موظف tour_operator والتأكد من ظهوره فوراً
- التأكد من عدم وجود `console errors` بعد التغييرات

---

## التفاصيل التقنية

| الملف | التغيير |
|---|---|
| `UsersManagement.tsx` | فلتر staff يشمل tour_operator + إحصائية جديدة + عنوان التبويب |
| `CreateStaffDialog.tsx` | toast تحذيري عند فشل الإيميل + التأكد من refresh |
| `components/admin/AdminTable.tsx` (جديد) | wrapper يفرض `table-fixed` و colgroup موحد |
| كل الجداول الإدارية أعلاه | إعادة هيكلة الأعمدة بعروض ثابتة وارتفاع موحد |

**خارج النطاق الآن:** التحقق من دومين Resend (يحتاج إعداد DNS من المستخدم)، ولن أعيد كتابة منطق الجداول — فقط طبقة العرض.