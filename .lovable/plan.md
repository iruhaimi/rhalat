## Plan: إصلاح اختفاء محتوى الفوتر على الموقع المنشور

### السبب
محتوى الفوتر (روابط سريعة، السياسات، تواصل معنا، الوصف) يُقرأ من جدول `footer_settings` في قاعدة البيانات. في البريفيو أنت مسجّل دخول كمسؤول، لذا تظهر البيانات. أما الزوّار غير المسجّلين على الموقع الرسمي فيحصلون على خطأ:

```
permission denied for function is_super_admin
```

السبب: سياسة RLS `"Super admins can manage footer settings"` معرّفة كـ `FOR ALL`، وهذا يجعلها تُستدعى حتى عند الـ SELECT للزائر العام، فتفشل لأن `anon` لا يملك صلاحية تنفيذ الدالة `is_super_admin`. كما أن جدول `footer_settings` لا يملك `GRANT SELECT` للأدوار `anon` و `authenticated`.

### الحل (Migration واحد)

1. حذف سياسة `"Super admins can manage footer settings"` (التي تستخدم `FOR ALL`).
2. إنشاء ثلاث سياسات منفصلة بديلة للمشرفين فقط:
   - `FOR INSERT` بشرط `is_super_admin(auth.uid())`
   - `FOR UPDATE` بنفس الشرط
   - `FOR DELETE` بنفس الشرط
3. إبقاء سياسة `"Anyone can view active footer settings"` كما هي (SELECT للجميع عندما `is_active = true`).
4. إضافة الصلاحيات الناقصة:
   ```
   GRANT SELECT ON public.footer_settings TO anon, authenticated;
   GRANT INSERT, UPDATE, DELETE ON public.footer_settings TO authenticated;
   GRANT ALL ON public.footer_settings TO service_role;
   ```

### النتيجة
- الزوّار غير المسجّلين سيشاهدون نفس الفوتر الكامل الذي يظهر في البريفيو.
- الإدارة (Super Admin) ستبقى قادرة على التعديل من لوحة `/admin/footer`.
- لا تغييرات في الكود الأمامي مطلوبة.

### الملفات
- ملف Migration جديد ضمن `supabase/migrations/`.