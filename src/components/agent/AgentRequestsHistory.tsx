import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Loader2, 
  UserMinus, 
  FileCheck, 
  Download,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeftRight
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';

interface TransferRequest {
  id: string;
  to_agent_id: string;
  reason: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  to_agent: { full_name: string | null } | null;
}

interface WorkSubmission {
  id: string;
  file_path: string;
  file_name: string;
  notes: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

interface AgentRequestsHistoryProps {
  applicationId: string;
}

export function AgentRequestsHistory({ applicationId }: AgentRequestsHistoryProps) {
  const { profile } = useAuth();
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [workSubmissions, setWorkSubmissions] = useState<WorkSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [applicationId, profile]);

  const fetchData = async () => {
    if (!profile) return;

    setLoading(true);
    try {
      // Fetch transfer requests for this application by this agent
      const { data: transfers } = await supabase
        .from('agent_transfer_requests')
        .select(`
          id,
          to_agent_id,
          reason,
          status,
          admin_notes,
          created_at,
          reviewed_at,
          to_agent:profiles!agent_transfer_requests_to_agent_id_fkey(full_name)
        `)
        .eq('application_id', applicationId)
        .eq('from_agent_id', profile.id)
        .order('created_at', { ascending: false });

      setTransferRequests(transfers || []);

      // Fetch work submissions for this application by this agent
      const { data: submissions } = await supabase
        .from('agent_work_submissions')
        .select('*')
        .eq('application_id', applicationId)
        .eq('agent_id', profile.id)
        .order('created_at', { ascending: false });

      setWorkSubmissions(submissions || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
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

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string; icon: typeof Clock }> = {
      pending: { label: 'قيد الانتظار', className: 'bg-warning/10 text-warning', icon: Clock },
      approved: { label: 'موافق عليه', className: 'bg-success/10 text-success', icon: CheckCircle },
      rejected: { label: 'مرفوض', className: 'bg-destructive/10 text-destructive', icon: XCircle },
      returned: { label: 'معاد للمراجعة', className: 'bg-warning/10 text-warning', icon: Clock },
    };
    const { label, className, icon: Icon } = config[status] || config.pending;
    return (
      <Badge className={`${className} gap-1`}>
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  const hasData = transferRequests.length > 0 || workSubmissions.length > 0;

  if (!hasData) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <ArrowLeftRight className="h-5 w-5 text-primary" />
          سجل الطلبات والإتمام
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={transferRequests.length > 0 ? "transfers" : "work"}>
          <TabsList className="w-full">
            <TabsTrigger value="transfers" className="flex-1 gap-1">
              <UserMinus className="h-4 w-4" />
              طلبات التحويل ({transferRequests.length})
            </TabsTrigger>
            <TabsTrigger value="work" className="flex-1 gap-1">
              <FileCheck className="h-4 w-4" />
              ملفات الإتمام ({workSubmissions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transfers" className="mt-4">
            {transferRequests.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                لا توجد طلبات تحويل
              </p>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-3">
                  {transferRequests.map((transfer) => (
                    <div 
                      key={transfer.id}
                      className="p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">
                          إلى: <strong>{transfer.to_agent?.full_name || 'غير محدد'}</strong>
                        </span>
                        {getStatusBadge(transfer.status)}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{transfer.reason}</p>
                      {transfer.admin_notes && (
                        <div className="text-xs bg-muted rounded p-2 mb-2">
                          <strong>رد المشرف:</strong> {transfer.admin_notes}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(transfer.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="work" className="mt-4">
            {workSubmissions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                لا توجد ملفات إتمام
              </p>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-3">
                  {workSubmissions.map((work) => (
                    <div 
                      key={work.id}
                      className="p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-auto p-0"
                          onClick={() => downloadFile(work.file_path, work.file_name)}
                        >
                          <Download className="h-4 w-4 ml-1" />
                          <span className="text-sm truncate max-w-[150px]">{work.file_name}</span>
                        </Button>
                        {getStatusBadge(work.status)}
                      </div>
                      {work.notes && (
                        <p className="text-sm text-muted-foreground mb-2">{work.notes}</p>
                      )}
                      {work.admin_notes && (
                        <div className="text-xs bg-muted rounded p-2 mb-2">
                          <strong>رد المشرف:</strong> {work.admin_notes}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(work.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
