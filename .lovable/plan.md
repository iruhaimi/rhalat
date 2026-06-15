## السبب

في التعديل الأمني السابق على `send-transactional-email` أصبحت ترفض أي نداء بمفتاح anon. ودالة `send-staff-2fa` كانت تنادي إرسال الإيميل بمفتاح anon → ترجع `401 Unauthorized`، ولذلك ما يصل رمز التحقق.

السجل يؤكد:
```
Lovable email invoke error: 401 {"error":"Unauthorized: authentication required"}
```

## الحل

تعديل `supabase/functions/send-staff-2fa/index.ts` فقط:
- استدعاء `send-transactional-email` باستخدام `SUPABASE_SERVICE_ROLE_KEY` (server-to-server موثوق) بدل مفتاح anon.
- إزالة الـ `PUBLIC_ANON_JWT` غير اللازم.

لن يتغير: منطق الـ 2FA، قالب الإيميل، الـ frontend، قواعد البيانات، أو الفحوصات الأمنية الأخرى.

## التحقق

- إعادة محاولة دخول بوابة الموظفين → الرمز يصل للإيميل خلال ثوانٍ.
- سجلات `send-staff-2fa`: يختفي خطأ 401 ويظهر `2FA email enqueued successfully`.
- جدول `email_send_log`: صف بحالة `sent` لقالب `staff-2fa`.
