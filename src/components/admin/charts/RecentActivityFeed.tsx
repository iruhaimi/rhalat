import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  RefreshCw,
  Filter,
  Eye
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Link } from '@/lib/router-compat';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface StatusHistory {
  id: string;
  application_id: string;
  old_status: string | null;
  new_status: string;
  created_at: string;
  notes: string | null;
}

interface RecentActivityFeedProps {
  activities: StatusHistory[];
  onRefresh?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; icon: typeof FileText; color: string; bgColor: string; borderColor: string }> = {
  draft: { label: 'مسودة', icon: FileText, color: 'text-muted-foreground', bgColor: 'bg-muted/50', borderColor: 'border-muted-foreground/30' },
  pending_payment: { label: 'بانتظار الدفع', icon: Clock, color: 'text-warning', bgColor: 'bg-warning/10', borderColor: 'border-warning/30' },
  submitted: { label: 'مقدم', icon: FileText, color: 'text-info', bgColor: 'bg-info/10', borderColor: 'border-info/30' },
  under_review: { label: 'قيد المراجعة', icon: AlertCircle, color: 'text-primary', bgColor: 'bg-primary/10', borderColor: 'border-primary/30' },
  documents_required: { label: 'مستندات مطلوبة', icon: AlertCircle, color: 'text-warning', bgColor: 'bg-warning/10', borderColor: 'border-warning/30' },
  processing: { label: 'قيد المعالجة', icon: Clock, color: 'text-primary', bgColor: 'bg-primary/10', borderColor: 'border-primary/30' },
  approved: { label: 'معتمد', icon: CheckCircle, color: 'text-success', bgColor: 'bg-success/10', borderColor: 'border-success/30' },
  rejected: { label: 'مرفوض', icon: XCircle, color: 'text-destructive', bgColor: 'bg-destructive/10', borderColor: 'border-destructive/30' },
  cancelled: { label: 'ملغي', icon: XCircle, color: 'text-muted-foreground', bgColor: 'bg-muted/50', borderColor: 'border-muted-foreground/30' },
};

export default function RecentActivityFeed({ activities, onRefresh }: RecentActivityFeedProps) {
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  
  const filteredActivities = filterStatuses.length > 0 
    ? activities.filter(a => filterStatuses.includes(a.new_status))
    : activities;

  const toggleFilter = (status: string) => {
    setFilterStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">آخر النشاطات</CardTitle>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8">
                <Filter className="h-4 w-4 ml-1" />
                فلترة
                {filterStatuses.length > 0 && (
                  <Badge variant="secondary" className="mr-1 h-5 px-1.5">
                    {filterStatuses.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={filterStatuses.includes(status)}
                  onCheckedChange={() => toggleFilter(status)}
                >
                  <span className={config.color}>{config.label}</span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {onRefresh && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-6">
          {filteredActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Clock className="h-12 w-12 mb-3 opacity-50" />
              <p>لا توجد نشاطات حديثة</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute right-[19px] top-3 bottom-3 w-px bg-border" />
              
              <div className="space-y-0">
                {filteredActivities.map((activity, index) => {
                  const newConfig = STATUS_CONFIG[activity.new_status] || STATUS_CONFIG.draft;
                  const oldConfig = activity.old_status ? STATUS_CONFIG[activity.old_status] : null;
                  const Icon = newConfig.icon;
                  
                  return (
                    <div 
                      key={activity.id} 
                      className="relative flex items-start gap-4 py-4 group hover:bg-muted/30 rounded-lg transition-colors pr-2"
                    >
                      {/* Timeline dot */}
                      <div className={`relative z-10 p-2 rounded-full ${newConfig.bgColor} ring-4 ring-background transition-transform group-hover:scale-110`}>
                        <Icon className={`h-4 w-4 ${newConfig.color}`} />
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium">
                            تغيير حالة الطلب
                          </p>
                          <Link 
                            to={`/admin/applications/${activity.application_id}`}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                              <Eye className="h-3 w-3 ml-1" />
                              عرض
                            </Button>
                          </Link>
                        </div>
                        
                        {/* Status badges - showing old → new based on the image reference */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {oldConfig ? (
                            <>
                              <Badge 
                                variant="outline" 
                                className={`${oldConfig.bgColor} ${oldConfig.color} border ${oldConfig.borderColor} font-medium px-3 py-1`}
                              >
                                {oldConfig.label}
                              </Badge>
                              <span className="text-muted-foreground text-lg">←</span>
                              <Badge 
                                variant="outline"
                                className={`${newConfig.bgColor} ${newConfig.color} border ${newConfig.borderColor} font-medium px-3 py-1`}
                              >
                                {newConfig.label}
                              </Badge>
                            </>
                          ) : (
                            <Badge 
                              variant="outline"
                              className={`${newConfig.bgColor} ${newConfig.color} border ${newConfig.borderColor} font-medium px-3 py-1`}
                            >
                              {newConfig.label}
                            </Badge>
                          )}
                        </div>
                        
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), { 
                            addSuffix: true, 
                            locale: ar 
                          })}
                        </p>
                        
                        {activity.notes && (
                          <div className="flex items-start gap-1.5 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 mt-2">
                            <span className="shrink-0">💬</span>
                            <span className="leading-relaxed">{activity.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
