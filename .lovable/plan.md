# تحديث تصميم التحقق الأمني (AdvancedCaptcha)

المشكلة: مكوّن التحقق الأمني لا يزال بألوان داكنة (slate-700/800)، وبعض الأزرار (مثل زر "الإجابة" و"تحقق") لا تظهر إلا عند تمرير الماوس بسبب تباين ضعيف.

## التغييرات في `src/components/auth/AdvancedCaptcha.tsx` فقط

### 1) الحاوية الرئيسية
- استبدال `bg-slate-700/50 border-slate-600` بـ `bg-white/70 border-blue-100 rounded-xl shadow-sm`
- تسمية الترويسة: `text-slate-700` بدل `text-slate-300`، أيقونة amber → `text-amber-500`

### 2) تحدّي الرياضيات (math)
- الصندوق: `bg-white border border-blue-100 text-slate-800` بدل `bg-slate-800 text-white`
- المعاملات: `text-blue-600`، الأرقام `text-slate-800`، علامة `=` و`?` بـ `text-slate-400`
- نص "احسب من اليسار لليمين": `text-slate-500`

### 3) تحدّي النص (canvas)
- خلفية الكانفس: لون فاتح `#eff6ff` (blue-50) بدل `#1e293b`
- خطوط التشويش: درجات أزرق/سماوي شفافة بدل ألوان عشوائية فاتحة
- نص الكابتشا: استبدال ألوان الفلوريسنت بـ `#1e40af, #1d4ed8, #0369a1, #0c4a6e` (تباين عالٍ على الفاتح)
- الإطار: `border-blue-200`

### 4) حقل الإجابة والأزرار (أهم نقطة — حلّ مشكلة الظهور بالـ hover)
- `Input`: `bg-white border-blue-200 text-slate-800 placeholder:text-slate-400 h-11 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-500/20` — بدلاً من `bg-slate-700/50 text-white`
- زر "تحقق": لون واضح ثابت `bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-11` (حالياً يستخدم الـ default variant بدون لون صريح، لذلك يبدو شاحباً)
- زر التحديث (RefreshCw): `text-slate-500 hover:text-blue-600 hover:bg-blue-50`
- حالة التحقق الناجح: `bg-emerald-500 hover:bg-emerald-600` بدل `bg-green-600`

### 5) شاشة القفل (lockout)
- الخلفية: `bg-red-50 border-red-200`
- النص: `text-red-700` / `text-slate-600` بدل `text-red-400`/`text-slate-300`
- دائرة الأيقونة: `bg-red-100 border-red-200`
- العدّاد: `text-red-600`

### 6) رسالة الخطأ والنجاح
- خطأ: `text-red-600`
- نجاح: `text-emerald-600`

## خارج النطاق
- لا تغيير على المنطق (lockout, attempts, RPC, canvas distortion math)
- لا تغيير على `SecureStaffAuth.tsx`
- لا تغيير على باقي صفحات التحقق الأخرى
