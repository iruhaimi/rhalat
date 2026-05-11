import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
  UserCog,
  FileDown,
  FileCheck,
  Users,
  Wallet,
  ShieldCheck,
  Mail,
  Phone
} from 'lucide-react';
import { WorkSubmissionsSection } from '@/components/admin/WorkSubmissionsSection';
import { generateApplicationPDF } from '@/lib/generateApplicationPDF';
import { NotesHistory } from '@/components/admin/NotesHistory';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import type { ApplicationStatus } from '@/types/database';

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'draft', label: 'مسودة' },
  { value: 'pending_payment', label: 'بانتظار الدفع' },
  { value: 'submitted', label: 'مقدم' },
  { value: 'under_review', label: 'قيد المراجعة' },
  { value: 'documents_required', label: 'مستندات مطلوبة' },
  { value: 'processing', label: 'قيد المعالجة' },
  { value: 'approved', label: 'معتمد' },
  { value: 'rejected', label: 'مرفوض' },
  { value: 'cancelled', label: 'ملغي' },
];

interface ApplicationData {
  id: string;
  display_number: string | null;
  status: ApplicationStatus;
  created_at: string;
  travel_date: string | null;
  return_date: string | null;
  purpose_of_travel: string | null;
  accommodation_details: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  agent_notes: string | null;
  admin_notes: string | null;
  rejection_reason: string | null;
  assigned_agent_id: string | null;
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
  assigned_agent: {
    id: string;
    full_name: string;
  } | null;
}

