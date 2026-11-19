import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  UserPlus, 
  ArrowLeftRight,
  MessageCircle,
  Check,
  X,
  Eye,
  Send,
  Loader2,
  FileCheck,
  Clock,
  Download
} from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { FilePreview } from '@/components/ui/FilePreview';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';

interface Agent {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface PendingTransfer {
  id: string;
  application_id: string;
  reason: string;
  created_at: string;
  from_agent: { full_name: string } | null;
  to_agent: { full_name: string } | null;
  application: {
    id: string;
    visa_type: { name: string; country: { name: string } } | null;
    profile: { full_name: string } | null;
  } | null;
}

interface PendingWork {
  id: string;
  application_id: string;
  file_name: string;
  file_path: string;
  notes: string | null;
  created_at: string;
  agent: { full_name: string } | null;
  application: {
    id: string;
    visa_type: { name: string; country: { name: string } } | null;
    profile: { full_name: string } | null;
  } | null;
}

interface UnassignedApp {
  id: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  visa_type: { name: string; country: { name: string } } | null;
  profile: { full_name: string } | null;
}

interface AgentNote {
  id: string;
  application_id: string;
  content: string;
  created_at: string;
  author_name: string | null;
  application: {
    id: string;
    visa_type: { name: string; country: { name: string } } | null;
    profile: { full_name: string } | null;
  } | null;
}

export function QuickActionsPanel() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [unassignedApps, setUnassignedApps] = useState<UnassignedApp[]>([]);
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>([]);
  const [pendingWork, setPendingWork] = useState<PendingWork[]>([]);
  const [agentNotes, setAgentNotes] = useState<AgentNote[]>([]);
  
  // Dialog states
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<UnassignedApp | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // Reply dialog
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<AgentNote | null>(null);
  const [replyContent, setReplyContent] = useState('');
  
