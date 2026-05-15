import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Loader2, 
  RefreshCw, 
  UserMinus, 
  FileCheck,
  CheckCircle,
  XCircle,
  Eye,
  Download,
  Clock,
  ArrowLeftRight,
  Archive,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import JSZip from 'jszip';
import { AgentPerformanceReport } from '@/components/admin/charts/AgentPerformanceReport';
import { UrgentTasksDashboard } from '@/components/admin/UrgentTasksDashboard';

interface TransferRequest {
  id: string;
  application_id: string;
  from_agent_id: string;
  to_agent_id: string;
  reason: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  from_agent: { full_name: string } | null;
  to_agent: { full_name: string } | null;
  application: {
    visa_type: {
      name: string;
      country: { name: string };
    };
    profile: { full_name: string };
  } | null;
}

interface WorkSubmission {
  id: string;
  application_id: string;
  agent_id: string;
  file_path: string;
  file_name: string;
  notes: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  agent: { full_name: string } | null;
  application: {
    visa_type: {
      name: string;
      country: { name: string };
    };
    profile: { full_name: string };
  } | null;
}

// Grouped work submissions for same application by same agent
interface GroupedWorkSubmission {
  application_id: string;
  agent_id: string;
  agent: { full_name: string } | null;
  application: WorkSubmission['application'];
  files: Array<{
    id: string;
    file_path: string;
    file_name: string;
    status: string;
    created_at: string;
  }>;
  notes: string | null;
  status: string;
  created_at: string;
  first_submission_id: string;
}

