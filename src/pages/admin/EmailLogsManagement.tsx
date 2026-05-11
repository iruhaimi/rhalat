import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  RefreshCw,
  Search,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';

type LogRow = {
  id: string;
  message_id: string | null;
  recipient_email: string;
  template_name: string;
  status: string;
  error_message: string | null;
  metadata: any;
  created_at: string;
};

const RANGES: Record<string, number> = {
  '24h': 1,
  '7d': 7,
  '30d': 30,
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  sent: { label: 'مُرسل', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  pending: { label: 'قيد الإرسال', color: 'bg-blue-100 text-blue-800', icon: Clock },
  failed: { label: 'فشل', color: 'bg-red-100 text-red-800', icon: XCircle },
  dlq: { label: 'فشل نهائي', color: 'bg-red-100 text-red-800', icon: XCircle },
  suppressed: { label: 'مكبوت', color: 'bg-amber-100 text-amber-800', icon: Ban },
  bounced: { label: 'مرتد', color: 'bg-red-100 text-red-800', icon: XCircle },
  complained: { label: 'شكوى', color: 'bg-amber-100 text-amber-800', icon: Ban },
};

export default function EmailLogsManagement() {
  const [range, setRange] = useState<string>('7d');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<LogRow | null>(null);

  const since = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - (RANGES[range] ?? 7));
    return d.toISOString();
  }, [range]);

  const { data: rawLogs = [], isLoading, refetch } = useQuery({
    queryKey: ['email-logs', since],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('email_send_log')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return (data || []) as LogRow[];
    },
  });

  // Deduplicate by message_id (keep latest)
  const logs = useMemo(() => {
    const seen = new Map<string, LogRow>();
    for (const row of rawLogs) {
      const key = row.message_id || row.id;
      if (!seen.has(key)) seen.set(key, row);
    }
    return Array.from(seen.values());
  }, [rawLogs]);

  const templates = useMemo(
    () => Array.from(new Set(logs.map(l => l.template_name))).sort(),
    [logs]
  );

  const filtered = useMemo(() => {
    return logs.filter(l => {
      if (templateFilter !== 'all' && l.template_name !== templateFilter) return false;
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (search && !l.recipient_email.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [logs, templateFilter, statusFilter, search]);

  const stats = useMemo(() => {
    const total = logs.length;
    const count = (s: string[]) => logs.filter(l => s.includes(l.status)).length;
    return {
      total,
      sent: count(['sent']),
      failed: count(['failed', 'dlq', 'bounced']),
      suppressed: count(['suppressed', 'complained']),
    };
  }, [logs]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Mail}
        title="سجل الإيميلات المرسلة"
        description="مراقبة جميع الإيميلات الصادرة من النظام لضبط الجودة"
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            تحديث
          </Button>
        }
      />

      <div data-admin-stats="true" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="الإجمالي" value={stats.total} icon={Mail} tone="muted" index={0} />
        <StatCard label="مُرسل بنجاح" value={stats.sent} icon={CheckCircle2} tone="success" index={1} />
        <StatCard label="فشل" value={stats.failed} icon={XCircle} tone="danger" index={2} />
        <StatCard label="مكبوت / شكاوى" value={stats.suppressed} icon={Ban} tone="gold" index={3} />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">فلاتر البحث</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">آخر 24 ساعة</SelectItem>
              <SelectItem value="7d">آخر 7 أيام</SelectItem>
              <SelectItem value="30d">آخر 30 يوم</SelectItem>
            </SelectContent>
          </Select>
          <Select value={templateFilter} onValueChange={setTemplateFilter}>
            <SelectTrigger><SelectValue placeholder="القالب" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل القوالب</SelectItem>
              {templates.map(t => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="الحالة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              <SelectItem value="sent">مُرسل</SelectItem>
              <SelectItem value="pending">قيد الإرسال</SelectItem>
              <SelectItem value="dlq">فشل نهائي</SelectItem>
              <SelectItem value="failed">فشل</SelectItem>
              <SelectItem value="suppressed">مكبوت</SelectItem>
              <SelectItem value="bounced">مرتد</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ابحث بالبريد..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pr-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">القالب</TableHead>
                <TableHead className="text-right">المستلم</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">الوقت</TableHead>
                <TableHead className="text-right">تفاصيل</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    جاري التحميل...
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    لا توجد إيميلات في هذه الفترة
                  </TableCell>
                </TableRow>
              )}
              {filtered.slice(0, 200).map(log => {
                const cfg = statusConfig[log.status] || {
                  label: log.status,
                  color: 'bg-gray-100 text-gray-800',
                  icon: Mail,
                };
                const Icon = cfg.icon;
                return (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs">{log.template_name}</TableCell>
                    <TableCell dir="ltr" className="text-right">{log.recipient_email}</TableCell>
                    <TableCell>
                      <Badge className={`${cfg.color} gap-1`}>
                        <Icon className="w-3 h-3" />
                        {cfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(log.created_at), {
                        addSuffix: true,
                        locale: ar,
                      })}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => setSelected(log)}>
                        عرض
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {filtered.length > 200 && (
            <div className="p-3 text-center text-xs text-muted-foreground border-t">
              يتم عرض أول 200 سجل من أصل {filtered.length}. ضيّق الفلاتر للحصول على نتائج أدق.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تفاصيل الإيميل</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <Field label="القالب" value={selected.template_name} />
              <Field label="المستلم" value={selected.recipient_email} ltr />
              <Field label="الحالة" value={selected.status} />
              <Field label="معرّف الرسالة" value={selected.message_id || '-'} ltr />
              <Field label="الوقت" value={new Date(selected.created_at).toLocaleString('ar-SA')} />
              {selected.error_message && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">رسالة الخطأ</div>
                  <pre className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-xs whitespace-pre-wrap">
                    {selected.error_message}
                  </pre>
                </div>
              )}
              {selected.metadata && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">البيانات الوصفية</div>
                  <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-64" dir="ltr">
                    {JSON.stringify(selected.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const Field = ({ label, value, ltr }: { label: string; value: string; ltr?: boolean }) => (
  <div className="flex justify-between gap-3 border-b pb-2">
    <span className="text-muted-foreground text-xs">{label}</span>
    <span className="font-medium" dir={ltr ? 'ltr' : 'rtl'}>{value}</span>
  </div>
);