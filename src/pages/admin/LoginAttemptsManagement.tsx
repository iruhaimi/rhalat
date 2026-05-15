import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { AdminTable, EmailCell } from '@/components/admin/AdminTable';
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
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Search,
  Unlock,
  Trash2,
  RefreshCw,
  Monitor,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Download,
} from 'lucide-react';
import { exportToExcel } from '@/lib/exportToExcel';

interface LoginAttempt {
  id: string;
  email: string;
  success: boolean;
  failure_reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface LockedAccount {
  email: string;
  failedCount: number;
  lastAttempt: string;
}

export default function LoginAttemptsManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [unlockEmail, setUnlockEmail] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Fetch all login attempts
  const { data: attempts = [], isLoading, refetch } = useQuery({
    queryKey: ['login-attempts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_login_attempts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as LoginAttempt[];
    },
  });

  // Calculate locked accounts (5+ failed attempts in last 15 minutes)
  const lockedAccounts: LockedAccount[] = (() => {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
    const emailCounts: Record<string, { count: number; lastAttempt: string }> = {};

    attempts
      .filter(a => !a.success && new Date(a.created_at) > fifteenMinutesAgo)
      .forEach(a => {
        if (!emailCounts[a.email]) {
          emailCounts[a.email] = { count: 0, lastAttempt: a.created_at };
        }
        emailCounts[a.email].count++;
        if (new Date(a.created_at) > new Date(emailCounts[a.email].lastAttempt)) {
          emailCounts[a.email].lastAttempt = a.created_at;
        }
      });

    return Object.entries(emailCounts)
      .filter(([_, data]) => data.count >= 5)
      .map(([email, data]) => ({
        email,
        failedCount: data.count,
        lastAttempt: data.lastAttempt,
      }));
  })();

  // Unlock account mutation (delete failed attempts for email)
  const unlockMutation = useMutation({
    mutationFn: async (email: string) => {
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      
      const { error } = await supabase
        .from('staff_login_attempts')
        .delete()
        .eq('email', email)
        .eq('success', false)
        .gte('created_at', fifteenMinutesAgo);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم فك قفل الحساب بنجاح');
      queryClient.invalidateQueries({ queryKey: ['login-attempts'] });
      setUnlockEmail(null);
    },
    onError: () => {
      toast.error('حدث خطأ في فك قفل الحساب');
    },
  });

