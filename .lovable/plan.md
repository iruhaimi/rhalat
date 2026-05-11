# خطة إعادة بناء بوابة وكلاء السياحة

## الوضع الحالي
- جداول قاعدة البيانات (`tour_operators`, `tour_programs`, `tour_bookings`, `tour_operators_public`) موجودة وسليمة مع RLS.
- الدور `tour_operator` موجود في enum، ودالة `is_tour_operator` و trigger `auto_create_tour_operator` جاهزان.
- **لا توجد أي صفحات أو مسارات في الواجهة** — هذا ما سنعيد بناءه.

## الأهداف
1. الأدمن ينشئ حساب وكيل سياحي من `/admin/users` (تبويب جديد) ويعتمده.
2. الوكيل يدخل من نفس بوابة الموظفين `/portal-x7k9m2` (نفس فلو CAPTCHA + 2FA).
3. الوكيل يصل إلى **لوحة منفصلة تمامًا** عن لوحة الأدمن/وكلاء التأشيرات — لا يرى الطلبات أو العملاء أو أي بيانات حساسة.
4. الوكيل يدير: ملف شركته + برامجه السياحية (إضافة/تعديل/حذف، رفع صور، تسعير).
5. كل برنامج يمر بحالة `pending → approved/rejected` يعتمدها الأدمن.
6. الزوار يرون البرامج المعتمدة في `/tourism` (قسم عام جديد).

## المخطط

```text
Admin (/admin/users → tab "وكلاء السياحة")
  ├── إنشاء حساب → trigger يضيف tour_operators record
  ├── اعتماد/تعليق الشركة (is_verified)
  └── /admin/tour-programs → اعتماد/رفض البرامج

Tour Operator (login via /portal-x7k9m2)
  └── /tourism-portal (لوحة مخصصة)
       ├── ملف الشركة (تعديل اسم، شعار، وصف، اتصال)
       ├── برامجي (CRUD على tour_programs)
       └── الحجوزات (read-only من tour_bookings)

Public
  └── /tourism (قائمة البرامج المعتمدة + فلاتر)
       └── /tourism/:programId (تفاصيل برنامج)
```

## التغييرات

### 1. توجيه الدخول (Routing & Auth)
- **`ProtectedRoute.tsx`**: إضافة دعم `'tour_operator'` ضمن `allowedRoles`.
- **`AuthContext.tsx`**: إضافة `isTourOperator` مشتقًا من `roles`.
- **`SecureStaffAuth.tsx`** (بوابة الموظفين): بعد نجاح 2FA، توجيه `tour_operator` إلى `/tourism-portal` بدلاً من `/admin` أو `/agent`.
- **`App.tsx`**: إضافة المسارات الجديدة:
  - `/tourism` و `/tourism/:id` (عام، داخل MainLayout)
  - `/tourism-portal/*` محمي بـ `allowedRoles={['tour_operator']}` مع `TourOperatorLayout`
  - `/admin/tour-programs` لإدارة الاعتماد

### 2. لوحة الوكيل السياحي (جديد)
- `src/components/tourism/TourOperatorLayout.tsx` — شريط جانبي مبسّط (RTL، Framer-motion):
  - 🏠 لوحة التحكم
  - 🏢 ملف الشركة
  - 🗺️ برامجي السياحية
  - 📋 الحجوزات
  - تسجيل خروج (يستدعي `signOut(true)`)
- `src/pages/tourism-portal/Dashboard.tsx` — إحصائيات (عدد البرامج، المعتمد، الحجوزات).
- `src/pages/tourism-portal/CompanyProfile.tsx` — تعديل بيانات `tour_operators` (نفس الوكيل فقط، عبر RLS الموجودة).
- `src/pages/tourism-portal/MyPrograms.tsx` — جدول + Dialog إنشاء/تعديل برنامج، رفع صور إلى bucket `avatars`.
- `src/pages/tourism-portal/MyBookings.tsx` — قراءة الحجوزات الخاصة ببرامجه.

### 3. صفحات الإدارة (Admin)
- **`UsersManagement.tsx`**: إضافة تبويب "وكلاء السياحة" يعرض جدول `tour_operators` مع زر اعتماد/تعليق (حقل `is_verified`)، وزر "إنشاء حساب وكيل سياحي" يفتح حوار يستخدم edge function جديد `create-tour-operator-user` (نسخة معدّلة من `create-staff-user` تعيّن دور `tour_operator`).
- `src/pages/admin/TourProgramsManagement.tsx` (جديد) — قائمة البرامج بحالاتها مع أزرار اعتماد/رفض/معاينة.
- **`AdminLayout.tsx`**: إضافة عنصر "البرامج السياحية" في الشريط الجانبي (مرئي للأدمن فقط).

### 4. الواجهة العامة
- `src/pages/Tourism.tsx` — صفحة `/tourism` تستعلم `tour_programs` المعتمدة JOIN `tour_operators_public`. فلاتر بسيطة (وجهة، سعر).
- `src/pages/TourismProgramDetail.tsx` — صفحة `/tourism/:id` مع زر "اطلب الآن" يفتح حوار حجز (يضيف صفًا في `tour_bookings`).
- **`HeaderArabic.tsx`** و**`FooterArabic.tsx`**: إضافة رابط "البرامج السياحية" → `/tourism`.

### 5. تغييرات قاعدة البيانات (Migration واحد)
- التأكد من وجود سياسات RLS لـ `tour_programs`:
  - وكيل يرى/يعدّل/يحذف برامجه فقط (`operator_id` يطابق `tour_operators.id` لـ `auth.uid()`).
  - أي شخص يرى البرامج التي `status='approved'`.
  - الأدمن يرى/يعدّل الكل.
- سياسات لـ `tour_bookings`: العملاء ينشئون، الوكيل يرى حجوزات برامجه فقط، الأدمن يرى الكل.
- سياسات Storage على bucket `avatars` لرفع شعارات البرامج تحت مجلد `tour-programs/{operator_id}/`.
- أي حقل ناقص (مثل `is_verified` على `tour_operators` إن لم يكن موجودًا، أو `status` على `tour_programs`).

### 6. منع تسرب الواجهات
- `TourOperatorLayout` لا يستورد أي مكون من `/admin` أو `/agent`.
- `ProtectedRoute` على مسارات `/admin` و`/agent` يبقى يرفض `tour_operator`.
- لا روابط في أي قائمة جانبية تظهر للوكيل السياحي إلى صفحات الموظفين الأخرى.

## ملاحظة شفافية
لم أحذف هذه البوابة عمدًا في أي من جلساتنا الأخيرة — التعديلات الأخيرة كانت على الأمان، RLS، QuickSettings، وبوابة الموظفين فقط. على الأرجح أن واجهة بوابة السياحة لم تكتمل سابقًا أو فُقدت في تراجع قبل هذه الجلسات. سنعيد بناءها كاملة الآن وفق ما اخترته.