// Safely parse the wizard JSON blob stored in `purpose_of_travel`
interface ParsedDraftBlob {
  fullName?: string;
  email?: string;
  phone?: string;
  countryCode?: string;
  travelers?: { adults?: number; children?: number; infants?: number };
  checkedRequirements?: string[];
  totalAmount?: number;
  paymentMethod?: string;
  termsAccepted?: boolean;
}
function parseDraftBlob(raw: string | null | undefined): ParsedDraftBlob | null {
  if (!raw) return null;
  // Heuristic: only attempt JSON parse if it looks like a JSON object
  const trimmed = raw.trim();
  if (!trimmed.startsWith('{')) return null;
  try {
    const obj = JSON.parse(trimmed);
    return typeof obj === 'object' && obj ? obj : null;
  } catch {
    return null;
  }
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

interface Agent {
  id: string;
  full_name: string;
}

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const { isAdmin, profile: currentUserProfile } = useAuth();
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [statusHistory, setStatusHistory] = useState<StatusHistory[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  
  // Status change dialog
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<ApplicationStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  // Agent assignment dialog
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  
  // Notes
  const [agentNotes, setAgentNotes] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (id) {
      fetchApplicationData();
      if (isAdmin) {
        fetchAgents();
      }
    }
  }, [id, isAdmin]);

  const fetchAgents = async () => {
    try {
      // Fetch users with agent role
      const { data: agentRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'agent');

      if (rolesError) throw rolesError;

      if (agentRoles && agentRoles.length > 0) {
        const agentUserIds = agentRoles.map(r => r.user_id);
        
        const { data: agentProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('user_id', agentUserIds);

        if (profilesError) throw profilesError;
        setAgents(agentProfiles?.map(p => ({ id: p.id, full_name: p.full_name || 'بدون اسم' })) || []);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const fetchApplicationData = async () => {
    try {
      // Fetch application with assigned agent info
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
          ),
          assigned_agent:profiles!applications_assigned_agent_id_fkey(
            id,
            full_name
          )
        `)
        .eq('id', id)
        .single();

      if (appError) throw appError;
      setApplication(appData as ApplicationData);
      setAgentNotes(appData.agent_notes || '');
      setAdminNotes(appData.admin_notes || '');
      setSelectedAgentId(appData.assigned_agent_id || 'none');

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

  const handleAssignAgent = async () => {
    if (!application) return;

    setUpdating(true);
    try {
      const agentIdToAssign = selectedAgentId === 'none' ? null : selectedAgentId;
      
      const { error } = await supabase
        .from('applications')
        .update({ assigned_agent_id: agentIdToAssign })
        .eq('id', application.id);

      if (error) throw error;

      // Send notification to the newly assigned agent
      if (agentIdToAssign) {
        const assignedAgent = agents.find(a => a.id === agentIdToAssign);
        await supabase.from('notifications').insert({
          user_id: agentIdToAssign,
          title: 'طلب جديد تم تعيينه لك',
          message: `تم تعيين طلب تأشيرة ${application.visa_type?.country?.name} - ${application.visa_type?.name} لك للمتابعة.`,
          type: 'assignment',
          action_url: `/agent/applications/${application.id}`,
        });
      }

      toast.success(agentIdToAssign ? 'تم تعيين الوكيل بنجاح' : 'تم إلغاء تعيين الوكيل');
      setShowAgentDialog(false);
      fetchApplicationData();
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast.error('حدث خطأ في تعيين الوكيل');
    } finally {
      setUpdating(false);
    }
  };

  const handleStatusChange = async () => {
    if (!newStatus || !application) return;

    setUpdating(true);
    try {
      const updates: any = { status: newStatus };
      
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
      const updates: any = {};
      if (isAdmin) {
        updates.admin_notes = adminNotes;
      }
      updates.agent_notes = agentNotes;

      const { error } = await supabase
        .from('applications')
        .update(updates)
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

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string; icon: any }> = {
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
          <Link to={isAdmin ? '/admin/applications' : '/agent/applications'}>
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
            <Link to={isAdmin ? '/admin/applications' : '/agent/applications'}>
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
          {isAdmin && (
            <Button variant="outline" size="sm" onClick={() => setShowAgentDialog(true)}>
              <UserCog className="h-4 w-4 ml-2" />
              {application.assigned_agent ? 'تغيير الوكيل' : 'تعيين وكيل'}
            </Button>
          )}
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

          {/* Travel Info */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plane className="h-5 w-5 text-primary" />
                معلومات السفر
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">الوجهة</p>
                  <p className="font-medium">{application.visa_type?.country?.name || '-'}</p>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">نوع التأشيرة</p>
                  <p className="font-medium">{application.visa_type?.name || '-'}</p>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">تاريخ السفر</p>
                  <p className="font-medium">{application.travel_date ? format(new Date(application.travel_date), 'dd/MM/yyyy') : '-'}</p>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">تاريخ العودة</p>
                  <p className="font-medium">{application.return_date ? format(new Date(application.return_date), 'dd/MM/yyyy') : '-'}</p>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/50 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">الغرض من السفر</p>
                  <p className="font-medium">{application.purpose_of_travel || '-'}</p>
                </div>
                {application.accommodation_details && (
                  <div className="space-y-1 p-3 rounded-lg bg-muted/50 sm:col-span-2">
                    <p className="text-xs text-muted-foreground">تفاصيل الإقامة</p>
                    <p className="font-medium">{application.accommodation_details}</p>
                  </div>
                )}
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
                  <ScrollArea className="h-[250px]">
                    <div className="space-y-2 pl-2">
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
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`rounded-full px-2 py-0.5 text-xs ${
                              doc.status === 'verified' 
                                ? 'bg-success/10 text-success' 
                                : doc.status === 'rejected'
                                ? 'bg-destructive/10 text-destructive'
                                : 'bg-warning/10 text-warning'
                            }`}>
                              {doc.status === 'verified' ? 'تم التحقق' : doc.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                            </span>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => downloadDocument(doc)}>
                              <Download className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
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
                          <p className="text-sm font-medium">
                            {STATUS_OPTIONS.find(s => s.value === history.new_status)?.label || history.new_status}
                          </p>
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

          {/* Work Submissions Section */}
          <WorkSubmissionsSection applicationId={application.id} />

          {/* Application Summary */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-4">
                <div className="space-y-1 p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">تاريخ الإنشاء</p>
                  <p className="font-medium text-sm">{format(new Date(application.created_at), 'dd MMM yyyy', { locale: ar })}</p>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">السعر</p>
                  <p className="font-medium">{application.visa_type?.price} ر.س</p>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">مدة المعالجة</p>
                  <p className="font-medium">{application.visa_type?.processing_days} أيام</p>
                </div>
                <div className="space-y-1 p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-xs text-muted-foreground">الوكيل المسؤول</p>
                  <p className="font-medium">{application.assigned_agent?.full_name || 'غير معين'}</p>
                </div>
              </div>
              {application.rejection_reason && (
                <div className="mt-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4">
                  <p className="text-sm font-medium text-red-700 dark:text-red-400">سبب الرفض:</p>
                  <p className="text-sm mt-1 text-red-600 dark:text-red-300">{application.rejection_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Notes */}
        <div className="xl:col-span-1">
          <div className="sticky top-6">
            <NotesHistory applicationId={application.id} />
          </div>
        </div>
      </div>
      {/* Status Change Dialog */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تغيير حالة الطلب</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">الحالة الجديدة</label>
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
              <div>
                <label className="text-sm font-medium mb-1 block">سبب الرفض</label>
                <Textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="اكتب سبب رفض الطلب..."
                  rows={3}
                />
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-1 block">ملاحظة (اختياري)</label>
              <Textarea
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="أضف ملاحظة لسجل الحالات..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)}>
              إلغاء
            </Button>
            <Button onClick={handleStatusChange} disabled={!newStatus || updating}>
              {updating && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              تأكيد التغيير
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Agent Assignment Dialog */}
      {isAdmin && (
        <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>تعيين وكيل للطلب</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">اختر الوكيل</label>
                <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر وكيل..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">بدون وكيل</SelectItem>
                    {agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {agents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  لا يوجد وكلاء مسجلين في النظام
                </p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAgentDialog(false)}>
                إلغاء
              </Button>
              <Button onClick={handleAssignAgent} disabled={updating}>
                {updating && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                حفظ التعيين
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function InfoRow({ label, value, className = '' }: { label: string; value?: string | null; className?: string }) {
  return (
    <div className={className}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium">{value || '-'}</p>
    </div>
  );
}
