import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RotateCcw,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Calendar,
  Mail,
  Phone,
  FileText,
  RefreshCw,
  Download
} from 'lucide-react';
import { exportToExcel } from '@/lib/exportToExcel';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';

type RefundRequest = {
  id: string;
  application_number: string;
  email: string;
  phone: string | null;
  reason: string;
  additional_details: string | null;
  status: string;
  admin_notes: string | null;
  processed_at: string | null;
  created_at: string;
};

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'قيد الانتظار', color: 'bg-amber-100 text-amber-800', icon: Clock },
  approved: { label: 'مقبول', color: 'bg-green-100 text-green-800', icon: CheckCircle2 },
  rejected: { label: 'مرفوض', color: 'bg-red-100 text-red-800', icon: XCircle },
  processing: { label: 'قيد المعالجة', color: 'bg-blue-100 text-blue-800', icon: RefreshCw },
};

export default function RefundRequestsManagement() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<RefundRequest | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');

  // Fetch refund requests
  const { data: requests, isLoading } = useQuery({
    queryKey: ['refund-requests', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('refund_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as RefundRequest[];
    },
  });

  // Update refund request mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes: string }) => {
      const { error } = await supabase
        .from('refund_requests')
        .update({
          status,
          admin_notes: notes,
          processed_at: new Date().toISOString(),
          processed_by: profile?.id,
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['refund-requests'] });
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث حالة الطلب بنجاح',
      });
      setIsDetailOpen(false);
      setSelectedRequest(null);
    },
    onError: (error) => {
      console.error('Error updating request:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث الطلب',
        variant: 'destructive',
      });
    },
  });

  // Filter requests by search
  const filteredRequests = requests?.filter((req) => {
    if (!searchQuery.trim()) return true;
    const search = searchQuery.toLowerCase();
    return (
      req.application_number.toLowerCase().includes(search) ||
      req.email.toLowerCase().includes(search) ||
      req.reason.toLowerCase().includes(search)
    );
  });

  const handleViewRequest = (request: RefundRequest) => {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || '');
    setNewStatus(request.status);
    setIsDetailOpen(true);
  };

  const handleUpdateRequest = () => {
    if (!selectedRequest) return;
    updateMutation.mutate({
      id: selectedRequest.id,
      status: newStatus,
      notes: adminNotes,
    });
  };

  // Export to Excel
  const handleExportExcel = async () => {
    if (!filteredRequests || filteredRequests.length === 0) {
      toast({
        title: 'لا توجد بيانات',
        description: 'لا توجد طلبات للتصدير',
        variant: 'destructive',
      });
      return;
    }

    const data = filteredRequests.map((req) => ({
      application_number: req.application_number,
      email: req.email,
      phone: req.phone || 'غير متوفر',
      reason: req.reason,
      additional_details: req.additional_details || '-',
      status: statusConfig[req.status]?.label || req.status,
      admin_notes: req.admin_notes || '-',
      created_at: format(new Date(req.created_at), 'dd/MM/yyyy HH:mm', { locale: ar }),
      processed_at: req.processed_at 
        ? format(new Date(req.processed_at), 'dd/MM/yyyy HH:mm', { locale: ar }) 
        : '-',
    }));

    await exportToExcel({
      sheetName: 'طلبات الاسترداد',
      fileName: `طلبات_الاسترداد_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
      columns: [
        { header: 'رقم الطلب', key: 'application_number', width: 15 },
        { header: 'البريد الإلكتروني', key: 'email', width: 25 },
        { header: 'رقم الهاتف', key: 'phone', width: 15 },
        { header: 'سبب الاسترداد', key: 'reason', width: 30 },
        { header: 'تفاصيل إضافية', key: 'additional_details', width: 40 },
        { header: 'الحالة', key: 'status', width: 12 },
        { header: 'ملاحظات المسؤول', key: 'admin_notes', width: 30 },
        { header: 'تاريخ التقديم', key: 'created_at', width: 18 },
        { header: 'تاريخ المعالجة', key: 'processed_at', width: 18 },
      ],
      data,
    });

    toast({
      title: 'تم التصدير',
      description: `تم تصدير ${filteredRequests.length} طلب بنجاح`,
    });
  };

  // Stats
  const stats = {
    total: requests?.length || 0,
    pending: requests?.filter((r) => r.status === 'pending').length || 0,
    approved: requests?.filter((r) => r.status === 'approved').length || 0,
    rejected: requests?.filter((r) => r.status === 'rejected').length || 0,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={RotateCcw}
        title="إدارة طلبات الاسترداد"
        description="مراجعة ومعالجة طلبات استرداد المبالغ من العملاء"
        actions={
          <Button onClick={handleExportExcel} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            تصدير إلى Excel
          </Button>
        }
      />

      <div data-admin-stats="true" className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="إجمالي الطلبات" value={stats.total} icon={FileText} tone="muted" index={0} />
        <StatCard label="قيد الانتظار" value={stats.pending} icon={Clock} tone="gold" index={1} />
        <StatCard label="مقبولة" value={stats.approved} icon={CheckCircle2} tone="success" index={2} />
        <StatCard label="مرفوضة" value={stats.rejected} icon={XCircle} tone="danger" index={3} />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="البحث برقم الطلب أو البريد الإلكتروني..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="تصفية بالحالة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الحالات</SelectItem>
                <SelectItem value="pending">قيد الانتظار</SelectItem>
                <SelectItem value="processing">قيد المعالجة</SelectItem>
                <SelectItem value="approved">مقبول</SelectItem>
                <SelectItem value="rejected">مرفوض</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>طلبات الاسترداد</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredRequests?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <RotateCcw className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد طلبات استرداد</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>رقم الطلب</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>السبب</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ التقديم</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests?.map((request) => {
                  const status = statusConfig[request.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  return (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.application_number}
                      </TableCell>
                      <TableCell>{request.email}</TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {request.reason}
                      </TableCell>
                      <TableCell>
                        <Badge className={status.color}>
                          <StatusIcon className="w-3 h-3 ml-1" />
                          {status.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.created_at), 'dd MMM yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewRequest(request)}
                        >
                          <Eye className="w-4 h-4 ml-1" />
                          عرض
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-primary" />
              تفاصيل طلب الاسترداد
            </DialogTitle>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-6">
              {/* Request Info */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">رقم الطلب</label>
                  <p className="font-medium">{selectedRequest.application_number}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">تاريخ التقديم</label>
                  <p className="font-medium flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {format(new Date(selectedRequest.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">البريد الإلكتروني</label>
                  <p className="font-medium flex items-center gap-1">
                    <Mail className="w-4 h-4" />
                    {selectedRequest.email}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">رقم الهاتف</label>
                  <p className="font-medium flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {selectedRequest.phone || 'غير متوفر'}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground">سبب الاسترداد</label>
                <div className="p-3 bg-muted rounded-lg">
                  <p>{selectedRequest.reason}</p>
                </div>
              </div>

              {/* Additional Details */}
              {selectedRequest.additional_details && (
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">تفاصيل إضافية</label>
                  <div className="p-3 bg-muted rounded-lg">
                    <p>{selectedRequest.additional_details}</p>
                  </div>
                </div>
              )}

              {/* Status Update */}
              <div className="space-y-2">
                <label className="text-sm font-medium">تحديث الحالة</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">قيد الانتظار</SelectItem>
                    <SelectItem value="processing">قيد المعالجة</SelectItem>
                    <SelectItem value="approved">مقبول</SelectItem>
                    <SelectItem value="rejected">مرفوض</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Admin Notes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">ملاحظات المسؤول</label>
                <Textarea
                  placeholder="أضف ملاحظاتك هنا..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDetailOpen(false)}>
              إلغاء
            </Button>
            <Button onClick={handleUpdateRequest} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-1" />
                  جاري الحفظ...
                </>
              ) : (
                'حفظ التغييرات'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
