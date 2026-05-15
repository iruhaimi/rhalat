import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, XCircle, Plane, Clock, Search, RefreshCw, Loader2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';
import {
  AdminTable,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
  EmailCell,
} from '@/components/admin/AdminTable';

interface TourOperator {
  id: string;
  user_id: string;
  company_name: string;
  email: string | null;
  phone: string | null;
  whatsapp_number: string | null;
  city: string | null;
  country: string | null;
  is_verified: boolean;
  is_active: boolean;
  verified_at: string | null;
  created_at: string;
}

export default function TourOperatorsApproval() {
  const { user } = useAuth();
  const [operators, setOperators] = useState<TourOperator[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState<TourOperator | null>(null);

  const fetchOperators = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tour_operators')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error(error);
      toast.error('تعذّر تحميل الوكلاء السياحيين');
    } else {
      setOperators((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  const stats = useMemo(() => {
    const pending = operators.filter((o) => !o.is_verified).length;
    const verified = operators.filter((o) => o.is_verified).length;
    return { total: operators.length, pending, verified };
  }, [operators]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return operators;
    return operators.filter(
      (o) =>
        o.company_name?.toLowerCase().includes(q) ||
        o.email?.toLowerCase().includes(q) ||
        o.phone?.includes(q) ||
        o.city?.toLowerCase().includes(q),
    );
  }, [operators, search]);

  const approve = async (op: TourOperator) => {
    if (!user) return;
    setActioningId(op.id);
    const { error } = await supabase
      .from('tour_operators')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      })
      .eq('id', op.id);
    if (error) {
      toast.error('فشل اعتماد الحساب: ' + error.message);
    } else {
      toast.success(`تم اعتماد "${op.company_name}"`);
      // Send a notification to the operator (best-effort)
      await supabase.from('notifications').insert({
        user_id: op.user_id,
        title: 'تم اعتماد حسابك',
        message: 'مبارك! تم اعتماد حسابك كوكيل سياحي. يمكنك الآن نشر برامجك.',
        type: 'success',
        action_url: '/tourism-portal',
      });
      fetchOperators();
    }
    setActioningId(null);
  };

  const revoke = async (op: TourOperator) => {
    if (!user) return;
    setActioningId(op.id);
    const { error } = await supabase
      .from('tour_operators')
      .update({ is_verified: false, verified_at: null, verified_by: null })
      .eq('id', op.id);
    if (error) {
      toast.error('فشل سحب الاعتماد: ' + error.message);
    } else {
      toast.success(`تم سحب اعتماد "${op.company_name}"`);
      fetchOperators();
    }
    setActioningId(null);
    setConfirmRevoke(null);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="اعتماد الوكلاء السياحيين"
        description="مراجعة طلبات تسجيل الوكلاء السياحيين الجدد واعتمادهم لنشر برامجهم على المنصة"
        icon={Plane}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="بانتظار الاعتماد" value={stats.pending} icon={Clock} tone="warning" index={0} />
        <StatCard label="معتمدون" value={stats.verified} icon={CheckCircle2} tone="success" index={1} />
        <StatCard label="إجمالي الوكلاء" value={stats.total} icon={Plane} tone="primary" index={2} />
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="بحث بالشركة أو البريد أو المدينة"
                className="pr-9"
              />
            </div>
            <Button variant="outline" size="sm" onClick={fetchOperators} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Plane className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لا يوجد وكلاء سياحيون مطابقون</p>
            </div>
          ) : (
            <AdminTable
              minWidth="1100px"
              columns={[
                { width: '260px', label: 'الشركة' },
                { width: '260px', label: 'البريد الإلكتروني' },
                { width: '140px', label: 'الجوال' },
                { width: '140px', label: 'المدينة' },
                { width: '160px', label: 'تاريخ التسجيل' },
                { width: '120px', label: 'الحالة' },
                { width: '180px', label: 'إجراءات' },
              ]}
            >
              <AdminTableBody>
                {filtered.map((op) => (
                  <AdminTableRow key={op.id} className="h-[68px]">
                    <AdminTableCell className="align-middle">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/10 flex items-center justify-center">
                          <Plane className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate" title={op.company_name}>
                            {op.company_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate" dir="ltr">
                            {op.user_id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </AdminTableCell>
                    <AdminTableCell className="align-middle">
                      <EmailCell email={op.email} />
                    </AdminTableCell>
                    <AdminTableCell dir="ltr" className="text-right text-sm tabular-nums align-middle">
                      {op.phone || '-'}
                    </AdminTableCell>
                    <AdminTableCell className="align-middle text-sm truncate">
                      {op.city || '-'}
                    </AdminTableCell>
                    <AdminTableCell className="align-middle text-sm whitespace-nowrap">
                      {format(new Date(op.created_at), 'dd MMM yyyy', { locale: ar })}
                    </AdminTableCell>
                    <AdminTableCell className="align-middle">
                      {op.is_verified ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3 ml-1" />
                          معتمد
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                          <Clock className="h-3 w-3 ml-1" />
                          بانتظار التفعيل
                        </Badge>
                      )}
                    </AdminTableCell>
                    <AdminTableCell className="align-middle">
                      <div className="flex items-center gap-2">
                        {op.is_verified ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={actioningId === op.id}
                            onClick={() => setConfirmRevoke(op)}
                          >
                            <XCircle className="h-4 w-4 ml-1" />
                            سحب الاعتماد
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={actioningId === op.id}
                            onClick={() => approve(op)}
                          >
                            {actioningId === op.id ? (
                              <Loader2 className="h-4 w-4 ml-1 animate-spin" />
                            ) : (
                              <CheckCircle2 className="h-4 w-4 ml-1" />
                            )}
                            اعتماد
                          </Button>
                        )}
                      </div>
                    </AdminTableCell>
                  </AdminTableRow>
                ))}
              </AdminTableBody>
            </AdminTable>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmRevoke} onOpenChange={(o) => !o && setConfirmRevoke(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>سحب اعتماد الوكيل السياحي؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إخفاء برامج "{confirmRevoke?.company_name}" عن الزوار حتى يُعتمد الحساب مجدداً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmRevoke && revoke(confirmRevoke)}>
              سحب الاعتماد
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}