# خطة تحسين المساعد الذكي

## 1. اختبار حي لأدوات RPC
- فتح `/admin/ai-assistant` وإرسال سؤالين تجريبيين:
  - **قراءة**: "كم عدد الطلبات المعلقة آخر 7 أيام؟" — يفترض استدعاء `ai_query_applications`.
  - **بحث**: "ابحث عن تأشيرة فرنسا" — يفترض استدعاء `lookup_visa`.
- مراقبة لوجز Edge Function `admin-ai-agent` للتأكد من نجاح التوول كولينج وعدم رجوع `access_denied`.
- إصلاح أي خطأ يظهر (مثلاً انعدام صلاحية `manage_applications` للمالك → نضيف bypass لـ `is_super_admin`).

## 2. صفحة سجل المحادثات السابقة
- صفحة جديدة: `src/pages/admin/AIAssistantHistory.tsx` على المسار `/admin/ai-assistant/history`.
- تعرض كل المحادثات (جدول): العنوان، تاريخ آخر تحديث، عدد الرسائل، عدد استدعاءات الأدوات.
- نقر على محادثة → drawer/ صفحة تفصيلية تعرض كل الرسائل بالترتيب مع تمييز رسائل الأدوات (اسم الأداة + JSON النتيجة).
- زر "فتح في المساعد" لاستئناف المحادثة.
- زر "حذف المحادثة" (Super Admin فقط) مع تأكيد.
- ربط زر في الشريط الجانبي للمساعد: "📜 السجل".

## 3. تشديد صلاحيات المالك
- **Frontend**: `AIAssistant.tsx` و`AIAssistantHistory.tsx` يستخدمان `isSuperAdmin` فقط (موجود) + إعادة توجيه لو `false`.
- **Route guard**: إضافة wrapper في `App.tsx` يتحقق من `is_super_admin` قبل عرض الصفحة.
- **Edge Function**: التحقق الحالي من `is_super_admin` كافٍ، نضيف:
  - تحقق إضافي من أن `auth.users.banned_until` فارغ.
  - تسجيل محاولات وصول مرفوضة في `staff_audit_log` (event_type: `ai_access_denied`).
- **DB**: التأكد أن RLS على `ai_assistant_conversations` و`ai_assistant_messages` يقتصر على `is_super_admin(auth.uid())` (لا يكفي `user_id = auth.uid()` لأن أي مستخدم قد يُدرج).

## 4. تنقية المدخلات وقائمة الأدوات المسموحة
- **Edge Function سيرفر-سايد**:
  - حد أقصى للرسالة: 4000 حرف (موجود) + رفض إذا احتوت على أنماط حقن (مثل `\x00`, `</script>`, روابط `data:` كبيرة).
  - **Allow-list** صريحة لأسماء الأدوات في `ALLOWED_TOOLS = Set([...])`؛ أي `tool_call.function.name` خارجها → نتجاهله ونسجل تحذير.
  - تحقق من المعاملات بـ Zod قبل تمريرها لـ RPC (مثلاً `new_price` بين 1 و100000، `days_back` بين 1 و365).
  - Rate limit: 30 رسالة/دقيقة لكل مالك (عبر جدول `ai_assistant_rate_limit` بسيط أو فحص آخر 60 ثانية في `ai_assistant_messages`).
- **Frontend**: تنظيف `input` من أحرف تحكم قبل الإرسال + حد العدّاد المرئي.

## 5. سجل تدقيق لكل استدعاء أداة
- إضافة جدول `ai_tool_invocations` بأعمدة: `id, user_id, conversation_id, message_id, tool_name, arguments jsonb, result jsonb, success bool, error text, duration_ms int, created_at`.
- GRANT + RLS: قراءة فقط لـ Super Admin؛ كتابة عبر service_role من Edge Function.
- في `admin-ai-agent/index.ts` بعد كل `executeTool`:
  - حساب `Date.now()` قبل/بعد.
  - INSERT في `ai_tool_invocations` + استدعاء `log_staff_action` بـ `event_type='ai_tool_invocation'` و`event_category='ai_assistant'`.
- صفحة جديدة `src/pages/admin/AIToolAuditLog.tsx` على `/admin/ai-assistant/audit`:
  - جدول مفلتر حسب: اسم الأداة، النجاح/الفشل، التاريخ.
  - يعرض الـ JSON arguments/result بشكل قابل للطي.
  - تصدير CSV.
- ربط الصفحة في sidebar تحت "المساعد الذكي".

## تفاصيل تقنية

### تغييرات قاعدة البيانات (Migration واحدة)
```sql
-- 1. Allow super admin RLS on conversations/messages (تشديد)
DROP POLICY IF EXISTS ... ON ai_assistant_conversations;
CREATE POLICY ai_conv_owner_only ON ai_assistant_conversations
  FOR ALL TO authenticated
  USING (is_super_admin(auth.uid()))
  WITH CHECK (is_super_admin(auth.uid()) AND user_id = auth.uid());

-- 2. Tool invocation audit table
CREATE TABLE public.ai_tool_invocations (...);
GRANT SELECT ON public.ai_tool_invocations TO authenticated;
GRANT ALL ON public.ai_tool_invocations TO service_role;
ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_audit_super_admin_read ON ai_tool_invocations
  FOR SELECT TO authenticated USING (is_super_admin(auth.uid()));

-- 3. Bypass للمالك في دوال ai_* (السماح للمالك بتنفيذ كل أداة دون اشتراط permission محدد)
-- تعديل ai_query_applications, ai_agent_performance... ليكون:
--   IF NOT (is_super_admin(auth.uid()) OR has_permission(auth.uid(), '...')) THEN
```

### ملفات جديدة
- `src/pages/admin/AIAssistantHistory.tsx`
- `src/pages/admin/AIToolAuditLog.tsx`

### ملفات معدّلة
- `supabase/functions/admin-ai-agent/index.ts` (allow-list، Zod، logging، rate limit)
- `src/pages/admin/AIAssistant.tsx` (زر للسجل، تنظيف input، عداد أحرف)
- `src/components/admin/AdminLayout.tsx` (روابط جديدة sub-menu)
- `src/App.tsx` (route جديدتان)

### اختبار نهائي
- بعد التطبيق: إعادة فتح `/admin/ai-assistant`، إرسال 3 طلبات (قراءة + تعديل سعر مع رفض التأكيد + بحث)، ثم زيارة `/admin/ai-assistant/audit` للتأكد من تسجيل كل استدعاء.
