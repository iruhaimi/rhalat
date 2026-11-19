import { useEffect, useState } from 'react';
import { useParams, Link } from '@/lib/router-compat';
import { supabase } from '@/integrations/supabase/client';
import type { TablesUpdate } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useDocumentAccessLog } from '@/hooks/useDocumentAccessLog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  ArrowRight,
  User,
  Plane,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Loader2,
  AlertCircle,
  Save,
  FileDown,
  UserMinus,
  FileCheck,
  Eye
} from 'lucide-react';
import { generateApplicationPDF } from '@/lib/generateApplicationPDF';
import { NotesHistory } from '@/components/admin/NotesHistory';
import { TransferRequestDialog } from '@/components/agent/TransferRequestDialog';
import { WorkSubmissionDialog } from '@/components/agent/WorkSubmissionDialog';
import { AgentRequestsHistory } from '@/components/agent/AgentRequestsHistory';
import { ApplicationMessages } from '@/components/messages/ApplicationMessages';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import type { ApplicationStatus } from '@/types/database';

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'under_review', label: 'قيد المراجعة' },
  { value: 'documents_required', label: 'مستندات مطلوبة' },
  { value: 'processing', label: 'قيد المعالجة' },
  { value: 'approved', label: 'معتمد' },
  { value: 'rejected', label: 'مرفوض' },
];

interface ApplicationData {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  submitted_at: string | null;
  travel_date: string | null;
  return_date: string | null;
  purpose_of_travel: string | null;
  accommodation_details: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  agent_notes: string | null;
  rejection_reason: string | null;
  visa_type: {
    name: string;
    price: number;
    processing_days: number;
    country: {
      name: string;
      code: string;
    };
  };
  profile: {
    full_name: string;
    phone: string;
    nationality: string;
    passport_number: string;
    passport_expiry: string;
    date_of_birth: string;
  };
}

interface Document {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  status: string;
  created_at: string;
}

interface StatusHistory {
  id: string;
  old_status: string | null;
  new_status: string;
  notes: string | null;
  created_at: string;
}

function InfoRow({ label, value, className = '' }: { label: string; value: string | null | undefined; className?: string }) {
  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value || '-'}</p>
    </div>
  );
}