  // Transfer action dialog
  const [transferActionOpen, setTransferActionOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<PendingTransfer | null>(null);
  const [transferNotes, setTransferNotes] = useState('');
  
  // Work review dialog
  const [workReviewOpen, setWorkReviewOpen] = useState(false);
  const [selectedWork, setSelectedWork] = useState<PendingWork | null>(null);
  const [workNotes, setWorkNotes] = useState('');

  // Fetch functions with useCallback for notifications
  const fetchPendingTransfersCallback = useCallback(async () => {
    const { data } = await supabase
      .from('agent_transfer_requests')
      .select(`
        id,
        application_id,
        reason,
        created_at,
        from_agent:profiles!agent_transfer_requests_from_agent_id_fkey(full_name),
        to_agent:profiles!agent_transfer_requests_to_agent_id_fkey(full_name),
        application:applications(
          id,
          visa_type:visa_types(name, country:countries(name)),
          profile:profiles!applications_user_id_fkey(full_name)
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    setPendingTransfers(data || []);
  }, []);

  const fetchPendingWorkCallback = useCallback(async () => {
    const { data } = await supabase
      .from('agent_work_submissions')
      .select(`
        id,
        application_id,
        file_name,
        file_path,
        notes,
        created_at,
        agent:profiles!agent_work_submissions_agent_id_fkey(full_name),
        application:applications(
          id,
          visa_type:visa_types(name, country:countries(name)),
          profile:profiles!applications_user_id_fkey(full_name)
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    setPendingWork(data || []);
  }, []);

  // Real-time admin notifications
  useAdminNotifications(fetchPendingTransfersCallback, fetchPendingWorkCallback);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchAgents(),
        fetchUnassignedApps(),
        fetchPendingTransfers(),
        fetchPendingWork(),
        fetchAgentNotes(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    const { data: agentRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'agent');

    if (agentRoles && agentRoles.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .in('user_id', agentRoles.map(r => r.user_id));
      
      setAgents(profiles || []);
    }
  };

  const fetchUnassignedApps = async () => {
    const { data } = await supabase
      .from('applications')
      .select(`
        id,
        status,
        created_at,
        submitted_at,
        visa_type:visa_types(name, country:countries(name)),
        profile:profiles!applications_user_id_fkey(full_name)
      `)
      .is('assigned_agent_id', null)
      .in('status', ['submitted', 'under_review', 'processing', 'documents_required'])
      .order('submitted_at', { ascending: true })
      .limit(10);
    
    setUnassignedApps(data || []);
  };

  const fetchPendingTransfers = async () => {
    const { data } = await supabase
      .from('agent_transfer_requests')
      .select(`
        id,
        application_id,
        reason,
        created_at,
        from_agent:profiles!agent_transfer_requests_from_agent_id_fkey(full_name),
        to_agent:profiles!agent_transfer_requests_to_agent_id_fkey(full_name),
        application:applications(
          id,
          visa_type:visa_types(name, country:countries(name)),
          profile:profiles!applications_user_id_fkey(full_name)
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    setPendingTransfers(data || []);
  };

  const fetchPendingWork = async () => {
    const { data } = await supabase
      .from('agent_work_submissions')
      .select(`
        id,
        application_id,
        file_name,
        file_path,
        notes,
        created_at,
        agent:profiles!agent_work_submissions_agent_id_fkey(full_name),
        application:applications(
          id,
          visa_type:visa_types(name, country:countries(name)),
          profile:profiles!applications_user_id_fkey(full_name)
        )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    
    setPendingWork(data || []);
  };

  const fetchAgentNotes = async () => {
    const { data } = await supabase
      .from('application_notes')
      .select(`
        id,
        application_id,
        content,
        created_at,
        author_name,
        application:applications(
          id,
          visa_type:visa_types(name, country:countries(name)),
          profile:profiles!applications_user_id_fkey(full_name)
        )
      `)
      .eq('note_type', 'agent')
      .order('created_at', { ascending: false })
      .limit(10);
    
    setAgentNotes(data || []);
  };

  const handleAssignAgent = async () => {
    if (!selectedApp || !selectedAgent) return;
    
    setActionLoading('assign');
    try {
      const { error } = await supabase
        .from('applications')
        .update({ assigned_agent_id: selectedAgent })
        .eq('id', selectedApp.id);

      if (error) throw error;
      
      toast.success('تم تعيين الوكيل بنجاح');
      setAssignDialogOpen(false);
      setSelectedApp(null);
      setSelectedAgent('');
      fetchUnassignedApps();
    } catch (error) {
      console.error('Error assigning agent:', error);
      toast.error('حدث خطأ في تعيين الوكيل');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTransferAction = async (action: 'approve' | 'reject') => {
    if (!selectedTransfer) return;
    
    setActionLoading(action);
    try {
      const updateData: any = {
        status: action === 'approve' ? 'approved' : 'rejected',
        reviewed_at: new Date().toISOString(),
        reviewed_by: profile?.id,
      };
      
      if (transferNotes) {
        updateData.admin_notes = transferNotes;
      }

      const { error } = await supabase
        .from('agent_transfer_requests')
        .update(updateData)
        .eq('id', selectedTransfer.id);

      if (error) throw error;

      // If approved, update the application's assigned agent
      if (action === 'approve') {
        const { data: transfer } = await supabase
          .from('agent_transfer_requests')
          .select('to_agent_id, application_id')
          .eq('id', selectedTransfer.id)
          .single();

        if (transfer) {
          await supabase
            .from('applications')
            .update({ assigned_agent_id: transfer.to_agent_id })
            .eq('id', transfer.application_id);
        }
      }
      
      toast.success(action === 'approve' ? 'تمت الموافقة على التحويل' : 'تم رفض طلب التحويل');
      handleCloseTransferDialog();
      fetchPendingTransfers();
    } catch (error) {
      console.error('Error handling transfer:', error);
      toast.error('حدث خطأ في معالجة الطلب');
    } finally {
      setActionLoading(null);
    }
  };

  const handleWorkAction = async (action: 'approve' | 'reject') => {
    if (!selectedWork) return;
    
    setActionLoading(action);
    try {
      const status = action === 'approve' ? 'approved' : 'returned';
      
      const { error } = await supabase
        .from('agent_work_submissions')
        .update({
          status: status,
          reviewed_at: new Date().toISOString(),
          reviewed_by: profile?.id,
          admin_notes: workNotes || null,
        })
        .eq('id', selectedWork.id);

      if (error) throw error;

      // If approved, update application status
      if (action === 'approve') {
        await supabase
          .from('applications')
          .update({ status: 'approved', approved_at: new Date().toISOString() })
          .eq('id', selectedWork.application_id);
      }
      
      toast.success(action === 'approve' ? 'تم قبول ملف الإتمام' : 'تم إعادة الطلب للمراجعة');
      handleCloseWorkDialog();
      fetchPendingWork();
    } catch (error) {
      console.error('Error handling work:', error);
      toast.error('حدث خطأ في معالجة الملف');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCloseWorkDialog = () => {
    setWorkReviewOpen(false);
    setSelectedWork(null);
    setWorkNotes('');
  };

  const handleOpenWorkDialog = (work: PendingWork) => {
    setSelectedWork(work);
    setWorkNotes(''); // تفريغ الملاحظات عند فتح حوار جديد
    setWorkReviewOpen(true);
  };

  const handleDownloadFile = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('documents')
        .download(filePath);

      if (error) throw error;

      const url = window.URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);
      toast.success('تم تحميل الملف بنجاح');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('حدث خطأ في تحميل الملف');
    }
  };

  const handleCloseTransferDialog = () => {
    setTransferActionOpen(false);
    setSelectedTransfer(null);
    setTransferNotes('');
  };

  const handleOpenTransferDialog = (transfer: PendingTransfer) => {
    setSelectedTransfer(transfer);
    setTransferNotes(''); // تفريغ الملاحظات عند فتح حوار جديد
    setTransferActionOpen(true);
  };

  const handleCloseReplyDialog = () => {
    setReplyDialogOpen(false);
    setSelectedNote(null);
    setReplyContent('');
  };

  const handleReplyNote = async () => {
    if (!selectedNote || !replyContent.trim()) return;
    
    setActionLoading('reply');
    try {
      const { error } = await supabase
        .from('application_notes')
        .insert({
          application_id: selectedNote.application_id,
          author_id: profile?.id,
          author_name: profile?.full_name || 'مشرف',
          content: replyContent,
          note_type: 'admin',
        });

      if (error) throw error;
      
      toast.success('تم إرسال الرد بنجاح');
      handleCloseReplyDialog();
    } catch (error) {
      console.error('Error replying to note:', error);
      toast.error('حدث خطأ في إرسال الرد');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className={unassignedApps.length > 0 ? 'border-destructive/50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${unassignedApps.length > 0 ? 'bg-destructive/10' : 'bg-success/10'}`}>
                <UserPlus className={`h-5 w-5 ${unassignedApps.length > 0 ? 'text-destructive' : 'text-success'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{unassignedApps.length}</p>
                <p className="text-xs text-muted-foreground">طلبات بدون وكيل</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={pendingTransfers.length > 0 ? 'border-warning/50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${pendingTransfers.length > 0 ? 'bg-warning/10' : 'bg-muted'}`}>
                <ArrowLeftRight className={`h-5 w-5 ${pendingTransfers.length > 0 ? 'text-warning' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingTransfers.length}</p>
                <p className="text-xs text-muted-foreground">طلبات تحويل</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={pendingWork.length > 0 ? 'border-primary/50' : ''}>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${pendingWork.length > 0 ? 'bg-primary/10' : 'bg-muted'}`}>
                <FileCheck className={`h-5 w-5 ${pendingWork.length > 0 ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingWork.length}</p>
                <p className="text-xs text-muted-foreground">ملفات إتمام</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <MessageCircle className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{agentNotes.length}</p>
                <p className="text-xs text-muted-foreground">ملاحظات حديثة</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Panels */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Unassigned Applications */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-destructive" />
                طلبات تحتاج تعيين وكيل
                {unassignedApps.length > 0 && (
                  <Badge variant="destructive">{unassignedApps.length}</Badge>
                )}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {unassignedApps.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Check className="h-8 w-8 mx-auto mb-2 text-success" />
                <p>جميع الطلبات معينة لوكلاء</p>
              </div>
            ) : (
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {unassignedApps.map(app => (
                    <div
                      key={app.id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {app.profile?.full_name || 'عميل'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {app.visa_type?.country?.name} - {app.visa_type?.name}
                        </p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3" />
                          منذ {formatDistanceToNow(new Date(app.submitted_at || app.created_at), { locale: ar })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                                <Link to={`/admin/applications/${app.id}`}>
                                  <Eye className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>عرض الطلب</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedApp(app);
                            setAssignDialogOpen(true);
                          }}
                        >
                          تعيين
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Pending Transfers */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-warning" />
                طلبات التحويل
                {pendingTransfers.length > 0 && (
                  <Badge variant="outline" className="border-warning text-warning">
                    {pendingTransfers.length}
                  </Badge>
                )}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingTransfers.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Check className="h-8 w-8 mx-auto mb-2 text-success" />
                <p>لا توجد طلبات تحويل معلقة</p>
              </div>
            ) : (
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {pendingTransfers.map(transfer => (
                    <div
                      key={transfer.id}
                      className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">
                            {transfer.from_agent?.full_name} → {transfer.to_agent?.full_name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {transfer.application?.profile?.full_name} - {transfer.application?.visa_type?.country?.name}
                          </p>
                        </div>
                        <Button asChild size="icon" variant="ghost" className="h-7 w-7">
                          <Link to={`/admin/applications/${transfer.application_id}`}>
                            <Eye className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        السبب: {transfer.reason}
                      </p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1"
                          onClick={() => handleOpenTransferDialog(transfer)}
                        >
                          <Check className="h-3 w-3 ml-1" />
                          قبول
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleOpenTransferDialog(transfer)}
                        >
                          <X className="h-3 w-3 ml-1" />
                          رفض
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Pending Work Submissions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-primary" />
                ملفات إتمام العمل
                {pendingWork.length > 0 && (
                  <Badge>{pendingWork.length}</Badge>
                )}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingWork.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <Check className="h-8 w-8 mx-auto mb-2 text-success" />
                <p>لا توجد ملفات معلقة للمراجعة</p>
              </div>
            ) : (
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {pendingWork.map(work => (
                    <div
                      key={work.id}
                      className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {work.agent?.full_name || 'وكيل'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {work.application?.profile?.full_name} - {work.application?.visa_type?.country?.name}
                          </p>
                        </div>
                        <Button asChild size="icon" variant="ghost" className="h-7 w-7">
                          <Link to={`/admin/applications/${work.application_id}`}>
                            <Eye className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        الملف: {work.file_name}
                      </p>
                      {work.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                          {work.notes}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1"
                          onClick={() => handleOpenWorkDialog(work)}
                        >
                          <Check className="h-3 w-3 ml-1" />
                          قبول
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleOpenWorkDialog(work)}
                        >
                          <X className="h-3 w-3 ml-1" />
                          إعادة
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Agent Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-base">
              <span className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-info" />
                ملاحظات الوكلاء الأخيرة
              </span>
              <Link to="/admin/applications" className="text-xs text-primary hover:underline">
                عرض الكل
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {agentNotes.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>لا توجد ملاحظات حديثة</p>
              </div>
            ) : (
              <ScrollArea className="h-[250px]">
                <div className="space-y-2">
                  {agentNotes.map(note => (
                    <div
                      key={note.id}
                      className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs bg-info/10 text-info">
                              {(note.author_name || 'و').charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{note.author_name || 'وكيل'}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(note.created_at), { locale: ar, addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {note.application?.profile?.full_name} - {note.application?.visa_type?.country?.name}
                      </p>
                      <p className="text-sm line-clamp-2 mb-2">{note.content}</p>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setSelectedNote(note);
                            setReplyContent(''); // تفريغ الرد عند فتح حوار جديد
                            setReplyDialogOpen(true);
                          }}
                        >
                          <Send className="h-3 w-3 ml-1" />
                          رد
                        </Button>
                        <Button asChild size="sm" variant="ghost">
                          <Link to={`/admin/applications/${note.application_id}`}>
                            <Eye className="h-3 w-3" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assign Agent Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent dir="rtl" className="max-w-md p-0 overflow-hidden data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out">
          {/* Header */}
          <div className="bg-gradient-to-l from-destructive/10 to-destructive/5 px-6 py-4 border-b">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <UserPlus className="h-5 w-5 text-destructive" />
                </div>
                تعيين وكيل للطلب
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5">
            {selectedApp && (
              <div className="rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted shrink-0">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{selectedApp.profile?.full_name || 'عميل'}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedApp.visa_type?.country?.name} - {selectedApp.visa_type?.name}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">اختر الوكيل المسؤول</label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="اختر الوكيل" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map(agent => (
                    <SelectItem key={agent.id} value={agent.id}>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={agent.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">{agent.full_name?.charAt(0) || 'و'}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{agent.full_name || 'وكيل'}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-muted/30 border-t flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)} className="px-6">
              إلغاء
            </Button>
            <Button 
              onClick={handleAssignAgent} 
              disabled={!selectedAgent || actionLoading === 'assign'}
              className="px-6 gap-2"
            >
              {actionLoading === 'assign' && <Loader2 className="h-4 w-4 animate-spin" />}
              <UserPlus className="h-4 w-4" />
              تعيين الوكيل
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Action Dialog */}
      <Dialog open={transferActionOpen} onOpenChange={(open) => !open && handleCloseTransferDialog()}>
        <DialogContent dir="rtl" className="max-w-md p-0 overflow-hidden data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out">
          {/* Header */}
          <div className="bg-gradient-to-l from-warning/10 to-warning/5 px-6 py-4 border-b">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-lg bg-warning/10">
                  <ArrowLeftRight className="h-5 w-5 text-warning" />
                </div>
                مراجعة طلب التحويل
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5">
            {selectedTransfer && (
              <>
                {/* Transfer Info Card */}
                <div className="rounded-xl border-2 border-dashed border-warning/30 bg-warning/5 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-muted text-xs">
                          {selectedTransfer.from_agent?.full_name?.charAt(0) || 'و'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{selectedTransfer.from_agent?.full_name}</span>
                    </div>
                    <ArrowLeftRight className="h-5 w-5 text-warning shrink-0" />
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{selectedTransfer.to_agent?.full_name}</span>
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-success/10 text-success text-xs">
                          {selectedTransfer.to_agent?.full_name?.charAt(0) || 'و'}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <div className="text-center pt-2 border-t border-warning/20">
                    <p className="text-sm text-muted-foreground">
                      {selectedTransfer.application?.profile?.full_name} - {selectedTransfer.application?.visa_type?.country?.name}
                    </p>
                  </div>
                </div>

                {/* Reason */}
                <div className="rounded-lg bg-muted/50 border p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2">سبب التحويل:</p>
                  <p className="text-sm leading-relaxed">{selectedTransfer.reason}</p>
                </div>

                {/* Admin Notes */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">ملاحظات المشرف (اختياري)</label>
                  <Textarea
                    placeholder="أضف ملاحظاتك هنا..."
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    rows={3}
                    className="resize-none bg-background"
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-muted/30 border-t flex items-center justify-end gap-3">
            <Button variant="outline" onClick={handleCloseTransferDialog} className="px-6">
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleTransferAction('reject')}
              disabled={actionLoading === 'reject'}
              className="px-6 gap-2"
            >
              {actionLoading === 'reject' && <Loader2 className="h-4 w-4 animate-spin" />}
              <X className="h-4 w-4" />
              رفض التحويل
            </Button>
            <Button
              onClick={() => handleTransferAction('approve')}
              disabled={actionLoading === 'approve'}
              className="px-6 gap-2 bg-success hover:bg-success/90 text-success-foreground"
            >
              {actionLoading === 'approve' && <Loader2 className="h-4 w-4 animate-spin" />}
              <Check className="h-4 w-4" />
              الموافقة
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Work Review Dialog - Enhanced */}
      <Dialog open={workReviewOpen} onOpenChange={(open) => !open && handleCloseWorkDialog()}>
        <DialogContent dir="rtl" className="max-w-lg p-0 overflow-hidden data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out">
          {/* Header with gradient */}
          <div className="bg-gradient-to-l from-primary/10 to-primary/5 px-6 py-5 border-b">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-lg">
                <div className="p-2.5 rounded-xl bg-primary/10 shadow-sm">
                  <FileCheck className="h-5 w-5 text-primary" />
                </div>
                مراجعة ملف إتمام العمل
              </DialogTitle>
            </DialogHeader>
          </div>

          <ScrollArea className="max-h-[65vh]">
            <div className="p-6 space-y-6">
              {selectedWork && (
                <>
                  {/* Agent & Application Info Card */}
                  <div className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {selectedWork.agent?.full_name?.charAt(0) || 'و'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <p className="font-bold text-foreground text-base">{selectedWork.agent?.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedWork.application?.profile?.full_name} - {selectedWork.application?.visa_type?.country?.name}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0 text-xs bg-background">
                        <Clock className="h-3 w-3 ml-1" />
                        {formatDistanceToNow(new Date(selectedWork.created_at), { locale: ar, addSuffix: true })}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* File Preview Section */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Download className="h-4 w-4 text-primary" />
                      ملف إتمام العمل
                    </label>
                    <FilePreview 
                      fileName={selectedWork.file_name}
                      filePath={selectedWork.file_path}
                    />
                  </div>

                  {/* Agent Notes */}
                  {selectedWork.notes && (
                    <div className="rounded-xl bg-muted/50 border p-4 space-y-2">
                      <p className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                        <MessageCircle className="h-3.5 w-3.5" />
                        ملاحظات الوكيل:
                      </p>
                      <p className="text-sm leading-relaxed bg-background rounded-lg p-3 border">{selectedWork.notes}</p>
                    </div>
                  )}

                  {/* Admin Notes Input */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground">ملاحظات المشرف (اختياري)</label>
                    <Textarea
                      placeholder="أضف ملاحظاتك هنا..."
                      value={workNotes}
                      onChange={(e) => setWorkNotes(e.target.value)}
                      rows={3}
                      className="resize-none bg-background border-2 focus:border-primary/50 transition-colors"
                    />
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          {/* Footer Actions - Improved Layout */}
          <div className="px-6 py-4 bg-muted/30 border-t">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                onClick={handleCloseWorkDialog}
                className="flex-1 sm:flex-none sm:px-6"
              >
                إلغاء
              </Button>
              <div className="flex-1 flex items-center gap-2 justify-end">
                <Button
                  variant="destructive"
                  onClick={() => handleWorkAction('reject')}
                  disabled={actionLoading === 'reject'}
                  className="flex-1 sm:flex-none sm:px-6 gap-2"
                >
                  {actionLoading === 'reject' && <Loader2 className="h-4 w-4 animate-spin" />}
                  <X className="h-4 w-4" />
                  إعادة للمراجعة
                </Button>
                <Button
                  onClick={() => handleWorkAction('approve')}
                  disabled={actionLoading === 'approve'}
                  className="flex-1 sm:flex-none sm:px-6 gap-2 bg-success hover:bg-success/90 text-success-foreground"
                >
                  {actionLoading === 'approve' && <Loader2 className="h-4 w-4 animate-spin" />}
                  <Check className="h-4 w-4" />
                  قبول وإتمام الطلب
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reply to Note Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={(open) => !open && handleCloseReplyDialog()}>
        <DialogContent dir="rtl" className="max-w-md p-0 overflow-hidden data-[state=open]:animate-scale-in data-[state=closed]:animate-scale-out">
          {/* Header */}
          <div className="bg-gradient-to-l from-info/10 to-info/5 px-6 py-4 border-b">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-lg bg-info/10">
                  <MessageCircle className="h-5 w-5 text-info" />
                </div>
                الرد على ملاحظة الوكيل
              </DialogTitle>
            </DialogHeader>
          </div>

          <div className="p-6 space-y-5">
            {selectedNote && (
              <div className="rounded-xl border bg-muted/30 p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-info/10 text-info text-sm">
                      {(selectedNote.author_name || 'و').charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-sm">{selectedNote.author_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedNote.application?.profile?.full_name} - {selectedNote.application?.visa_type?.country?.name}
                    </p>
                  </div>
                </div>
                <p className="text-sm bg-background rounded-lg p-3 border leading-relaxed">{selectedNote.content}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">ردك على الملاحظة</label>
              <Textarea
                placeholder="اكتب ردك هنا..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                rows={4}
                className="resize-none bg-background"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-muted/30 border-t flex items-center justify-end gap-3">
            <Button variant="outline" onClick={handleCloseReplyDialog} className="px-6">
              إلغاء
            </Button>
            <Button
              onClick={handleReplyNote}
              disabled={!replyContent.trim() || actionLoading === 'reply'}
              className="px-6 gap-2"
            >
              {actionLoading === 'reply' && <Loader2 className="h-4 w-4 animate-spin" />}
              <Send className="h-4 w-4" />
              إرسال الرد
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
