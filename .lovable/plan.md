# خطة: تقليل تحذيرات Supabase Linter بأمان

## 1) سياسات RLS الفضفاضة (USING/WITH CHECK = true)

تحذيران فقط:

- **`public.user_push_devices` — "Service role full access"**: السياسة `FOR ALL TO public USING (true) WITH CHECK (true)`. النية واضحة: استخدامها من service_role فقط، لكن الـ`role` خاطئ. سيتم استبدالها بـ:
  ```
  USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role')
  ```
  مع إبقاء سياسات المستخدم الحالية للقراءة/الكتابة على أجهزته. لن يكسر شيئاً لأن service_role يتجاوز RLS أصلاً.

- **`public.email_subscribers` — "Anyone can subscribe" (INSERT WITH CHECK true)**: مقصود — نموذج اشتراك عام في النشرة. سيتم تشديده بقيد بسيط بدلاً من `true`:
  ```
  WITH CHECK (length(email) BETWEEN 3 AND 320 AND email LIKE '%@%')
  ```
  ثم وضع علامة "تم الإصلاح" على التحذير.

## 2) "Public Can Execute SECURITY DEFINER Function"

التحذيرات الكثيرة (≈97 منها) ناتجة عن منح `EXECUTE` للأدوار `PUBLIC` و`anon` و`authenticated` على دوال `SECURITY DEFINER`.

سأقسّم الدوال إلى فئتين وأتعامل مع كل منهما بشكل مختلف:

### أ) دوال triggers بحتة — يتم سحب EXECUTE من جميع الأدوار

في PostgreSQL، تنفيذ trigger لا يتطلب صلاحية `EXECUTE` للمستخدم المُحدِث (يستخدم صلاحيات مالك الـtrigger). لذلك آمن تماماً سحب `EXECUTE` من `PUBLIC, anon, authenticated`:

```
auto_assign_customer_role, auto_create_tour_operator,
check_excessive_document_access, enforce_minimum_admins,
enforce_minimum_super_admins, generate_application_display_number,
handle_new_user, log_application_status_change,
notify_admin_on_agent_note, notify_admin_on_transfer_request,
notify_admin_on_whatsapp_order, notify_admin_on_work_submission,
notify_agent_on_assignment, notify_agent_on_transfer_decision,
notify_agent_on_work_decision, notify_application_status_change,
protect_profile_wallet_balance, protect_wallet_balance,
sync_price_notes_on_fee_type_change, update_updated_at_column,
validate_application_status_transition
```

→ يلغي ≈21 تحذيراً بدون أي تأثير على المستخدمين أو الـtriggers.

### ب) دوال مساعدة لـ RLS — يتم سحب EXECUTE من `anon` و`PUBLIC` فقط، مع إبقاء `authenticated`

هذه دوال يستدعيها تعبير RLS مباشرة، ويجب أن يبقى `authenticated` قادراً على تنفيذها وإلا تنكسر السياسات. لكن `anon`/`PUBLIC` لا يحتاجانها لأي سيناريو فعلي:

```
has_role, has_permission, is_admin, is_agent, is_customer,
is_super_admin, is_application_owner, is_assigned_agent,
is_profile_owner, is_tour_operator, can_access_application,
get_profile_id, get_user_email, get_audit_event_types,
get_failed_attempts_count, get_secure_document_info,
log_staff_action, clear_failed_login_attempts,
check_2fa_rate_limit, check_recovery_rate_limit,
verify_staff_2fa, rotate_staff_portal_path, record_login_attempt
```

ملاحظة مهمة: السياسات على جداول مثل `countries (is_active = true OR is_admin(auth.uid()))` تُقيَّم لمستخدمي `anon` أيضاً، لكن `anon` لديه `auth.uid() IS NULL` فيتم تخطي is_admin قصيراً في معظم الحالات. سأتحقق فعلياً قبل تنفيذ السحب من `anon` لأي دالة من هذه القائمة بفحص سياسات الجداول العامة (`countries`, `hero_destinations`, `hero_settings`, `site_content`, `footer_settings`, `special_offers`).

→ إذا تبيّن أن `anon` يحتاج فعلاً EXECUTE على بعضها، أُبقيها وأكتفي بسحبها من البقية.

### ج) RPCs مقصودة للمصادقين

`create_application_draft`, `enqueue_email`, `delete_email`, `move_to_dlq`, `read_email_batch`, `check_staff_portal_path`, `is_email_locked_out` — بعضها مسحوب من `PUBLIC` بالفعل. سأتأكد من سحب EXECUTE من `anon` لأي منها لا يُستدعى من واجهة المجهول.

## 3) تحذيرات أخرى

- **"Public Bucket Allows Listing"**: bucket `avatars` عام بنية لعرض شعارات الشركاء وصور الأعضاء. السماح بالقراءة (لا اللائحة) مقصود؛ سيتم تأكيد أن السياسة `SELECT` فقط ولا توجد سياسة list مخصصة، أو وضع علامة "ignore" مع تبرير في security memory.

## ضمان عدم كسر المراسلات

- لن يتم لمس: `notify_on_new_message` (مُحكَمة بالفعل)، سياسات `application_messages`، `notifications`، `applications`، أو RLS أي جدول تعتمد عليه واجهة المراسلات.
- بعد كل migration سيتم إعادة تشغيل Linter للتحقق، ولن يُلمس RPC `create_application_draft` أو دوال `is_*` التي تستخدمها سياسات المراسلات (`is_admin`, `is_assigned_agent`, `is_application_owner`, `get_profile_id`) إلا بسحب صلاحية `anon` فقط (وهي غير مستخدمة من المجهول).

## ملفات

- migration واحدة جديدة تحتوي:
  - تشديد سياستي RLS على `user_push_devices` و`email_subscribers`.
  - `REVOKE EXECUTE ... FROM PUBLIC, anon, authenticated` لدوال الـtriggers.
  - `REVOKE EXECUTE ... FROM PUBLIC, anon` للدوال المساعدة لـRLS وRPCs الموثّقة.
- استدعاء `manage_security_finding` لتعليم التحذيرات المقصودة (نشرة، avatars العام) كـ"ignore" مع سبب، وتحديث security-memory.

## النتيجة المتوقعة

- إنهاء التحذيرات الفعلية المتعلقة بالسياستين `true`.
- تقليل تحذيرات SECURITY DEFINER من ≈97 إلى رقم صغير (الدوال المساعدة لـRLS التي يجب أن تبقى متاحة للمصادقين، ولا يمكن للمجهول الوصول إليها بعد التغيير).
- صفر تأثير وظيفي على المراسلات أو أي مسار مستخدم آخر.
