# خطة: تنظيف تحذيرات SECURITY DEFINER (63 → 0)

## الوضع الحالي (تم التحقق منه)
- التطبيق نظيف من ثغرات التبعيات (npm) ولا توجد نتائج أمنية معلقة عبر الماسحات.
- Supabase linter يُصدر 63 تحذيراً من نفس النوع فقط: **Public Can Execute SECURITY DEFINER Function**.
- استعلام `pg_proc` أكد أن 20 دالة `SECURITY DEFINER` قابلة للتنفيذ من دور `anon` (بدون تسجيل دخول).
- **هذه ليست ثغرات فعلية** — كل دالة تتحقق من الصلاحيات داخلياً — لكن Postgres/Supabase يُنبّه لأن السطح المكشوف يجب تقليصه (defense in depth).

## تصنيف الدوال الـ20 المكشوفة لـ anon

**فئة A — يجب أن تبقى متاحة لـ anon (لا تُعدَّل):**
- `submit_unlock_request` — يستخدمه موظف مقفول الحساب (بدون جلسة).
- `check_staff_portal_path` — يُفحص عبر `DynamicPortalRoute` قبل تسجيل الدخول.
- `has_role`, `is_admin`, `is_agent`, `get_profile_id` — تُستخدم داخل سياسات RLS التي تعمل تحت أدوار متعددة.
- `increment_blog_post_views` — عدّاد عام لصفحات المدونة.

**فئة B — أدوات AI (تتحقق داخلياً من super_admin لكن لا يوجد سبب لكشفها لـ anon):**
`ai_agent_performance`, `ai_bulk_notify`, `ai_query_applications`, `ai_toggle_offer`, `ai_update_site_content`, `ai_update_visa_price`
→ **إلغاء `EXECUTE` من `anon` والإبقاء لـ `authenticated`.**

**فئة C — دوال داخلية للـ backend/cron (لا يجب استدعاؤها من العميل مطلقاً):**
`delete_email`, `email_queue_dispatch`, `email_queue_wake`, `enqueue_email`, `move_to_dlq`, `read_email_batch`
→ **إلغاء `EXECUTE` من `anon` و`authenticated`، الإبقاء على `service_role` فقط.**

**فئة D — عمليات مستخدم مسجَّل:**
`create_whatsapp_order` — يتطلب `auth.uid()` داخلياً.
→ **إلغاء `EXECUTE` من `anon` والإبقاء لـ `authenticated`.**

## التنفيذ (Migration واحدة)

`REVOKE EXECUTE` من الأدوار غير اللازمة لكل دالة أعلاه، مع `GRANT EXECUTE` صريح للأدوار المطلوبة فقط. مثال:

```sql
REVOKE EXECUTE ON FUNCTION public.ai_toggle_offer(uuid, boolean) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.ai_toggle_offer(uuid, boolean) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
```

- دوال الفئة A لا تُلمس.
- الـ trigger functions المكشوفة (`auto_assign_customer_role`, `handle_new_user`, `notify_*`, `protect_*`, ...) لا يمكن استدعاؤها كـ RPC لأنها لا تأخذ معاملات — سنمنع `EXECUTE` عنها من `public` كخط دفاع إضافي.

## ما بعد التنفيذ
- تشغيل `supabase--linter` مجدداً للتأكد أن العدد أصبح 0 (أو بقيت فقط دوال الفئة A مبرَّرة).
- لا يوجد تأثير على واجهة المستخدم أو الوظائف — فقط تقليص للسطح المكشوف.

## غير مشمول
- لا تغييرات في UI/RLS/جداول جديدة.
- لا يمس متطلبات آبل (التطبيق جاهز أصلاً للنشر).
