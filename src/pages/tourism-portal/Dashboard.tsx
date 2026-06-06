import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Map, CheckCircle2, Clock, CalendarCheck, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

export default function TourismDashboard() {
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0,
    bookings: 0,
  });
  const [operator, setOperator] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: op } = await (supabase as any)
        .from('tour_operators_self')
        .select('*')
        .maybeSingle();
      setOperator(op);
      if (op) {
        const { data: programs } = await supabase
          .from('tour_programs')
          .select('id, status')
          .eq('operator_id', op.id);
        const { count: bookingsCount } = await supabase
          .from('tour_bookings')
          .select('id', { count: 'exact', head: true })
          .eq('operator_id', op.id);

        const total = programs?.length ?? 0;
        const approved = programs?.filter((p) => p.status === 'approved').length ?? 0;
        const pending = programs?.filter((p) => p.status === 'pending').length ?? 0;
        const rejected = programs?.filter((p) => p.status === 'rejected').length ?? 0;
        setStats({ total, approved, pending, rejected, bookings: bookingsCount ?? 0 });
      }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">لوحة التحكم</h1>
        <p className="text-muted-foreground mt-1">
          مرحباً {operator?.company_name ?? ''} — تابع برامجك السياحية وحجوزاتك
        </p>
      </div>

      {!loading && operator && !operator.is_verified && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="flex items-start gap-3 p-4">
            <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 dark:text-amber-200">
                حسابك بانتظار اعتماد الإدارة
              </p>
              <p className="text-sm text-amber-800/80 dark:text-amber-300/80">
                يمكنك إعداد بيانات شركتك وبرامجك من الآن. ستظهر برامجك للزوار بعد اعتماد الإدارة.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Map} label="إجمالي البرامج" value={stats.total} tone="default" />
        <StatCard icon={CheckCircle2} label="معتمدة" value={stats.approved} tone="success" />
        <StatCard icon={Clock} label="قيد المراجعة" value={stats.pending} tone="warning" />
        <StatCard icon={CalendarCheck} label="الحجوزات" value={stats.bookings} tone="info" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>روابط سريعة</CardTitle>
        </CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3">
          <Link to="/tourism-portal/programs" className="rounded-lg border p-4 hover:bg-muted transition">
            <p className="font-semibold">إدارة برامجي</p>
            <p className="text-sm text-muted-foreground">إضافة، تعديل، أو حذف برامجك السياحية</p>
          </Link>
          <Link to="/tourism-portal/company" className="rounded-lg border p-4 hover:bg-muted transition">
            <p className="font-semibold">ملف الشركة</p>
            <p className="text-sm text-muted-foreground">حدّث بيانات الاتصال والوصف والشعار</p>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: any;
  label: string;
  value: number;
  tone: 'default' | 'success' | 'warning' | 'info';
}) {
  const tones: Record<string, string> = {
    default: 'bg-muted text-foreground',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300',
    info: 'bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300',
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`p-2 rounded-lg ${tones[tone]}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}