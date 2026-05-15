import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { AdminTable, EmailCell } from '@/components/admin/AdminTable';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
  UserCheck,
  Search,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Shield,
  User,
} from 'lucide-react';

interface UnlockRequest {
  id: string;
  user_id: string;
  email: string;
  reason: string;
  status: string;
  requested_at: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  reviewer_notes: string | null;
}

export default function UnlockRequestsManagement() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<UnlockRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [action, setAction] = useState<'approve' | 'reject' | null>(null);

  // Fetch unlock requests
  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ['unlock-requests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_unlock_requests')
        .select('*')
        .order('requested_at', { ascending: false });

      if (error) throw error;
      return data as UnlockRequest[];
    },
  });

  // Review request mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, notes, email }: { id: string; status: 'approved' | 'rejected'; notes: string; email: string }) => {
      // Get current user's profile ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // Update request
      const { error: updateError } = await supabase
        .from('account_unlock_requests')
        .update({
          status,
          reviewer_notes: notes,
          reviewed_by: profile?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) throw updateError;

      // If approved, clear failed login attempts
      if (status === 'approved') {
        await supabase.rpc('clear_failed_login_attempts', { target_email: email });
      }
    },
    onSuccess: (_, variables) => {
      toast.success(variables.status === 'approved' ? 'تم الموافقة وفك قفل الحساب' : 'تم رفض الطلب');
      queryClient.invalidateQueries({ queryKey: ['unlock-requests'] });
      queryClient.invalidateQueries({ queryKey: ['login-attempts'] });
      setSelectedRequest(null);
      setReviewNotes('');
      setAction(null);
    },
    onError: () => {
      toast.error('حدث خطأ في معالجة الطلب');
    },
  });

  // Filter requests
  const filteredRequests = requests.filter(r =>
    r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  const handleReview = (request: UnlockRequest, reviewAction: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setAction(reviewAction);
    setReviewNotes('');
  };

  const submitReview = () => {
    if (!selectedRequest || !action) return;
    
    reviewMutation.mutate({
      id: selectedRequest.id,
      status: action === 'approve' ? 'approved' : 'rejected',
      notes: reviewNotes,
      email: selectedRequest.email,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">
            <Clock className="h-3 w-3 ml-1" />
            قيد الانتظار
          </Badge>
        );
      case 'approved':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
            <CheckCircle className="h-3 w-3 ml-1" />
            موافق عليه
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
            <XCircle className="h-3 w-3 ml-1" />
            مرفوض
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <UserCheck className="h-7 w-7 text-primary" />
            طلبات فك القفل
          </h1>
          <p className="text-muted-foreground mt-1">
            مراجعة طلبات فك قفل حسابات الموظفين
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 ml-2" />
          تحديث
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">قيد الانتظار</p>
                <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">موافق عليها</p>
                <p className="text-2xl font-bold text-green-600">{approvedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">مرفوضة</p>
                <p className="text-2xl font-bold text-red-600">{rejectedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Requests Alert */}
      {pendingCount > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              طلبات تحتاج مراجعتك ({pendingCount})
            </CardTitle>
            <CardDescription>
              هذه الطلبات من موظفين يحتاجون فك قفل حساباتهم
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <CardTitle className="text-lg">جميع الطلبات</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث..."
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
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>لا توجد طلبات فك قفل</p>
            </div>
          ) : (
            <AdminTable
              minWidth="900px"
              columns={[
                { width: '280px', label: 'البريد الإلكتروني' },
                { width: '260px', label: 'السبب' },
                { width: '130px', label: 'الحالة' },
                { width: '160px', label: 'تاريخ الطلب' },
                { width: '140px', label: 'إجراءات' },
              ]}
            >
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id} className="h-[60px]">
                      <TableCell className="align-middle">
                        <EmailCell email={request.email} />
                      </TableCell>
                      <TableCell className="align-middle">
                        <p className="text-sm text-muted-foreground truncate" title={request.reason}>
                          {request.reason}
                        </p>
                      </TableCell>
                      <TableCell className="align-middle">{getStatusBadge(request.status)}</TableCell>
                      <TableCell className="align-middle whitespace-nowrap">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground tabular-nums">
                          <Clock className="h-3 w-3" />
                          {format(new Date(request.requested_at), 'yyyy/MM/dd HH:mm')}
                        </div>
                      </TableCell>
                      <TableCell className="align-middle">
                        {request.status === 'pending' ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 hover:bg-green-50"
                              onClick={() => handleReview(request, 'approve')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => handleReview(request, 'reject')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {request.reviewed_at && format(new Date(request.reviewed_at), 'MM/dd HH:mm')}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </AdminTable>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {action === 'approve' ? 'تأكيد الموافقة' : 'تأكيد الرفض'}
            </DialogTitle>
            <DialogDescription>
              {action === 'approve'
                ? 'سيتم فك قفل الحساب وإتاحة الدخول للمستخدم.'
                : 'سيتم رفض الطلب وإعلام المستخدم.'}
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm font-medium">البريد الإلكتروني</p>
                <p className="text-sm text-muted-foreground" dir="ltr">{selectedRequest.email}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted">
                <p className="text-sm font-medium">سبب الطلب</p>
                <p className="text-sm text-muted-foreground">{selectedRequest.reason}</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ملاحظات المراجع (اختياري)</label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="أضف ملاحظاتك هنا..."
                  className="min-h-[80px]"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex-row-reverse gap-2">
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              إلغاء
            </Button>
            <Button
              onClick={submitReview}
              disabled={reviewMutation.isPending}
              className={action === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-destructive hover:bg-destructive/90'}
            >
              {reviewMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin ml-2" />
              ) : action === 'approve' ? (
                <CheckCircle className="h-4 w-4 ml-2" />
              ) : (
                <XCircle className="h-4 w-4 ml-2" />
              )}
              {action === 'approve' ? 'موافقة وفك القفل' : 'رفض الطلب'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
