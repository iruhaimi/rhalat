## الأسئلة الثلاثة — إجابات مباشرة

### 1) الويب لا يزال يعطي `invalid_client` — ما السبب؟
Apple ترفض الطلب لأن **Supabase callback** غير مسجّل ضمن Return URLs في Services ID. Supabase يرسل المستخدم دائماً إلى:
```
https://hgxvwziiumjxifpgpjce.supabase.co/auth/v1/callback
```
لكنك سجّلت في Apple فقط `https://visafaster.com/` و `https://www.visafaster.com/`.

**الإصلاح (يدوي في Apple Developer فقط، لا كود):**
- افتح Identifiers → Services IDs → `com.visafaster.signin` → Sign In with Apple → Configure.
- في Return URLs أضف السطر:
  ```
  https://hgxvwziiumjxifpgpjce.supabase.co/auth/v1/callback
  ```
- Save.

### 2) هل هذا يحل مشكلة اعتماد التطبيق في Apple؟
**نعم مبدئياً، لكنه لا يكفي وحده.** مراجعة Apple تختبر على جهاز iOS، وقد أثبتنا:
- ✅ Apple Sign-In يعمل الآن على iOS الأصلي
- ✅ Google Login مخفي على iOS
- ✅ Cookie Banner مخفي على iOS
- ✅ Delete Account متاح
- ✅ الأيقونة 1024×1024 جاهزة

لكن ما زال يعتمد على:
- تفعيل "Sign in with Apple" Capability في Xcode
- رفع الأيقونة الصحيحة في AppIcon.appiconset
- تغيير اسم Seller في App Store Connect إلى "Visa Faster"
- استخدام حساب المراجع المُسلَّم في review notes

مشكلة الويب **لا تؤثر** على اعتماد التطبيق (Apple يختبر iOS فقط).

### 3) الشعار لا يظهر داخل التطبيق (المربع الأبيض بعلامة ؟)

**السبب المؤكد:** الشعار مستضاف كأصل Lovable بمسار نسبي:
```
/__l5e/assets-v1/6ff4b400-.../logo-new.png
```
داخل تطبيق iOS الأصلي، الـ origin هو `capacitor://localhost`، فيحاول المتصفح المدمج تحميل الشعار من:
```
capacitor://localhost/__l5e/assets-v1/.../logo-new.png
```
وهذا **لا وجود له** — Lovable CDN يعمل فقط على النطاقات المنشورة، وليس داخل حاوية Capacitor.

نفس المشكلة تؤثر على أي صورة أصلها Lovable Assets داخل التطبيق (شعارات الشركاء، صور الأبطال ... إلخ).

---

## الخطة

### أ) إصلاح الويب (يدوي، بدون كود)
أضف رابط Supabase callback في Apple Services ID كما هو موضّح أعلاه.

### ب) إصلاح ظهور الشعار داخل التطبيق (تعديل كود)
لا نستطيع الاعتماد على مسار نسبي داخل Capacitor. الحل: تحويل مسار Lovable Assets إلى **URL مطلق** إلى نطاق الإنتاج فقط عندما نكون داخل تطبيق iOS الأصلي.

**التنفيذ:**
1. إنشاء دالة مساعدة `src/lib/assetUrl.ts`:
   ```ts
   import { isNativeApp } from '@/lib/platform';
   const CDN_ORIGIN = 'https://visafaster.com';
   export function assetUrl(url: string) {
     if (!url) return url;
     if (url.startsWith('http')) return url;
     if (isNativeApp() && url.startsWith('/')) return CDN_ORIGIN + url;
     return url;
   }
   ```
2. استيراد `assetUrl` واستخدامها في:
   - `src/components/layout/HeaderArabic.tsx` (الشعار)
   - `src/components/layout/FooterArabic.tsx` (إن كان يستخدم شعاراً)
   - أي مكان آخر يستخدم `.asset.json` (شعارات الشركاء في `PartnersSection`, `HeroManagement`, ...)

3. التحقق: بعد `npm run build` + `npx cap sync ios` وتشغيل التطبيق، يجب أن يظهر الشعار في الهيدر وصفحة الملف الشخصي.

### ج) نقاط لاحقة (لا تتطلب كود الآن)
- بعد أن يعمل الويب، تأكد من ظهور زر Apple بنجاح على `visafaster.com/auth`.
- لا حاجة لإعادة توليد Client Secret — الحالي صالح.

---

## ملخص التغييرات في الكود
- **ملف جديد:** `src/lib/assetUrl.ts` (دالة مساعدة صغيرة)
- **تعديل:** كل ملف يستورد `.asset.json` ويستخدم `.url` مباشرة — نغلّفه بـ `assetUrl(...)`

لا تعديلات على قاعدة البيانات، ولا على Edge Functions، ولا على إعدادات Supabase.

هل أبدأ بالتنفيذ؟