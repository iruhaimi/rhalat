import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays } from 'date-fns';

interface UrgentTask {
  id: string;
  type: 'unassigned' | 'pending_transfer' | 'pending_work' | 'overdue';
  application_id: string;
  title: string;
  description: string;
  created_at: string;
  days_pending: number;
  priority: 'high' | 'medium' | 'low';
  applicant_name?: string | null;
  country?: string;
  visa_type?: string;
  agent_name?: string | null;
}

interface AgentWorkload {
  agent_id: string;
  agent_name: string;
  avatar_url: string | null;
  pending_count: number;
  completed_count: number;
  total_count: number;
  completion_rate: number;
  workload_score: number; // Lower is better (more available)
}

interface UrgentTasksData {
  unassignedApps: UrgentTask[];
  pendingTransfers: UrgentTask[];
  pendingWork: UrgentTask[];
  overdueApps: UrgentTask[];
  allTasks: UrgentTask[];
  agentWorkloads: AgentWorkload[];
}

const SLA_DAYS = {
  submitted: 2,
  under_review: 3,
  documents_required: 5,
  processing: 7,
};

export function useUrgentTasks(slaThresholdDays: number = 3) {
  const [data, setData] = useState<UrgentTasksData>({
    unassignedApps: [],
    pendingTransfers: [],
    pendingWork: [],
    overdueApps: [],
    allTasks: [],
    agentWorkloads: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUrgentTasks();
  }, [slaThresholdDays]);

  const fetchUrgentTasks = async () => {
    setLoading(true);
    try {
      // Fetch unassigned applications that are submitted (need agent assignment)
      const { data: unassigned } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          submitted_at,
          visa_type:visa_types(name, country:countries(name), processing_days),
          profile:profiles!applications_user_id_fkey(full_name)
        `)
        .is('assigned_agent_id', null)
        .in('status', ['submitted', 'under_review', 'processing'])
        .order('submitted_at', { ascending: true });

      // Fetch pending transfer requests
      const { data: transfers } = await supabase
        .from('agent_transfer_requests')
        .select(`
          id,
          application_id,
          created_at,
          reason,
          from_agent:profiles!agent_transfer_requests_from_agent_id_fkey(full_name),
          to_agent:profiles!agent_transfer_requests_to_agent_id_fkey(full_name),
          application:applications(
            visa_type:visa_types(name, country:countries(name)),
            profile:profiles!applications_user_id_fkey(full_name)
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      // Fetch pending work submissions
      const { data: workSubmissions } = await supabase
        .from('agent_work_submissions')
        .select(`
          id,
          application_id,
          created_at,
          agent:profiles!agent_work_submissions_agent_id_fkey(full_name),
          application:applications(
            visa_type:visa_types(name, country:countries(name)),
            profile:profiles!applications_user_id_fkey(full_name)
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      // Fetch applications that are overdue based on SLA
      const { data: allApps } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          submitted_at,
          updated_at,
          assigned_agent_id,
          visa_type:visa_types(name, processing_days, country:countries(name)),
          profile:profiles!applications_user_id_fkey(full_name),
          assigned_agent:profiles!applications_assigned_agent_id_fkey(full_name)
        `)
        .in('status', ['submitted', 'under_review', 'documents_required', 'processing'])
        .order('submitted_at', { ascending: true });

      // Fetch agent workloads
      const { data: agentRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'agent');

      const agentUserIds = agentRoles?.map(r => r.user_id) || [];

      let agentWorkloads: AgentWorkload[] = [];

      if (agentUserIds.length > 0) {
        const { data: agentProfiles } = await supabase
          .from('profiles')
          .select('id, user_id, full_name, avatar_url')
          .in('user_id', agentUserIds);

        const { data: agentApps } = await supabase
          .from('applications')
          .select('assigned_agent_id, status');

        if (agentProfiles && agentApps) {
          agentWorkloads = agentProfiles.map(agent => {
            const apps = agentApps.filter(a => a.assigned_agent_id === agent.id);
            const pending = apps.filter(a => 
              !['approved', 'rejected', 'cancelled', 'draft', 'pending_payment'].includes(a.status)
            ).length;
            const completed = apps.filter(a => a.status === 'approved').length;
            const total = apps.length;
            const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
            
            // Workload score: lower pending = more available
            // Factor in completion rate (higher is better)
            const workloadScore = pending * 10 - completionRate;

            return {
              agent_id: agent.id,
              agent_name: agent.full_name || 'وكيل',
              avatar_url: agent.avatar_url,
              pending_count: pending,
              completed_count: completed,
              total_count: total,
              completion_rate: completionRate,
              workload_score: workloadScore,
            };
          }).sort((a, b) => a.workload_score - b.workload_score);
        }
      }

      // Process data into urgent tasks
      const now = new Date();

      const unassignedTasks: UrgentTask[] = (unassigned || []).map(app => {
        const days = differenceInDays(now, new Date(app.submitted_at || app.created_at));
        return {
          id: `unassigned-${app.id}`,
          type: 'unassigned' as const,
          application_id: app.id,
          title: 'طلب بدون وكيل',
          description: `طلب ${app.profile?.full_name || 'عميل'} لتأشيرة ${app.visa_type?.country?.name || ''}`,
          created_at: app.submitted_at || app.created_at,
          days_pending: days,
          priority: days >= 3 ? 'high' : days >= 1 ? 'medium' : 'low',
          applicant_name: app.profile?.full_name,
          country: app.visa_type?.country?.name,
          visa_type: app.visa_type?.name,
        };
      });

      const transferTasks: UrgentTask[] = (transfers || []).map(t => {
        const days = differenceInDays(now, new Date(t.created_at));
        return {
          id: `transfer-${t.id}`,
          type: 'pending_transfer' as const,
          application_id: t.application_id,
          title: 'طلب تحويل معلق',
          description: `من ${t.from_agent?.full_name || 'وكيل'} إلى ${t.to_agent?.full_name || 'وكيل'}`,
          created_at: t.created_at,
          days_pending: days,
          priority: days >= 2 ? 'high' : days >= 1 ? 'medium' : 'low',
          applicant_name: t.application?.profile?.full_name,
          country: t.application?.visa_type?.country?.name,
          visa_type: t.application?.visa_type?.name,
          agent_name: t.from_agent?.full_name,
        };
      });

      const workTasks: UrgentTask[] = (workSubmissions || []).map(w => {
        const days = differenceInDays(now, new Date(w.created_at));
        return {
          id: `work-${w.id}`,
          type: 'pending_work' as const,
          application_id: w.application_id,
          title: 'ملف إتمام معلق',
          description: `من ${w.agent?.full_name || 'وكيل'} - ${w.application?.visa_type?.country?.name || ''}`,
          created_at: w.created_at,
          days_pending: days,
          priority: days >= 2 ? 'high' : days >= 1 ? 'medium' : 'low',
          applicant_name: w.application?.profile?.full_name,
          country: w.application?.visa_type?.country?.name,
          visa_type: w.application?.visa_type?.name,
          agent_name: w.agent?.full_name,
        };
      });

      const overdueTasks: UrgentTask[] = (allApps || []).filter(app => {
        const submittedAt = new Date(app.submitted_at || app.updated_at);
        const processingDays = app.visa_type?.processing_days || 7;
        const daysSinceSubmit = differenceInDays(now, submittedAt);
        const slaDays = SLA_DAYS[app.status as keyof typeof SLA_DAYS] || slaThresholdDays;
        return daysSinceSubmit > slaDays;
      }).map(app => {
        const submittedAt = new Date(app.submitted_at || app.updated_at);
        const days = differenceInDays(now, submittedAt);
        const slaDays = SLA_DAYS[app.status as keyof typeof SLA_DAYS] || slaThresholdDays;
        const daysOverdue = days - slaDays;
        return {
          id: `overdue-${app.id}`,
          type: 'overdue' as const,
          application_id: app.id,
          title: `متأخر ${daysOverdue} يوم`,
          description: `${app.profile?.full_name || 'عميل'} - ${app.visa_type?.country?.name || ''}`,
          created_at: app.submitted_at || app.updated_at,
          days_pending: days,
          priority: daysOverdue >= 5 ? 'high' : daysOverdue >= 2 ? 'medium' : 'low',
          applicant_name: app.profile?.full_name,
          country: app.visa_type?.country?.name,
          visa_type: app.visa_type?.name,
          agent_name: app.assigned_agent?.full_name,
        };
      });

      const allTasks = [
        ...unassignedTasks.filter(t => t.priority === 'high'),
        ...transferTasks.filter(t => t.priority === 'high'),
        ...workTasks.filter(t => t.priority === 'high'),
        ...overdueTasks.filter(t => t.priority === 'high'),
        ...unassignedTasks.filter(t => t.priority !== 'high'),
        ...transferTasks.filter(t => t.priority !== 'high'),
        ...workTasks.filter(t => t.priority !== 'high'),
        ...overdueTasks.filter(t => t.priority !== 'high'),
      ];

      setData({
        unassignedApps: unassignedTasks,
        pendingTransfers: transferTasks,
        pendingWork: workTasks,
        overdueApps: overdueTasks,
        allTasks,
        agentWorkloads,
      });
    } catch (error) {
      console.error('Error fetching urgent tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedAgent = () => {
    if (data.agentWorkloads.length === 0) return null;
    return data.agentWorkloads[0]; // Already sorted by workload score
  };

  return {
    ...data,
    loading,
    refetch: fetchUrgentTasks,
    getSuggestedAgent,
  };
}
