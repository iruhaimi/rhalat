# خطة: اختبار وتحسين نظام مراسلات الطلبات

## 1) اختبار إشعارات رسائل الإدارة والوكلاء (تحقق فعلي)

سيتم اختبار trigger `notify_on_new_message` مباشرة على قاعدة البيانات عبر:

- إنشاء رسالة اختبارية بـ `sender_type='admin'` على طلب فعلي → التحقق من:
  - وصول صف في `notifications` لمالك الطلب (`applications.user_id`).
  - أن `action_url` = `/track?id={application_id}` وأن العنوان يحتوي "رسالة جديدة من الإدارة".
- إنشاء رسالة بـ `sender_type='agent'` → التحقق من وصول إشعار للعميل (مالك الطلب) بنفس الرابط.
- إنشاء رسالة بـ `sender_type='customer'` → التحقق من وصول إشعار للوكيل المعيّن `assigned_agent_id` بـ `action_url=/agent/applications/{id}`.
- التحقق من أن `unreadCount` في الواجهة يتحدّث فوراً عبر اشتراك Realtime الموجود في `useApplicationMessages.ts` (postgres_changes على `application_messages`).

سيتم حذف صفوف الاختبار بعد التحقق حتى لا تترك ضوضاء.

## 2) ميزة "وضع علامة كمقروء" يدوياً

حالياً `markAsRead()` تُستدعى تلقائياً عند فتح اللوحة (سطر 80-85 من `ApplicationMessages.tsx`)، لكن لا يوجد زر صريح. سيتم:

- إضافة زر "تعليم الكل كمقروء" في رأس واجهة `ApplicationMessages` يظهر فقط حين `unreadCount > 0`.
- إضافة زر صغير لكل رسالة واردة غير مقروءة لتعليمها فردياً (يستدعي UPDATE على صف واحد).
- تأكيد أن سياسات RLS الحالية تكفي لكل دور:
  - عميل: `Customers can mark messages as read` ✓
  - وكيل: `Agents can mark messages as read` ✓
  - إدارة: `Admins can mark messages as read` ✓
- بعد UPDATE، يقوم اشتراك Realtime القائم بمزامنة `is_read` لدى الطرف الآخر بدون أي تعديل إضافي.

## 3) تشديد أمان `notify_on_new_message`

التحذير الذي يصدره Linter عادةً للدوال `SECURITY DEFINER` هو غياب `search_path` ثابت أو امتلاكها صلاحيات أوسع من اللازم. الدالة الحالية بالفعل تستخدم `SET search_path = public`، لكن سنطبّق التشديد التالي:

- إبقاء `SECURITY DEFINER` لأن الدالة تكتب في `notifications` نيابة عن المُرسِل (RLS لجدول الإشعارات تمنع المستخدم العادي من إنشاء إشعار لمستخدم آخر).
- سحب صلاحية `EXECUTE` من `PUBLIC` و`anon`، ومنحها فقط لـ `authenticated` (أو حصرها على `service_role` إذا اكتفينا بأنها تُستدعى فقط من trigger — وهو ما لا يحتاج EXECUTE من المستخدم أصلاً).
- إضافة فحص دفاعي داخل الدالة: التأكد من أن `NEW.sender_id = get_profile_id(auth.uid())` عند وجود `auth.uid()` (دفاع في العمق فوق RLS الذي يفرض ذلك بالفعل).
- إعادة تشغيل Supabase Linter للتأكد من اختفاء التحذير، ومعالجة أي تحذير إضافي يظهر على الدوال المرتبطة.

## ملفات سيتم تعديلها

- `src/components/messages/ApplicationMessages.tsx` — زر "تعليم الكل كمقروء" + زر فردي.
- `src/hooks/useApplicationMessages.ts` — تصدير `markOneAsRead(messageId)`.
- migration جديدة — تحديث `notify_on_new_message` (دفاع في العمق + تقييد `EXECUTE`).

## غير مشمول

- لن يتم تغيير منطق التوجيه (admin → عميل / customer → وكيل) لأنه مطلوب كما هو.
- لن يتم لمس RLS لجدول `application_messages` (تم ضبطها في الجولة السابقة).
