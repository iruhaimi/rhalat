## خطة: تصفير المستخدمين وإنشاء مالك جديد

### تحذير مهم
هذه عملية مدمرة لا يمكن التراجع عنها. سيتم حذف **جميع** المستخدمين (موظفين + عملاء + وكلاء + مشغلي سياحة) مع كل بياناتهم المرتبطة (الطلبات، الإشعارات، المحافظ، الرسائل، السجلات…).

### الخطوات

1. **حذف جميع المستخدمين من `auth.users`**
   - بفضل قيود `ON DELETE CASCADE` سيتم تلقائياً مسح:
     - `profiles`, `user_roles`, `staff_permissions`
     - `applications`, `application_documents`, `application_messages`, `application_notes`, `application_status_history`
     - `notifications`, `payments`, `refund_requests`, `wallet_transactions`
     - `agent_transfer_requests`, `agent_work_submissions`
     - `staff_2fa_codes`, `staff_recovery_codes`, `staff_login_attempts`, `account_unlock_requests`
     - `tour_operators`, `tour_bookings`, `tour_program_reviews`
     - بقية الجداول المرتبطة

2. **تعطيل مؤقت لمحفز `enforce_minimum_admins` و `enforce_minimum_super_admins`**
   - مطلوب لأنهما يمنعان حذف آخر مالك/مشرف. سيتم إعادة تفعيلهما بعد إنشاء المالك الجديد.

3. **إنشاء حساب المالك الجديد**
   - الإيميل: `ibrahim@rhalat.com`
   - كلمة المرور: `Ibra1983@`
   - يتم إدراجه مباشرة في `auth.users` مع `email_confirmed_at` (مفعّل فوراً بدون تأكيد إيميل)
   - تشغيل `handle_new_user()` تلقائياً ينشئ profile + دور `customer`
   - بعدها: إضافة دور `admin` في `user_roles` + صلاحية `manage_staff` في `staff_permissions` (لجعله Super Admin / مالك 👑)
   - حذف دور `customer` المضاف تلقائياً

4. **إعادة تفعيل المحفزات الأمنية**

### بعد التنفيذ
يمكنك تسجيل الدخول من بوابة الموظفين (`/portal-x7k9m2`) بالإيميل والباسوورد أعلاه. لن يكون هناك أي مستخدم آخر في النظام.

### تأكيد مطلوب
هل تريد المتابعة فعلاً؟ سيتم مسح **كل البيانات** المرتبطة بالمستخدمين (طلبات، مدفوعات، رسائل، إلخ) بشكل نهائي.
