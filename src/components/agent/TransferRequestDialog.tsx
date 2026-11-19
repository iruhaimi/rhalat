import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, UserMinus } from 'lucide-react';
import { toast } from 'sonner';

interface Agent {
  id: string;
  full_name: string;
}

interface TransferRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicationId: string;
  onSuccess?: () => void;
}

export function TransferRequestDialog({
  open,
  onOpenChange,
  applicationId,
  onSuccess,
}: TransferRequestDialogProps) {
  const { profile } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingAgents, setLoadingAgents] = useState(false);

  useEffect(() => {
    if (open) {
      fetchAgents();
    }
  }, [open]);

  const fetchAgents = async () => {
    setLoadingAgents(true);
    try {
      // Use the security definer function to get agents
      const { data, error } = await supabase
        .rpc('get_agents_for_transfer', profile?.id ? { exclude_profile_id: profile.id } : {});

      if (error) {
        console.error('Error fetching agents:', error);
        setAgents([]);
      } else {
        setAgents(data || []);
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
      setAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAgent || !reason.trim() || !profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('agent_transfer_requests')
        .insert({
          application_id: applicationId,
          from_agent_id: profile.id,
          to_agent_id: selectedAgent,
          reason: reason.trim(),
        });

      if (error) throw error;

      toast.success('تم إرسال طلب التحويل بنجاح. سيتم مراجعته من قبل المشرف');
      onOpenChange(false);
      setSelectedAgent('');
      setReason('');
      onSuccess?.();
    } catch (error) {
      console.error('Error creating transfer request:', error);
      toast.error('حدث خطأ في إرسال طلب التحويل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserMinus className="h-5 w-5" />
            طلب تحويل الطلب
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            سيتم إرسال طلب التحويل للمشرف للموافقة عليه قبل نقل الطلب للوكيل المحدد.
          </p>

          <div className="space-y-2">
            <label className="text-sm font-medium">الوكيل المستلم</label>
            {loadingAgents ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : (
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الوكيل" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.full_name || 'بدون اسم'}
                    </SelectItem>
                  ))}
                  {agents.length === 0 && (
                    <p className="px-2 py-4 text-sm text-muted-foreground text-center">
                      لا يوجد وكلاء آخرون
                    </p>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">سبب التحويل</label>
            <Textarea
              placeholder="اذكر سبب طلب تحويل هذا الطلب لوكيل آخر..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedAgent || !reason.trim() || loading}
          >
            {loading && <Loader2 className="h-4 w-4 ml-2 animate-spin" />}
            إرسال الطلب
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
