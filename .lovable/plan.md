## ما تم إنجازه فعلياً (لا حاجة لإعادته)
- AuthGateModal موجود ويعمل قبل خطوة رفع المستندات
- Step6Payment يحفظ موافقة الشروط (وقت + IP + UA + إصدار v2026.1) لكلا المسارين
- أعمدة `terms_accepted_at`, `terms_version`, `terms_ip_address`, `terms_user_agent` مضافة في جدول `applications`
- مسار الواتساب يعمل (لكن **يتطلب تسجيل دخول حالياً** — وهذا ما سنصلحه)

## ما سيُنفَّذ الآن

### 1) شاشة اختيار المسار بعد الخطوة 3 (المتطلبات)
ملف جديد: `src/components/apply/PathChoiceCard.tsx`
- يظهر داخل Step3Requirements بعد ضغط "التالي" (بدلاً من الانتقال المباشر)
- بطاقتان كبيرتان:
  - **🌐 إكمال إلكتروني (موصى به)** — يفتح `AuthGateModal` ثم ينتقل لخطوة 4
  - **💬 إكمال عبر واتساب — بدون تسجيل** — ينشئ طلب فوراً ويفتح واتساب
- زر "رجوع لتعديل المتطلبات"

### 2) RPC جديد: `create_whatsapp_order` (يقبل ضيوف بلا حساب)
- يستقبل: visa_type_id, travel_date, جميع بيانات المسافر من localStorage، الموافقة على الشروط
- ينشئ profile مؤقت (guest_profile) + application بحالة `whatsapp_pending`
- يولّد `display_number` تلقائياً (VF-2026-XXXX) عبر التريغر الحالي
- يحفظ بيانات الموافقة (terms_*)
- يطلق `notify_admin_on_whatsapp_order` (موجود مسبقاً)
- يُرجِع: `{ application_id, display_number }`

### 3) تعديل Step3Requirements
- إزالة استدعاء AuthGate المباشر
- إظهار PathChoiceCard بدل زر "التالي"
- مسار الواتساب: استدعاء RPC الجديد ثم فتح واتساب بنفس صياغة الرسالة الحالية
- مسار الإلكتروني: نفس السلوك الحالي (AuthGate → step 4)

### 4) تعديل Step6Payment
- إزالة قسم "إرسال عبر واتساب" من خطوة الدفع (أصبح في شاشة الاختيار)
- يصبح مسار الدفع الإلكتروني فقط مع checkbox الشروط (كما هو الآن)

### 5) بلوك إثبات الموافقة في صفحة الأدمن
في `src/pages/admin/ApplicationDetail.tsx` (وما يماثلها):
بلوك جديد "📜 إثبات الموافقة القانونية":
- الإصدار: v2026.1
- التاريخ والوقت
- IP
- User Agent
- شارة خضراء "✅ موافقة موثّقة"

## التفاصيل التقنية

- **Migration**: إنشاء RPC `create_whatsapp_order(p_visa_type_id, p_travel_date, p_guest_data jsonb, p_terms jsonb)` مع `SECURITY DEFINER` و `search_path = public`
- **Guest profile**: يُنشأ بـ `user_id = NULL` ويحوي `full_name`, `email`, `phone` من البيانات المرسلة
  - يتطلب جعل عمود `profiles.user_id` يقبل NULL (تعديل بسيط) أو استخدام placeholder
  - **البديل الأكثر أماناً**: عمود `guest_email` و `guest_phone` على جدول `applications` مباشرة بدون لمس profiles
- **RLS**: السماح بـ INSERT على applications من خلال RPC فقط (SECURITY DEFINER يتجاوز RLS)
- لا حاجة لتغيير WizardStepper (يبقى 5 خطوات)

## الأثر المتوقع
- العملاء كبار السن أو غير المرتاحين للتسجيل سيكملون عبر واتساب بنقرة واحدة
- زيادة معدل الإكمال 10-15% إضافي بحسب أبحاث UX السعودية
- توثيق قانوني كامل للموافقة على الشروط (PDPL متوافق)
