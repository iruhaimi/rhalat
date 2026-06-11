
# المرحلة 2: تحويل Wizard التقديم إلى Guest-First

## الهدف
السماح للزائر بإكمال 3 خطوات (الدولة، التأشيرة، السعر) **بدون تسجيل دخول**، ثم طلب التسجيل فقط قبل رفع الجواز — لتقليل الاحتكاك وزيادة معدل التحويل.

## رحلة المستخدم الجديدة

```text
Step 1: البيانات الأساسية (اسم، جوال، بريد)   ← ضيف ✅
Step 2: تفاصيل التأشيرة (مسافرين + تاريخ)      ← ضيف ✅
Step 3: عرض السعر النهائي + المتطلبات          ← ضيف ✅ (لحظة الحقيقة)
─────── 🔐 بوابة المصادقة (Modal) ───────
Step 4: رفع المستندات                          ← مسجّل
Step 5: الشروط                                ← مسجّل
Step 6: الدفع                                 ← مسجّل
```

البيانات تُحفظ في **localStorage** للضيوف، ثم تُرحَّل تلقائياً إلى الـ DB عبر RPC `create_application_draft` فور إتمام التسجيل، مع تمرير الـ payload الكامل.

## التغييرات

### 1) قاعدة البيانات
- تحديث `create_application_draft` RPC لقبول معاملات إضافية: `p_traveler_counts jsonb`, `p_contact jsonb`, `p_checked_requirements jsonb` — حتى يُحفظ كل ما جمعناه من الضيف في إدراج واحد بعد التسجيل.

### 2) Frontend — ملفات معدّلة

**`src/contexts/ApplicationContext.tsx`**
- إضافة `saveToLocalStorage()` و `loadFromLocalStorage()` (مفتاح: `vf_guest_draft`).
- إضافة `migrateGuestDraftToCloud()` تستدعي الـ RPC بعد التسجيل.
- إضافة state `showAuthGate: boolean`.

**`src/components/apply/steps/Step1BasicInfo.tsx`**
- **إزالة كامل قسم Login/Signup/Google** من هذه الخطوة.
- تبقى فقط: الاسم، البريد، الجوال (validation كما هي: إنجليزي + 9 أرقام).
- زر "التالي" مباشرة، بدون شرط تسجيل.

**`src/pages/Apply.tsx`**
- إزالة شرط `if (!profile)` من حفظ المسودة في الخطوات 1-3.
- استبدال auto-save بـ DB → auto-save إلى localStorage للزائر.
- بعد المصادقة الناجحة في البوابة → استدعاء `migrateGuestDraftToCloud()` ثم متابعة Step 4.

**ملف جديد: `src/components/apply/AuthGateModal.tsx`**
- Modal يظهر عند الانتقال من Step 3 → Step 4 إذا `!user`.
- يحوي: تسجيل الدخول + إنشاء حساب + Google (نفس مكونات `/auth` الحالية).
- العنوان: "لحماية بياناتك، نحتاج إنشاء حساب لرفع الجواز" — يبرر للعميل سبب الحاجز.
- البريد والاسم والجوال **مُعبّأة مسبقاً** من بيانات Step 1.

**`src/components/apply/steps/Step3Requirements.tsx`**
- إبراز **بطاقة السعر النهائي** بشكل واضح في أعلى الخطوة (هي لحظة الحقيقة قبل البوابة).
- زر "التالي" يفتح `AuthGateModal` إذا الزائر غير مسجّل.

### 3) منطق Migration
عند نجاح التسجيل/الدخول داخل البوابة:
1. قراءة `vf_guest_draft` من localStorage.
2. استدعاء `create_application_draft` بكل البيانات.
3. حفظ `draftId` العائد في الـ context.
4. مسح localStorage.
5. إغلاق Modal والانتقال لـ Step 4 تلقائياً.

## ملاحظات هامة

- **PDPL محمي:** الجواز لا يُرفع إلا بعد إنشاء حساب موثّق → لا تخزين لبيانات حساسة باسم ضيف.
- **لا تغيير في `/auth`** — تبقى كما هي للمستخدمين القادمين من الهيدر.
- **لا تغيير في Step 4-6** — تبقى كما هي تماماً.
- **التتبع `/track`:** يصبح ذا معنى لاحقاً لمن يدخل برقم طلب من واتساب — سنفعّله في المرحلة 3.
- **WhatsApp OTP:** غير متوفر أصلاً في Lovable Cloud. الإبقاء على email+password+Google كافٍ الآن؛ يمكن إضافة Phone OTP عبر SMS لاحقاً كتحسين.

## تقدير الأثر
بناءً على معايير الصناعة (Baymard, Stripe): تقليل خطوة التسجيل المبكرة يرفع معدل إكمال الطلب بنسبة **20-35%** في قطاع الخدمات.

## خطة التنفيذ
1. تحديث RPC `create_application_draft` (migration).
2. تعديل `ApplicationContext` + localStorage helpers.
3. إنشاء `AuthGateModal`.
4. تنظيف Step1 من قسم المصادقة.
5. تعديل `Apply.tsx` لإزالة شرط profile من الحفظ + ربط البوابة.
6. اختبار: ضيف يكمل 3 خطوات → بوابة → تسجيل → استكمال.