export default function AgentApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const { profile: currentUserProfile } = useAuth();
  const { logDocumentAccess } = useDocumentAccessLog();
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Status change dialog
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<ApplicationStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Transfer and work submission dialogs
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [showWorkSubmissionDialog, setShowWorkSubmissionDialog] = useState(false);
  
  // Document preview
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Notes
  const [agentNotes, setAgentNotes] = useState('');

  useEffect(() => {
    if (id) {
      fetchApplicationData();
    }
  }, [id]);

  const fetchApplicationData = async () => {
    try {
      const { data: appData, error: appError } = await supabase
        .from('applications')
        .select(`
          *,
          visa_type:visa_types(
            name,
            price,
            processing_days,
            country:countries(name, code)
          ),
          profile:profiles!applications_user_id_fkey(
            full_name,
            phone,
            nationality,
            passport_number,
            passport_expiry,
            date_of_birth
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (appError) throw appError;
      
      if (!appData) {
        setLoading(false);
        return;
      }
      
      setApplication(appData as ApplicationData);
      setAgentNotes(appData.agent_notes || '');

      // Fetch documents
      const { data: docsData } = await supabase
        .from('application_documents')
        .select('*')
        .eq('application_id', id)
        .order('created_at', { ascending: false });
      
      setDocuments(docsData || []);

      // Fetch status history
      const { data: historyData } = await supabase
        .from('application_status_history')
        .select('*')
        .eq('application_id', id)
        .order('created_at', { ascending: false });
      
      setStatusHistory(historyData || []);
    } catch (error) {
      console.error('Error fetching application:', error);
      toast.error('حدث خطأ في تحميل بيانات الطلب');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus || !application) return;

    setUpdating(true);
    try {
      const updates: TablesUpdate<'applications'> = { status: newStatus as TablesUpdate<'applications'>['status'] };
      
      if (newStatus === 'rejected') {
        updates.rejection_reason = rejectionReason;
      }
      
      if (newStatus === 'approved') {
        updates.approved_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('applications')
        .update(updates)
        .eq('id', application.id);

      if (error) throw error;

      // Add history note if provided
      if (statusNote) {
        await supabase
          .from('application_status_history')
          .insert({
            application_id: application.id,
            old_status: application.status,
            new_status: newStatus,
            notes: statusNote,
            changed_by: currentUserProfile?.id,
          });
      }

      // Notify the customer about status change
      const { data: appOwnerData } = await supabase
        .from('applications')
        .select('user_id')
        .eq('id', application.id)
        .single();

      if (appOwnerData?.user_id) {
        const statusLabel = STATUS_OPTIONS.find(s => s.value === newStatus)?.label || newStatus;
        await supabase.from('notifications').insert({
          user_id: appOwnerData.user_id,
          title: 'تحديث حالة الطلب',
          message: `تم تحديث حالة طلبك إلى: ${statusLabel}`,
          type: 'status_update',
          action_url: `/track?id=${application.id}`,
        });
      }

      toast.success('تم تحديث حالة الطلب بنجاح');
      setShowStatusDialog(false);
      setNewStatus('');
      setStatusNote('');
      setRejectionReason('');
      fetchApplicationData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('حدث خطأ في تحديث الحالة');
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!application) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('applications')
        .update({ agent_notes: agentNotes })
        .eq('id', application.id);

      if (error) throw error;
      toast.success('تم حفظ الملاحظات بنجاح');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('حدث خطأ في حفظ الملاحظات');
    } finally {
      setUpdating(false);
    }
  };

  const downloadDocument = async (doc: Document) => {
    try {
      // Log document access
      if (id) {
        logDocumentAccess(doc.id, id, 'download', doc.document_type);
      }

      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('حدث خطأ في تحميل المستند');
    }
  };

  const viewDocument = async (doc: Document) => {
    try {
      // Log document access
      if (id) {
        logDocumentAccess(doc.id, id, 'view', doc.document_type);
      }

      const { data, error } = await supabase.storage
        .from('documents')
        .download(doc.file_path);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      setPreviewUrl(url);
      setPreviewDoc(doc);
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('حدث خطأ في عرض المستند');
    }
  };

  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewDoc(null);
  };

  const updateDocumentStatus = async (docId: string, status: 'verified' | 'rejected') => {
    try {
      // Log the update action
      const doc = documents.find(d => d.id === docId);
      if (doc && id) {
        logDocumentAccess(docId, id, 'update', doc.document_type);
      }

      const { error } = await supabase
        .from('application_documents')
        .update({ 
          status,
          verified_by: currentUserProfile?.id,
          verified_at: new Date().toISOString()
        })
        .eq('id', docId);

      if (error) throw error;
      toast.success(status === 'verified' ? 'تم التحقق من المستند' : 'تم رفض المستند');
      fetchApplicationData();
    } catch (error) {
      console.error('Error updating document status:', error);
      toast.error('حدث خطأ في تحديث حالة المستند');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: typeof Clock }> = {
      draft: { label: 'مسودة', className: 'bg-muted text-muted-foreground', icon: Clock },
      pending_payment: { label: 'بانتظار الدفع', className: 'bg-warning/10 text-warning', icon: Clock },
      submitted: { label: 'مقدم', className: 'bg-info/10 text-info', icon: FileText },
      under_review: { label: 'قيد المراجعة', className: 'bg-primary/10 text-primary', icon: Clock },
      documents_required: { label: 'مستندات مطلوبة', className: 'bg-warning/10 text-warning', icon: AlertCircle },
      processing: { label: 'قيد المعالجة', className: 'bg-primary/10 text-primary', icon: Clock },
      approved: { label: 'معتمد', className: 'bg-success/10 text-success', icon: CheckCircle },
      rejected: { label: 'مرفوض', className: 'bg-destructive/10 text-destructive', icon: XCircle },
      cancelled: { label: 'ملغي', className: 'bg-muted text-muted-foreground', icon: XCircle },
    };
    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${config.className}`}>
        <Icon className="h-4 w-4" />
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">لم يتم العثور على الطلب</p>
        <Button asChild className="mt-4">
          <Link to="/agent/applications">
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للقائمة
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card rounded-lg border p-4">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon" className="shrink-0">
            <Link to="/agent/applications">
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">تفاصيل الطلب</h2>
            <p className="text-muted-foreground font-mono text-xs sm:text-sm">{application.id}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mr-12 sm:mr-0">
          {getStatusBadge(application.status)}
          {application.status === 'approved' && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => generateApplicationPDF(application as any)}
            >
              <FileDown className="h-4 w-4 ml-2" />
              تحميل PDF
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowTransferDialog(true)}
          >
            <UserMinus className="h-4 w-4 ml-2" />
            طلب تحويل
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowWorkSubmissionDialog(true)}
          >
            <FileCheck className="h-4 w-4 ml-2" />
            تأكيد إتمام العمل
          </Button>
          <Button size="sm" onClick={() => setShowStatusDialog(true)}>
            تغيير الحالة
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Main Info - Takes 2 columns */}
        <div className="xl:col-span-2 space-y-6">
          {/* Applicant Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-primary" />
                معلومات مقدم الطلب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">الاسم الكامل</p>
                  <p className="font-medium">{application.profile?.full_name || '-'}</p>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">رقم الجوال</p>
                  <p className="font-medium" dir="ltr">{application.profile?.phone || '-'}</p>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">الجنسية</p>
                  <p className="font-medium">{application.profile?.nationality || '-'}</p>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">تاريخ الميلاد</p>
                  <p className="font-medium">{application.profile?.date_of_birth ? format(new Date(application.profile.date_of_birth), 'dd/MM/yyyy') : '-'}</p>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">رقم الجواز</p>
                  <p className="font-medium" dir="ltr">{application.profile?.passport_number || '-'}</p>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">تاريخ انتهاء الجواز</p>
                  <p className="font-medium">{application.profile?.passport_expiry ? format(new Date(application.profile.passport_expiry), 'dd/MM/yyyy') : '-'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visa Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plane className="h-5 w-5 text-primary" />
                معلومات التأشيرة المطلوبة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">الوجهة</p>
                  <p className="font-medium">{application.visa_type?.country?.name || '-'}</p>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">نوع التأشيرة</p>
                  <p className="font-medium">{application.visa_type?.name || '-'}</p>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">عدد المسافرين</p>
                  <p className="font-medium">1 مسافر</p>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">تاريخ السفر</p>
                  <p className="font-medium">{application.travel_date ? format(new Date(application.travel_date), 'dd/MM/yyyy') : '-'}</p>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">تاريخ العودة</p>
                  <p className="font-medium">{application.return_date ? format(new Date(application.return_date), 'dd/MM/yyyy') : '-'}</p>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-muted-foreground">تاريخ تقديم الطلب</p>
                  <p className="font-medium text-primary">
                    {application.submitted_at 
                      ? format(new Date(application.submitted_at), 'dd MMMM yyyy - HH:mm', { locale: ar })
                      : 'لم يتم التقديم بعد'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents & Status History in a row */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Documents */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  المستندات ({documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">لا توجد مستندات مرفقة</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div 
                        key={doc.id}
                        className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <FileText className="h-8 w-8 text-muted-foreground shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{doc.document_type}</p>
                            <p className="text-xs text-muted-foreground truncate">{doc.file_name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`rounded-full px-2 py-0.5 text-xs ${
                            doc.status === 'verified' 
                              ? 'bg-success/10 text-success' 
                              : doc.status === 'rejected'
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-warning/10 text-warning'
                          }`}>
                            {doc.status === 'verified' ? 'تم التحقق' : doc.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                          </span>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => viewDocument(doc)} title="معاينة">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => downloadDocument(doc)} title="تحميل">
                            <Download className="h-4 w-4" />
                          </Button>
                          {doc.status === 'pending' && (
                            <>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateDocumentStatus(doc.id, 'verified')} title="قبول">
                                <CheckCircle className="h-4 w-4 text-success" />
                              </Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => updateDocumentStatus(doc.id, 'rejected')} title="رفض">
                                <XCircle className="h-4 w-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status History */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Clock className="h-5 w-5 text-primary" />
                  سجل الحالات
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statusHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">لا يوجد سجل</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-4 pl-2">
                      {statusHistory.map((history) => (
                        <div key={history.id} className="border-r-2 border-primary pr-4 pb-2">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(history.new_status)}
                          </div>
                          {history.notes && (
                            <p className="text-sm text-muted-foreground mt-2 bg-muted/50 rounded p-2">{history.notes}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {format(new Date(history.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Show rejection reason if rejected */}
          {application.rejection_reason && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">سبب الرفض:</p>
                    <p className="text-sm mt-1 text-destructive/80">{application.rejection_reason}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Notes, Messages & History */}
        <div className="xl:col-span-1 space-y-6">
          <div className="sticky top-6 space-y-6">
            {/* Customer Messaging */}
            <ApplicationMessages 
              applicationId={application.id}
              customerName={application.profile?.full_name}
            />
            <NotesHistory applicationId={application.id} />
            <AgentRequestsHistory applicationId={application.id} />
          </div>
        </div>
      </div>
      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغيير حالة الطلب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">الحالة الجديدة</label>
              <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ApplicationStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الحالة" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {newStatus === 'rejected' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">سبب الرفض</label>
                <Textarea
                  placeholder="اذكر سبب رفض الطلب..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">ملاحظات (اختياري)</label>
              <Textarea
                placeholder="أضف ملاحظات حول تغيير الحالة..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              إلغاء
            </Button>
            <Button 
              onClick={handleStatusChange} 
              disabled={!newStatus || updating || (newStatus === 'rejected' && !rejectionReason)}
            >
              {updating && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
              تأكيد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Request Dialog */}
      <TransferRequestDialog
        open={showTransferDialog}
        onOpenChange={setShowTransferDialog}
        applicationId={application.id}
        onSuccess={fetchApplicationData}
      />

      {/* Work Submission Dialog */}
      <WorkSubmissionDialog
        open={showWorkSubmissionDialog}
        onOpenChange={setShowWorkSubmissionDialog}
        applicationId={application.id}
        onSuccess={fetchApplicationData}
      />

      {/* Document Preview Dialog */}
      {previewDoc && previewUrl && (
        <Dialog open={!!previewDoc} onOpenChange={(open) => !open && closePreview()}>
          <DialogContent className="max-w-4xl h-[85vh] p-0 flex flex-col" dir="rtl">
            <DialogHeader className="px-4 py-3 border-b shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {previewDoc.file_name}
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-auto bg-muted/20 flex items-center justify-center p-4">
              {previewDoc.file_name.toLowerCase().endsWith('.pdf') ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full rounded-lg border shadow-lg bg-white"
                  title={previewDoc.file_name}
                />
              ) : (
                <img
                  src={previewUrl}
                  alt={previewDoc.file_name}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                />
              )}
            </div>
            <DialogFooter className="px-4 py-3 border-t shrink-0">
              <Button variant="outline" onClick={closePreview}>إغلاق</Button>
              <Button onClick={() => downloadDocument(previewDoc)}>
                <Download className="h-4 w-4 ml-2" />
                تحميل
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