export default function AgentRequestsManagement() {
  const { profile } = useAuth();
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [workSubmissions, setWorkSubmissions] = useState<WorkSubmission[]>([]);
  const [groupedSubmissions, setGroupedSubmissions] = useState<GroupedWorkSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRequest | null>(null);
  const [selectedWorkGroup, setSelectedWorkGroup] = useState<GroupedWorkSubmission | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch transfer requests
      const { data: transfers } = await supabase
        .from('agent_transfer_requests')
        .select(`
          *,
          from_agent:profiles!agent_transfer_requests_from_agent_id_fkey(full_name),
          to_agent:profiles!agent_transfer_requests_to_agent_id_fkey(full_name),
          application:applications(
            visa_type:visa_types(
              name,
              country:countries(name)
            ),
            profile:profiles!applications_user_id_fkey(full_name)
          )
        `)
        .order('created_at', { ascending: false });

      setTransferRequests(transfers || []);

      // Fetch work submissions
      const { data: submissions } = await supabase
        .from('agent_work_submissions')
        .select(`
          *,
          agent:profiles!agent_work_submissions_agent_id_fkey(full_name),
          application:applications(
            visa_type:visa_types(
              name,
              country:countries(name)
            ),
            profile:profiles!applications_user_id_fkey(full_name)
          )
        `)
        .order('created_at', { ascending: false });

      setWorkSubmissions(submissions || []);

      // Group submissions by application_id + agent_id to show multiple files together
      const grouped = groupWorkSubmissions(submissions || []);
      setGroupedSubmissions(grouped);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // Group work submissions by application and agent
  const groupWorkSubmissions = (submissions: WorkSubmission[]): GroupedWorkSubmission[] => {
    const groupMap = new Map<string, GroupedWorkSubmission>();
    
    for (const sub of submissions) {
      const key = `${sub.application_id}-${sub.agent_id}`;
      
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          application_id: sub.application_id,
          agent_id: sub.agent_id,
          agent: sub.agent,
          application: sub.application,
          files: [],
          notes: sub.notes,
          status: sub.status,
          created_at: sub.created_at,
          first_submission_id: sub.id,
        });
      }
      
      const group = groupMap.get(key)!;
      group.files.push({
        id: sub.id,
        file_path: sub.file_path,
        file_name: sub.file_name,
        status: sub.status,
        created_at: sub.created_at,
      });
      
      // Keep the earliest notes if any
      if (!group.notes && sub.notes) {
        group.notes = sub.notes;
      }
      
      // Status is pending if any file is pending
      if (sub.status === 'pending') {
        group.status = 'pending';
      }
    }
    
    return Array.from(groupMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  const handleTransferAction = async (action: 'approved' | 'rejected') => {
    if (!selectedTransfer || !profile) return;

    setProcessing(true);
    try {
      // Update transfer request status
      const { error: updateError } = await supabase
        .from('agent_transfer_requests')
        .update({
          status: action,
          admin_notes: adminNotes.trim() || null,
          reviewed_by: profile.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedTransfer.id);

      if (updateError) throw updateError;

      // If approved, update the application's assigned agent
      if (action === 'approved') {
        const { error: appError } = await supabase
          .from('applications')
          .update({ assigned_agent_id: selectedTransfer.to_agent_id })
          .eq('id', selectedTransfer.application_id);

        if (appError) throw appError;
      }

      // Notify agents
      const statusLabel = action === 'approved' ? 'تمت الموافقة على' : 'تم رفض';
      
      // Notify from_agent
      await supabase.from('notifications').insert({
        user_id: selectedTransfer.from_agent_id,
        title: action === 'approved' ? '✅ تمت الموافقة على طلب التحويل' : '❌ تم رفض طلب التحويل',
        message: `${statusLabel} طلب تحويل الطلب للوكيل ${selectedTransfer.to_agent?.full_name || ''}`,
        type: 'transfer_response',
        action_url: `/agent/applications/${selectedTransfer.application_id}`,
      });

      // Notify to_agent if approved
      if (action === 'approved') {
        await supabase.from('notifications').insert({
          user_id: selectedTransfer.to_agent_id,
          title: '📋 تم تعيين طلب جديد لك',
          message: `تم تحويل طلب ${selectedTransfer.application?.profile?.full_name || ''} إليك`,
          type: 'assignment',
          action_url: `/agent/applications/${selectedTransfer.application_id}`,
        });
      }

      toast.success(action === 'approved' ? 'تمت الموافقة على طلب التحويل' : 'تم رفض طلب التحويل');
      setSelectedTransfer(null);
      setAdminNotes('');
      fetchData();
    } catch (error) {
      console.error('Error processing transfer:', error);
      toast.error('حدث خطأ في معالجة الطلب');
    } finally {
      setProcessing(false);
    }
  };

  const handleWorkAction = async (action: 'approved' | 'returned') => {
    if (!selectedWorkGroup || !profile) return;

    setProcessing(true);
    try {
      // Update all files in this group
      for (const file of selectedWorkGroup.files) {
        const { error: updateError } = await supabase
          .from('agent_work_submissions')
          .update({
            status: action,
            admin_notes: adminNotes.trim() || null,
            reviewed_by: profile.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', file.id);

        if (updateError) throw updateError;
      }

      // Notify agent
      await supabase.from('notifications').insert({
        user_id: selectedWorkGroup.agent_id,
        title: action === 'approved' ? '✅ تم التأكيد على إتمام العمل' : '🔄 تم إعادة الطلب للمراجعة',
        message: action === 'approved' 
          ? `تم التأكيد على إتمام عملك على الطلب بنجاح (${selectedWorkGroup.files.length} ملفات)`
          : `تم إعادة الطلب إليك للمراجعة: ${adminNotes || 'يرجى المراجعة'}`,
        type: 'work_response',
        action_url: `/agent/applications/${selectedWorkGroup.application_id}`,
      });

      toast.success(action === 'approved' ? 'تم التأكيد على إتمام العمل' : 'تم إعادة الطلب للوكيل');
      setSelectedWorkGroup(null);
      setAdminNotes('');
      fetchData();
    } catch (error) {
      console.error('Error processing work submission:', error);
      toast.error('حدث خطأ في معالجة الطلب');
    } finally {
      setProcessing(false);
    }
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('حدث خطأ في تحميل الملف');
    }
  };

  const [downloadingZip, setDownloadingZip] = useState(false);

  const downloadAllAsZip = async (group: GroupedWorkSubmission) => {
    if (!group.files.length) return;
    
    setDownloadingZip(true);
    try {
      const zip = new JSZip();
      
      for (const file of group.files) {
        const { data, error } = await supabase.storage
          .from('documents')
          .download(file.file_path);
        
        if (error) {
          console.error(`Error downloading ${file.file_name}:`, error);
          continue;
        }
        
        zip.file(file.file_name, data);
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const applicantName = group.application?.profile?.full_name || 'طلب';
      const countryName = group.application?.visa_type?.country?.name || '';
      const zipFileName = `ملفات_إتمام_${applicantName}_${countryName}.zip`;
      
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = zipFileName;
      a.click();
      URL.revokeObjectURL(url);
      
      toast.success(`تم تحميل ${group.files.length} ملفات بنجاح`);
    } catch (error) {
      console.error('Error creating ZIP:', error);
      toast.error('حدث خطأ في إنشاء الملف المضغوط');
    } finally {
      setDownloadingZip(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      pending: { label: 'قيد الانتظار', className: 'bg-warning/10 text-warning' },
      approved: { label: 'موافق عليه', className: 'bg-success/10 text-success' },
      rejected: { label: 'مرفوض', className: 'bg-destructive/10 text-destructive' },
      returned: { label: 'معاد للمراجعة', className: 'bg-warning/10 text-warning' },
    };
    const { label, className } = config[status] || config.pending;
    return <Badge className={className}>{label}</Badge>;
  };

  const pendingTransfers = transferRequests.filter(t => t.status === 'pending');
  const pendingWorkGroups = groupedSubmissions.filter(g => g.status === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">طلبات الوكلاء</h2>
          <p className="text-muted-foreground">إدارة طلبات التحويل وتأكيدات إتمام العمل</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 ml-2" />
          تحديث
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <ArrowLeftRight className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingTransfers.length}</p>
                <p className="text-xs text-muted-foreground">طلبات تحويل معلقة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingWorkGroups.length}</p>
                <p className="text-xs text-muted-foreground">ملفات إتمام معلقة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <UserMinus className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{transferRequests.length}</p>
                <p className="text-xs text-muted-foreground">إجمالي طلبات التحويل</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <FileCheck className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold">{workSubmissions.length}</p>
                <p className="text-xs text-muted-foreground">إجمالي ملفات الإتمام</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="urgent" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="urgent" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            المهام العاجلة
          </TabsTrigger>
          <TabsTrigger value="transfers" className="gap-2">
            <UserMinus className="h-4 w-4" />
            طلبات التحويل
            {pendingTransfers.length > 0 && (
              <Badge variant="destructive" className="mr-2">{pendingTransfers.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="work" className="gap-2">
            <FileCheck className="h-4 w-4" />
            ملفات إتمام العمل
            {pendingWorkGroups.length > 0 && (
              <Badge variant="destructive" className="mr-2">{pendingWorkGroups.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            تقرير الأداء
          </TabsTrigger>
        </TabsList>

        {/* Urgent Tasks Tab */}
        <TabsContent value="urgent">
          <UrgentTasksDashboard />
        </TabsContent>

        {/* Transfer Requests Tab */}
        <TabsContent value="transfers">
          <Card>
            <CardHeader>
              <CardTitle>طلبات تحويل الطلبات</CardTitle>
            </CardHeader>
            <CardContent>
              {transferRequests.length === 0 ? (
                <div className="text-center py-8">
                  <UserMinus className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">لا توجد طلبات تحويل</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table className="table-fixed w-full" style={{ minWidth: '1100px' }}>
                    <colgroup>
                      <col style={{ width: '220px' }} />
                      <col style={{ width: '160px' }} />
                      <col style={{ width: '160px' }} />
                      <col style={{ width: '220px' }} />
                      <col style={{ width: '140px' }} />
                      <col style={{ width: '120px' }} />
                      <col style={{ width: '120px' }} />
                    </colgroup>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-right font-semibold">الطلب</TableHead>
                        <TableHead className="text-right font-semibold">من وكيل</TableHead>
                        <TableHead className="text-right font-semibold">إلى وكيل</TableHead>
                        <TableHead className="text-right font-semibold">السبب</TableHead>
                        <TableHead className="text-right font-semibold">التاريخ</TableHead>
                        <TableHead className="text-right font-semibold">الحالة</TableHead>
                        <TableHead className="text-right font-semibold">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transferRequests.map((transfer) => (
                        <TableRow key={transfer.id} className="h-[68px]">
                          <TableCell className="align-middle">
                            <Link 
                              to={`/admin/applications/${transfer.application_id}`}
                              className="text-primary hover:underline block min-w-0"
                            >
                              <span className="truncate block">{transfer.application?.profile?.full_name || '-'}</span>
                              <br />
                              <span className="text-xs text-muted-foreground truncate block">
                                {transfer.application?.visa_type?.country?.name}
                              </span>
                            </Link>
                          </TableCell>
                          <TableCell className="align-middle truncate">{transfer.from_agent?.full_name || '-'}</TableCell>
                          <TableCell className="align-middle truncate">{transfer.to_agent?.full_name || '-'}</TableCell>
                          <TableCell className="align-middle truncate" title={transfer.reason}>{transfer.reason}</TableCell>
                          <TableCell className="text-sm align-middle whitespace-nowrap">
                            {format(new Date(transfer.created_at), 'dd MMM yyyy', { locale: ar })}
                          </TableCell>
                          <TableCell className="align-middle">{getStatusBadge(transfer.status)}</TableCell>
                          <TableCell className="align-middle">
                            {transfer.status === 'pending' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedTransfer(transfer);
                                  setAdminNotes('');
                                }}
                              >
                                <Eye className="h-4 w-4 ml-1" />
                                مراجعة
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">تمت المراجعة</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Work Submissions Tab */}
        <TabsContent value="work">
          <Card>
            <CardHeader>
              <CardTitle>ملفات إتمام العمل</CardTitle>
            </CardHeader>
            <CardContent>
              {groupedSubmissions.length === 0 ? (
                <div className="text-center py-8">
                  <FileCheck className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">لا توجد ملفات إتمام</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <Table className="table-fixed w-full" style={{ minWidth: '1100px' }}>
                    <colgroup>
                      <col style={{ width: '220px' }} />
                      <col style={{ width: '160px' }} />
                      <col style={{ width: '140px' }} />
                      <col style={{ width: '220px' }} />
                      <col style={{ width: '140px' }} />
                      <col style={{ width: '120px' }} />
                      <col style={{ width: '120px' }} />
                    </colgroup>
                    <TableHeader>
                      <TableRow className="bg-muted/50 hover:bg-muted/50">
                        <TableHead className="text-right font-semibold">الطلب</TableHead>
                        <TableHead className="text-right font-semibold">الوكيل</TableHead>
                        <TableHead className="text-right font-semibold">الملفات</TableHead>
                        <TableHead className="text-right font-semibold">ملاحظات</TableHead>
                        <TableHead className="text-right font-semibold">التاريخ</TableHead>
                        <TableHead className="text-right font-semibold">الحالة</TableHead>
                        <TableHead className="text-right font-semibold">إجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupedSubmissions.map((group) => (
                        <TableRow key={`${group.application_id}-${group.agent_id}`} className="h-[68px]">
                          <TableCell className="align-middle">
                            <Link 
                              to={`/admin/applications/${group.application_id}`}
                              className="text-primary hover:underline block min-w-0"
                            >
                              <span className="truncate block">{group.application?.profile?.full_name || '-'}</span>
                              <br />
                              <span className="text-xs text-muted-foreground truncate block">
                                {group.application?.visa_type?.country?.name}
                              </span>
                            </Link>
                          </TableCell>
                          <TableCell className="align-middle truncate">{group.agent?.full_name || '-'}</TableCell>
                          <TableCell className="align-middle">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="gap-1">
                                <FileCheck className="h-3 w-3" />
                                {group.files.length} ملفات
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="align-middle truncate" title={group.notes || ''}>
                            {group.notes || '-'}
                          </TableCell>
                          <TableCell className="text-sm align-middle whitespace-nowrap">
                            {format(new Date(group.created_at), 'dd MMM yyyy', { locale: ar })}
                          </TableCell>
                          <TableCell className="align-middle">{getStatusBadge(group.status)}</TableCell>
                          <TableCell className="align-middle">
                            {group.status === 'pending' ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedWorkGroup(group);
                                  setAdminNotes('');
                                }}
                              >
                                <Eye className="h-4 w-4 ml-1" />
                                مراجعة
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">تمت المراجعة</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Report Tab */}
        <TabsContent value="performance">
          <AgentPerformanceReport />
        </TabsContent>
      </Tabs>

      {/* Transfer Review Dialog */}
      <Dialog open={!!selectedTransfer} onOpenChange={() => setSelectedTransfer(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserMinus className="h-5 w-5" />
              مراجعة طلب التحويل
            </DialogTitle>
          </DialogHeader>
          {selectedTransfer && (
            <div className="space-y-4 py-4">
              <div className="grid gap-3">
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">من وكيل:</span>
                  <span className="font-medium">{selectedTransfer.from_agent?.full_name}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">إلى وكيل:</span>
                  <span className="font-medium">{selectedTransfer.to_agent?.full_name}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">الطلب:</span>
                  <span className="font-medium">
                    {selectedTransfer.application?.profile?.full_name} - {selectedTransfer.application?.visa_type?.country?.name}
                  </span>
                </div>
              </div>
              
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground mb-1">سبب التحويل:</p>
                <p className="text-sm">{selectedTransfer.reason}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">ملاحظات المشرف (اختياري)</label>
                <Textarea
                  placeholder="أضف ملاحظات..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedTransfer(null)}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleTransferAction('rejected')}
              disabled={processing}
            >
              {processing && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              <XCircle className="h-4 w-4 ml-1" />
              رفض
            </Button>
            <Button
              onClick={() => handleTransferAction('approved')}
              disabled={processing}
            >
              {processing && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              <CheckCircle className="h-4 w-4 ml-1" />
              موافقة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Work Review Dialog - Updated for multiple files */}
      <Dialog open={!!selectedWorkGroup} onOpenChange={() => setSelectedWorkGroup(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              مراجعة ملفات إتمام العمل
              {selectedWorkGroup && (
                <Badge variant="secondary">{selectedWorkGroup.files.length} ملفات</Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          {selectedWorkGroup && (
            <div className="space-y-4 py-4">
              <div className="grid gap-3">
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">الوكيل:</span>
                  <span className="font-medium">{selectedWorkGroup.agent?.full_name}</span>
                </div>
                <div className="flex justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">الطلب:</span>
                  <span className="font-medium">
                    {selectedWorkGroup.application?.profile?.full_name} - {selectedWorkGroup.application?.visa_type?.country?.name}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg border space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">الملفات المرفقة ({selectedWorkGroup.files.length}):</p>
                  {selectedWorkGroup.files.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadAllAsZip(selectedWorkGroup)}
                      disabled={downloadingZip}
                      className="gap-2"
                    >
                      {downloadingZip ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Archive className="h-4 w-4" />
                      )}
                      تحميل الكل (ZIP)
                    </Button>
                  )}
                </div>
                <ScrollArea className="max-h-[200px]">
                  <div className="space-y-2">
                    {selectedWorkGroup.files.map((file, index) => (
                      <Button
                        key={file.id}
                        variant="outline"
                        className="w-full justify-start gap-2"
                        onClick={() => downloadFile(file.file_path, file.file_name)}
                      >
                        <Download className="h-4 w-4 shrink-0" />
                        <span className="truncate flex-1 text-right">{file.file_name}</span>
                        <Badge variant="secondary" className="shrink-0">{index + 1}</Badge>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {selectedWorkGroup.notes && (
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">ملاحظات الوكيل:</p>
                  <p className="text-sm">{selectedWorkGroup.notes}</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">ملاحظات المشرف (مطلوب للإعادة)</label>
                <Textarea
                  placeholder="أضف ملاحظات توضح سبب الإعادة أو التأكيد..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedWorkGroup(null)}>
              إلغاء
            </Button>
            <Button
              variant="outline"
              onClick={() => handleWorkAction('returned')}
              disabled={processing || !adminNotes.trim()}
            >
              {processing && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              <Clock className="h-4 w-4 ml-1" />
              إعادة للمراجعة
            </Button>
            <Button
              onClick={() => handleWorkAction('approved')}
              disabled={processing}
            >
              {processing && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              <CheckCircle className="h-4 w-4 ml-1" />
              تأكيد الإتمام
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
