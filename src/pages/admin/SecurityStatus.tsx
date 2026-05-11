import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, RotateCw, CheckCircle2, AlertTriangle, ExternalLink, MessageSquare, MailWarning, Lock } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';

// Snapshot of the most recent Supabase Linter result. Update via the migration that
// triggers a linter run; this page displays the latest known posture.
const LINTER_SNAPSHOT = {
  capturedAt: '2026-05-11',
  totalWarnings: 40,
  categories: [
    {
      key: 'definer_anon',
      label: 'دوال SECURITY DEFINER قابلة للاستدعاء من الزوار',
      count: 25,
      severity: 'warn' as const,
      accepted: true,
      reason:
        'مطلوبة للسياسات العامة (countries / visa_types / hero_*) التي تستخدم is_admin/has_role داخل OR.',
    },
    {
      key: 'definer_authed',
      label: 'دوال SECURITY DEFINER قابلة للاستدعاء من المستخدمين الموثقين',
      count: 14,
      severity: 'warn' as const,
      accepted: true,
      reason: 'دوال أعمال داخلية محمية بفحوصات صلاحيات داخل الجسم.',
    },
    {
      key: 'public_bucket',
      label: 'سرد bucket عام (avatars)',
      count: 1,
      severity: 'warn' as const,
      accepted: true,
      reason: 'القراءة محصورة بالمستخدمين الموثّقين، والروابط العامة تمر عبر CDN.',
    },
  ],
};

export default function SecurityStatus() {
  const qc = useQueryClient();

  const messages = useQuery({
    queryKey: ['security-status', 'messages'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('application_messages')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });

  const unread = useQuery({
    queryKey: ['security-status', 'unread'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('application_messages')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const recentFails = useQuery({
    queryKey: ['security-status', 'fails'],
    queryFn: async () => {
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count, error } = await supabase
        .from('staff_login_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('success', false)
        .gte('created_at', since);
      if (error) throw error;
      return count ?? 0;
    },
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['security-status'] });
  };

  return (
    <div className="space-y-6 p-4 md:p-6" dir="rtl">
      <PageHeader
        icon={Shield}
        title="حالة الأمان وRLS"
        description="ملخّص فحوصات السلامة وتحذيرات Supabase Linter المتبقية"
        actions={
          <Button onClick={refresh} variant="outline" className="gap-2">
            <RotateCw className="h-4 w-4" />
            إعادة تشغيل الفحوصات
          </Button>
        }
      />

      {/* Health checks */}
      <div data-admin-stats="true" className="grid gap-4 md:grid-cols-3">
        <StatCard
          label="إجمالي الرسائل في النظام"
          value={messages.data ?? '—'}
          icon={MessageSquare}
          tone="primary"
          hint="المشغّل notify_on_new_message فعّال"
          index={0}
        />
        <StatCard
          label="رسائل غير مقروءة"
          value={unread.data ?? '—'}
          icon={MailWarning}
          tone="gold"
          hint="يتزامن is_read مع قاعدة البيانات فورًا"
          index={1}
        />
        <StatCard
          label="محاولات دخول فاشلة (24س)"
          value={recentFails.data ?? '—'}
          icon={Lock}
          tone={typeof recentFails.data === 'number' && recentFails.data > 5 ? 'danger' : 'success'}
          hint="القفل التلقائي بعد 5 محاولات"
          index={2}
        />
      </div>

      {/* Linter snapshot */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>تحذيرات Supabase Linter</span>
            <Badge variant="outline">آخر فحص: {LINTER_SNAPSHOT.capturedAt}</Badge>
          </CardTitle>
          <CardDescription>
            إجمالي التحذيرات المتبقية: {LINTER_SNAPSHOT.totalWarnings} (جميعها مقبولة بمبررات أمنية)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {LINTER_SNAPSHOT.categories.map((cat) => (
            <Alert key={cat.key} className="border-amber-200 bg-amber-50/50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="flex items-center gap-2">
                {cat.label}
                <Badge variant="secondary">{cat.count}</Badge>
                {cat.accepted && (
                  <Badge className="bg-emerald-600 hover:bg-emerald-700">مقبول</Badge>
                )}
              </AlertTitle>
              <AlertDescription className="mt-1 text-sm">{cat.reason}</AlertDescription>
            </Alert>
          ))}

          <div className="pt-2">
            <a
              href="https://supabase.com/docs/guides/database/database-linter"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              توثيق Supabase Linter
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      <Alert>
        <Shield className="h-4 w-4" />
        <AlertTitle>سياسة RLS الحالية</AlertTitle>
        <AlertDescription>
          جميع الجداول الحساسة (applications, application_messages, profiles, payments,
          documents) محميّة بسياسات RLS صارمة. الوصول العام مقصور على جداول العرض فقط
          (countries, visa_types, hero_*, special_offers). bucket avatars يدعم القراءة
          عبر CDN فقط دون السماح بسرد الملفات للزوار.
        </AlertDescription>
      </Alert>
    </div>
  );
}