  // Delete single attempt mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('staff_login_attempts')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم حذف السجل بنجاح');
      queryClient.invalidateQueries({ queryKey: ['login-attempts'] });
      setDeleteId(null);
    },
    onError: () => {
      toast.error('حدث خطأ في حذف السجل');
    },
  });

  // Filter attempts by search term
  const filteredAttempts = attempts.filter(a =>
    a.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.ip_address?.includes(searchTerm) ||
    a.failure_reason?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats
  const totalAttempts = attempts.length;
  const failedAttempts = attempts.filter(a => !a.success).length;
  const successfulAttempts = attempts.filter(a => a.success).length;
  const today = new Date().toDateString();
  const todayAttempts = attempts.filter(a => new Date(a.created_at).toDateString() === today).length;

  // Export to Excel
  const handleExportToExcel = async () => {
    const data = filteredAttempts.map(a => ({
      email: a.email,
      status: a.success ? 'ناجح' : 'فاشل',
      failure_reason: a.failure_reason || '-',
      ip_address: a.ip_address || '-',
      user_agent: a.user_agent?.substring(0, 50) || '-',
      created_at: format(new Date(a.created_at), 'yyyy/MM/dd HH:mm:ss'),
    }));

    await exportToExcel({
      sheetName: 'محاولات الدخول',
      fileName: `login-attempts-${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
      columns: [
        { header: 'البريد الإلكتروني', key: 'email', width: 30 },
        { header: 'الحالة', key: 'status', width: 10 },
        { header: 'سبب الفشل', key: 'failure_reason', width: 25 },
        { header: 'عنوان IP', key: 'ip_address', width: 15 },
        { header: 'المتصفح', key: 'user_agent', width: 50 },
        { header: 'التاريخ', key: 'created_at', width: 20 },
      ],
      data,
    });
    toast.success('تم تصدير البيانات بنجاح');
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ShieldAlert className="h-7 w-7 text-primary" />
            سجل محاولات الدخول
          </h1>
          <p className="text-muted-foreground mt-1">
            مراقبة وإدارة محاولات تسجيل الدخول لبوابة الموظفين
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportToExcel}>
            <Download className="h-4 w-4 ml-2" />
            تصدير Excel
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي المحاولات</p>
                <p className="text-2xl font-bold">{totalAttempts}</p>
              </div>
              <Shield className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">محاولات ناجحة</p>
                <p className="text-2xl font-bold text-green-600">{successfulAttempts}</p>
              </div>
              <ShieldCheck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">محاولات فاشلة</p>
                <p className="text-2xl font-bold text-red-600">{failedAttempts}</p>
              </div>
              <ShieldAlert className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">حسابات مقفلة</p>
                <p className="text-2xl font-bold text-amber-600">{lockedAccounts.length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Locked Accounts Alert */}
      {lockedAccounts.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              حسابات مقفلة حالياً ({lockedAccounts.length})
            </CardTitle>
            <CardDescription>
              هذه الحسابات مقفلة بسبب كثرة محاولات الدخول الفاشلة (5+ محاولات في 15 دقيقة)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lockedAccounts.map((account) => (
                <div
                  key={account.email}
                  className="flex items-center justify-between p-3 rounded-lg bg-background border"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-amber-500/10">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium" dir="ltr">{account.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {account.failedCount} محاولات فاشلة • آخر محاولة:{' '}
                        {format(new Date(account.lastAttempt), 'HH:mm:ss', { locale: ar })}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={() => setUnlockEmail(account.email)}
                  >
                    <Unlock className="h-4 w-4 ml-1" />
                    فك القفل
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <CardTitle className="text-lg">سجل المحاولات</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالبريد أو IP..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredAttempts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد محاولات دخول مسجلة</p>
            </div>
          ) : (
            <AdminTable
              minWidth="1050px"
              columns={[
                { width: '280px', label: 'البريد الإلكتروني' },
                { width: '120px', label: 'الحالة' },
                { width: '220px', label: 'السبب' },
                { width: '140px', label: 'IP' },
                { width: '180px', label: 'التاريخ' },
                { width: '90px', label: 'إجراءات' },
              ]}
            >
                <TableBody>
                  {filteredAttempts.slice(0, 100).map((attempt) => (
                    <TableRow key={attempt.id} className="h-[60px]">
                      <TableCell className="align-middle">
                        <EmailCell email={attempt.email} />
                      </TableCell>
                      <TableCell className="align-middle">
                        {attempt.success ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                            <CheckCircle className="h-3 w-3 ml-1" />
                            ناجح
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                            <XCircle className="h-3 w-3 ml-1" />
                            فاشل
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="align-middle">
                        <span className="text-sm text-muted-foreground truncate block" title={attempt.failure_reason || ''}>
                          {attempt.failure_reason || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="align-middle">
                        <span dir="ltr" className="font-mono text-xs text-muted-foreground tabular-nums">
                          {attempt.ip_address || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground tabular-nums">
                          <Clock className="h-3 w-3" />
                          {format(new Date(attempt.created_at), 'yyyy/MM/dd HH:mm:ss')}
                        </div>
                      </TableCell>
                      <TableCell className="align-middle">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          onClick={() => setDeleteId(attempt.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </AdminTable>
          )}
          {filteredAttempts.length > 100 && (
            <p className="text-center text-sm text-muted-foreground py-4">
              يتم عرض أول 100 سجل من أصل {filteredAttempts.length}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Unlock Confirmation Dialog */}
      <AlertDialog open={!!unlockEmail} onOpenChange={() => setUnlockEmail(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد فك القفل</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من فك قفل الحساب{' '}
              <span className="font-medium text-foreground" dir="ltr">
                {unlockEmail}
              </span>
              ؟ سيتم حذف سجل المحاولات الفاشلة الأخيرة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => unlockEmail && unlockMutation.mutate(unlockEmail)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Unlock className="h-4 w-4 ml-2" />
              فك القفل
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا السجل؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 ml-2" />
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
