# VisaFaster — Self-Hosted Stack

حزمة بنية تحتية كاملة لتشغيل منصة "عطلات رحلاتكم" (VisaFaster) على خادم خاص (VPS) دون أي اعتماد على أي طرف ثالث مغلق.

## ما الذي تحتويه هذه الحزمة

- **Docker Compose** كامل: PostgreSQL 16، Redis 7، MinIO، Backend (Fastify)، Frontend (Vite + Nginx)، Caddy (SSL تلقائي).
- **Schema قاعدة بيانات** مطابق لمنطق VisaFaster (users, roles منفصل، applications, documents, audit, إلخ) مع triggers أمنية.
- **Lucia Auth**: تسجيل/دخول/خروج، 2FA بالبريد، أكواد استرداد SHA-256، OAuth (Google) عبر Arctic.
- **MinIO**: تخزين S3-compatible مع presigned URLs و server-side encryption.
- **CI/CD**: Gitea Actions workflow + سكربت deploy.
- **Backups & DR**: pg_dump يومي + restic لـ MinIO + خطة استرجاع موثقة في < 30 دقيقة.
- **Monitoring**: Grafana + Loki + Promtail + Prometheus + Uptime Kuma.

## ما لا تحتويه (وتحتاج جلسات لاحقة)

- نقل **كل** صفحات React الحالية (200+ ملف). الفرونت هنا قوالب أساسية (Login/Register/2FA/Dashboard/Files) للتأكد من عمل Auth+Files نهاية لنهاية.
- ترجمة **كل** Edge Functions (14 دالة) إلى Fastify routes كاملة. الموجود stubs مع TODO.
- بناء كل لوحات Admin/Agent/Tourism — ستُبنى تدريجياً فوق هذه الأساسات.
- Capacitor/Despia/OneSignal — موثقة فقط في `docs/`.

## التشغيل السريع (Local)

```bash
cp .env.example .env
# عدّل القيم الحساسة
docker compose up -d
docker compose exec backend npx prisma migrate deploy
# الواجهة: http://localhost
# MinIO Console: http://localhost:9001
```

## النشر على VPS

اقرأ [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) للخطوات الكاملة.

## استرجاع الكوارث

اقرأ [`docs/DISASTER_RECOVERY.md`](docs/DISASTER_RECOVERY.md). الهدف: استرجاع كامل في < 30 دقيقة.

## الأمان

اقرأ [`docs/SECURITY.md`](docs/SECURITY.md): RBAC، PDPL، 2FA، rate limiting، CSP.

## خارطة الهجرة إلى الاستضافة الذاتية

1. شغّل هذا الـ stack محلياً وتأكد من Auth + رفع ملف.
2. صدّر بيانات Supabase الحالية: `pg_dump` ثم استورد بـ `psql`.
3. انقل ملفات Supabase Storage إلى MinIO (سكربت `infrastructure/minio/migrate-from-supabase.sh` موثق).
4. انقل صفحات الفرونت تدريجياً من المشروع الأصلي إلى `frontend/src/` مع استبدال `supabase-js` بـ `lib/api.ts`.
5. حوّل DNS إلى الـ VPS.