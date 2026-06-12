
# إصلاح تكرار +966 في رقم الجوال

## المشكلة
`profile.phone` قد يحتوي على `+966558882878` (محفوظ بالكامل من تسجيلات سابقة)، ثم نضيف `+966` مرة أخرى عند العرض → `+966 +966558882878`.

## الحل

### 1) ملف جديد: `src/lib/phone.ts`
- `normalizeSaudiPhone(raw)` → يُجرّد `+966` / `00966` / `966` / `0` البادئة وأي مسافات/رموز، يُعيد 9 أرقام فقط (مثلاً `558882878`).
- `formatSaudiPhone(raw)` → يُعيد `+966XXXXXXXXX` للعرض/الرسائل.

### 2) تطبيق التطبيع في 3 ملفات
- **`PathChoiceCard.tsx`**:
  - عرض ملخص الهوية: `formatSaudiPhone(profile.phone)` بدلاً من `+966 {profile.phone}`.
  - `handleSavePhone`: تطبيع المُدخل قبل `update` (حفظ 9 أرقام فقط).
  - رسالة واتساب: استخدام `formatSaudiPhone`.
- **`Step6Payment.tsx`**:
  - ملخص الطلب: `formatSaudiPhone(profile?.phone)` بدلاً من `{countryCode} {phone}`.
  - رسالة واتساب + بريد التأكيد + JSON المحفوظ في `applications` → كلها تستخدم `formatSaudiPhone`.

### 3) تنظيف بيانات قديمة (Migration)
`UPDATE profiles SET phone = regexp_replace(...)` لكل الأرقام التي تبدأ بـ `+966` أو `966` أو `0`، حتى تصبح كلها 9 أرقام نقية. يمنع تكرار الخطأ لعملاء سابقين.

## الملفات
- جديد: `src/lib/phone.ts`
- تعديل: `src/components/apply/PathChoiceCard.tsx`, `src/components/apply/steps/Step6Payment.tsx`
- Migration: تنظيف عمود `profiles.phone`

هل أُنفّذ الآن؟
