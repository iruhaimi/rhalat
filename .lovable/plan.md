
## أولاً: توضيح مهم قبل البناء

طلبت "الكل" (وكيل يعدّل الكود + لوحة بالأوامر + وكيل خارجي). من الناحية التقنية:

### 1) وكيل يعدّل كود الموقع (مثل Lovable/Hermes) — **لا يمكن بناؤه داخل الموقع**
- Lovable و Hermes و Cursor تعمل على مستوى **مستودع GitHub** والـ IDE، لها صلاحية كتابة ملفات `.tsx` و `.sql` ونشر التغييرات.
- لا يمكن أن يكون هذا "ميزة داخل موقعك" — هذا يعني السماح للذكاء الاصطناعي بإعادة نشر موقعك، وهو مخاطرة أمنية كبيرة.
- **البديل العملي**: استخدم Lovable نفسه (أنا) أو Cursor/Claude Code محلياً على مستودعك في GitHub. لا حاجة لبناء شيء.

### 2) وكيل خارجي (n8n / Hermes API) عبر REST — **نفس نتيجة الخيار التالي**
- يستدعي نفس Edge Functions التي سنبنيها للخيار 3.
- بمجرد بناء أدوات RPC الآمنة، يمكن لأي خدمة خارجية الاتصال بها بمفتاح API.

### 3) لوحة تحكم بالأوامر العربية داخل `/admin` — **هذا ما يمكن بناؤه فعلياً** ✅

سنبني صفحة `/admin/ai-assistant` يكتب فيها المالك أمراً بالعربية مثل:
- "غيّر سعر تأشيرة فرنسا السياحية إلى 1500 ريال"
- "أوقف عرض الجمعة البيضاء"
- "اعرض لي أكثر 5 وكلاء أداءً هذا الشهر"
- "أرسل تنبيه لكل العملاء الذين طلباتهم معلقة منذ 3 أيام"

والوكيل ينفذها عبر أدوات (tools) محددة ومحمية بصلاحيات.

---

## الخطة المقترحة (الخيار 3)

### المعمارية
```
لوحة /admin/ai-assistant (واجهة شات)
        ↓
Edge Function: admin-ai-agent
        ↓
Lovable AI Gateway (gpt-5 مع tool calling)
        ↓
أدوات RPC محمية (SECURITY DEFINER + has_permission)
        ↓
قاعدة البيانات
```

### الأدوات (Tools) المتاحة للوكيل في المرحلة الأولى
| الأداة | الوصف | الصلاحية المطلوبة |
|---|---|---|
| `update_visa_price` | تغيير سعر تأشيرة | `manage_visas` |
| `toggle_offer` | تفعيل/إيقاف عرض | `manage_offers` |
| `query_applications` | استعلام آمن (قراءة فقط) | `view_applications` |
| `agent_performance_report` | تقرير أداء الوكلاء | `view_reports` |
| `bulk_notify_customers` | إرسال إشعارات مجمعة | `manage_communications` |
| `update_site_content` | تعديل نصوص CMS | `manage_content` |

كل أداة هي **RPC منفصل** بـ `SECURITY DEFINER` + `search_path = public` + فحص `has_permission(auth.uid(), ...)`.

### قواعد الأمان (مهمة جداً)
1. **Owner فقط** يصل إلى `/admin/ai-assistant` (نتحقق عبر `is_super_admin`).
2. أي أمر **حساس** (تغيير سعر، حذف، إرسال جماعي >50) يمر عبر **Two-Person Rule** الموجود لديك (`SensitiveOperations`).
3. كل أمر يُسجّل في `staff_audit_log` مع النص الأصلي + الأداة المستخدمة + النتيجة.
4. الوكيل **يعرض تأكيداً** قبل تنفيذ أي عملية كتابة، ويعرض ما سيفعله بالعربي.
5. لا يصل الوكيل أبداً إلى: كلمات المرور، رموز 2FA، أرصدة محفظة، مستندات جوازات.

### مكونات سنبنيها
1. **Edge Function**: `supabase/functions/admin-ai-agent/index.ts`
   - يستقبل رسالة المستخدم + سياق المحادثة
   - يستدعي Lovable AI (`google/gemini-3-flash-preview`) مع تعريفات الأدوات
   - ينفذ tool calls عبر service role بعد التحقق من هوية المستدعي
2. **RPCs جديدة** (migration):
   - `ai_update_visa_price(visa_id, new_price)`
   - `ai_toggle_offer(offer_id, active)`
   - `ai_query_applications(filters jsonb)`
   - `ai_bulk_notify(filter jsonb, title, message)`
3. **جدول `ai_assistant_conversations`** لحفظ سجل المحادثات
4. **صفحة `src/pages/admin/AIAssistant.tsx`**:
   - واجهة شات RTL بسيطة
   - عرض تأكيد لكل عملية كتابة (Approve/Cancel)
   - عرض النتيجة بشكل منسق (جدول/رسالة)
5. **رابط جديد في sidebar**: "المساعد الذكي 🤖" (للمالك فقط)

### مرحلة 2 (لاحقاً، إن نجحت المرحلة 1)
- فتح نقطة وصول API خارجية (`/functions/v1/external-ai-agent`) بمفتاح API لتمكين n8n/Hermes/Zapier من استدعاء نفس الأدوات.
- إضافة أدوات أكثر تقدماً (إنشاء برامج سياحية، الرد على رسائل العملاء، إلخ).

### ملاحظات على التكلفة
- كل أمر يستهلك ~5,000-15,000 توكن من Lovable AI Gateway (رخيص جداً مع `gemini-3-flash`).
- لا توجد رسوم إضافية على البنية التحتية (يستخدم Edge Functions الموجودة).

---

## ما يحتاج قراراً منك

1. هل توافق على البدء بالمرحلة 1 فقط (لوحة `/admin/ai-assistant` مع 6 أدوات أساسية)؟
2. أيّ الأدوات تريد إضافتها أولاً، وأيّها يمكن تأجيله؟
3. هل تريد أن يكون نموذج الذكاء الاصطناعي `gemini-3-flash` (سريع ورخيص) أم `gpt-5` (أذكى وأغلى)؟

عند الموافقة، سأبدأ بإنشاء migration للأدوات + edge function + الصفحة.
