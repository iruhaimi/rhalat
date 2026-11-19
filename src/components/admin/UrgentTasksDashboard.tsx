import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  AlertTriangle, 
  UserX, 
  ArrowLeftRight, 
  FileCheck,
  Clock,
  Sparkles,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { Link } from '@/lib/router-compat';
import { useUrgentTasks } from '@/hooks/useUrgentTasks';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

const TASK_TYPE_CONFIG = {
  unassigned: {
    icon: UserX,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    label: 'بدون وكيل',
  },
  pending_transfer: {
    icon: ArrowLeftRight,
    color: 'text-warning',
    bgColor: 'bg-warning/10',
    label: 'طلب تحويل',
  },
  pending_work: {
    icon: FileCheck,
    color: 'text-primary',
    bgColor: 'bg-primary/10',
    label: 'ملف إتمام',
  },
  overdue: {
    icon: Clock,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    label: 'متأخر',
  },
};

const PRIORITY_CONFIG = {
  high: { label: 'عاجل', className: 'bg-destructive text-destructive-foreground' },
  medium: { label: 'متوسط', className: 'bg-warning text-warning-foreground' },
  low: { label: 'عادي', className: 'bg-muted text-muted-foreground' },
};

export function UrgentTasksDashboard() {
  const { 
    allTasks, 
    unassignedApps, 
    pendingTransfers, 
    pendingWork, 
    overdueApps,
    agentWorkloads,
    loading, 
    refetch,
    getSuggestedAgent 
  } = useUrgentTasks();

  const suggestedAgent = getSuggestedAgent();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            المهام العاجلة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  const totalUrgent = allTasks.filter(t => t.priority === 'high').length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className={`border-2 ${totalUrgent > 0 ? 'border-destructive/50 bg-destructive/5' : 'border-success/50 bg-success/5'}`}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${totalUrgent > 0 ? 'bg-destructive/10' : 'bg-success/10'}`}>
                <AlertTriangle className={`h-5 w-5 ${totalUrgent > 0 ? 'text-destructive' : 'text-success'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalUrgent}</p>
                <p className="text-xs text-muted-foreground">عاجل جداً</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={unassignedApps.length > 0 ? 'border-destructive/30' : ''}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <UserX className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unassignedApps.length}</p>
                <p className="text-xs text-muted-foreground">بدون وكيل</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={pendingTransfers.length > 0 ? 'border-warning/30' : ''}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <ArrowLeftRight className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingTransfers.length}</p>
                <p className="text-xs text-muted-foreground">تحويلات معلقة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={pendingWork.length > 0 ? 'border-primary/30' : ''}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pendingWork.length}</p>
                <p className="text-xs text-muted-foreground">ملفات معلقة</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={overdueApps.length > 0 ? 'border-destructive/30' : ''}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <Clock className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{overdueApps.length}</p>
                <p className="text-xs text-muted-foreground">تجاوز SLA</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Tasks List */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-4">
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              المهام العاجلة
              {allTasks.length > 0 && (
                <Badge variant="destructive">{allTasks.length}</Badge>
              )}
            </CardTitle>
            <Button onClick={refetch} variant="ghost" size="sm">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {allTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-2">🎉</div>
                <p>لا توجد مهام عاجلة</p>
                <p className="text-sm">جميع الطلبات تسير بشكل طبيعي</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {allTasks.slice(0, 15).map(task => {
                    const config = TASK_TYPE_CONFIG[task.type];
                    const Icon = config.icon;
                    const priority = PRIORITY_CONFIG[task.priority];

                    return (
                      <div
                        key={task.id}
                        className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className={`p-2 rounded-lg ${config.bgColor}`}>
                          <Icon className={`h-4 w-4 ${config.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">{task.title}</span>
                            <Badge className={`text-xs ${priority.className}`}>
                              {priority.label}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {task.description}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              منذ {formatDistanceToNow(new Date(task.created_at), { locale: ar, addSuffix: false })}
                            </span>
                            {task.agent_name && (
                              <span className="text-xs text-muted-foreground">
                                • {task.agent_name}
                              </span>
                            )}
                          </div>
                        </div>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                                <Link to={`/admin/applications/${task.application_id}`}>
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>عرض الطلب</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Smart Assignment Suggestion */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-5 w-5 text-primary" />
              الإسناد الذكي
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {suggestedAgent && (
              <div className="p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
                <p className="text-xs text-muted-foreground mb-2">الوكيل المقترح للمهام الجديدة:</p>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={suggestedAgent.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {suggestedAgent.agent_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{suggestedAgent.agent_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {suggestedAgent.pending_count} طلب قيد العمل • {suggestedAgent.completion_rate}% إنجاز
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <p className="text-sm font-medium">توزيع العمل الحالي:</p>
              {agentWorkloads.slice(0, 5).map((agent, index) => (
                <div 
                  key={agent.agent_id}
                  className={`flex items-center gap-2 p-2 rounded-lg ${index === 0 ? 'bg-success/5 border border-success/20' : 'bg-muted/30'}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={agent.avatar_url || undefined} />
                    <AvatarFallback className="text-xs">
                      {agent.agent_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{agent.agent_name}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">{agent.pending_count}</p>
                    <p className="text-xs text-muted-foreground">معلق</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
