import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Clock, CheckCircle, Target, ArrowUpRight, Info, Zap } from 'lucide-react';
import { differenceInDays, subDays } from 'date-fns';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface Application {
  status: string;
  created_at: string;
  submitted_at: string | null;
  approved_at: string | null;
}

interface PerformanceMetricsCardProps {
  applications: Application[];
}

export default function PerformanceMetricsCard({ applications }: PerformanceMetricsCardProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('all');
  
  const filteredApps = useMemo(() => {
    if (timeRange === 'all') return applications;
    const daysAgo = timeRange === 'week' ? 7 : 30;
    const cutoff = subDays(new Date(), daysAgo);
    return applications.filter(a => new Date(a.created_at) >= cutoff);
  }, [applications, timeRange]);

  // Calculate approval rate
  const completedApps = filteredApps.filter(a => ['approved', 'rejected'].includes(a.status));
  const approvedApps = filteredApps.filter(a => a.status === 'approved');
  const approvalRate = completedApps.length > 0 
    ? (approvedApps.length / completedApps.length) * 100 
    : 0;

  // Calculate average processing time (from submitted to approved)
  const processedApps = filteredApps.filter(a => a.status === 'approved' && a.submitted_at && a.approved_at);
  const avgProcessingDays = processedApps.length > 0
    ? processedApps.reduce((sum, app) => {
        return sum + differenceInDays(new Date(app.approved_at!), new Date(app.submitted_at!));
      }, 0) / processedApps.length
    : 0;

  // Calculate completion rate (apps that moved past draft)
  const nonDraftApps = filteredApps.filter(a => a.status !== 'draft');
  const completionRate = filteredApps.length > 0 
    ? (nonDraftApps.length / filteredApps.length) * 100 
    : 0;

  // Calculate this period's trend
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const thisWeekApps = applications.filter(a => new Date(a.created_at) >= oneWeekAgo);
  
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
  const lastWeekApps = applications.filter(a => {
    const date = new Date(a.created_at);
    return date >= twoWeeksAgo && date < oneWeekAgo;
  });
  
  const weeklyChange = lastWeekApps.length > 0 
    ? ((thisWeekApps.length - lastWeekApps.length) / lastWeekApps.length) * 100 
    : thisWeekApps.length > 0 ? 100 : 0;

  const metrics = [
    {
      title: 'نسبة الطلبات المكتملة',
      value: approvalRate,
      displayValue: `${approvalRate.toFixed(1)}%`,
      icon: CheckCircle,
      color: approvalRate >= 80 ? 'text-success' : approvalRate >= 50 ? 'text-warning' : 'text-destructive',
      bgColor: approvalRate >= 80 ? 'bg-success/10' : approvalRate >= 50 ? 'bg-warning/10' : 'bg-destructive/10',
      target: 95,
      tooltip: 'نسبة الطلبات المعتمدة من إجمالي الطلبات المكتملة',
    },
    {
      title: 'متوسط وقت المعالجة',
      value: avgProcessingDays,
      displayValue: `${avgProcessingDays.toFixed(1)} يوم`,
      icon: Clock,
      color: avgProcessingDays <= 3 ? 'text-success' : avgProcessingDays <= 7 ? 'text-warning' : 'text-destructive',
      bgColor: avgProcessingDays <= 3 ? 'bg-success/10' : avgProcessingDays <= 7 ? 'bg-warning/10' : 'bg-destructive/10',
      target: 5,
      isInverse: true,
      tooltip: 'متوسط الأيام من تقديم الطلب حتى الموافقة',
    },
    {
      title: 'معدل إكمال الطلبات',
      value: completionRate,
      displayValue: `${completionRate.toFixed(1)}%`,
      icon: Target,
      color: completionRate >= 70 ? 'text-success' : completionRate >= 40 ? 'text-warning' : 'text-destructive',
      bgColor: completionRate >= 70 ? 'bg-success/10' : completionRate >= 40 ? 'bg-warning/10' : 'bg-destructive/10',
      target: 80,
      tooltip: 'نسبة الطلبات التي تجاوزت مرحلة المسودة',
    },
    {
      title: 'طلبات هذا الأسبوع',
      value: thisWeekApps.length,
      displayValue: `${thisWeekApps.length} طلب`,
      icon: Zap,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      showProgress: false,
      change: weeklyChange,
      tooltip: 'عدد الطلبات الجديدة في آخر 7 أيام',
    },
  ];

  const getProgressColor = (metric: typeof metrics[0]) => {
    if (metric.isInverse) {
      return metric.value <= (metric.target || 5) ? 'bg-success' : 'bg-warning';
    }
    return metric.value >= (metric.target || 80) ? 'bg-success' : 'bg-warning';
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">مؤشرات الأداء</CardTitle>
        <div className="flex gap-1">
          {(['week', 'month', 'all'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'ghost'}
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setTimeRange(range)}
            >
              {range === 'week' ? 'أسبوع' : range === 'month' ? 'شهر' : 'الكل'}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-5">
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-2 cursor-help">
                        <div className={`p-1.5 rounded-lg ${metric.bgColor}`}>
                          <metric.icon className={`h-4 w-4 ${metric.color}`} />
                        </div>
                        <span className="text-sm font-medium">{metric.title}</span>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{metric.tooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold">{metric.displayValue}</span>
                  {metric.change !== undefined && (
                    <Badge 
                      variant="outline" 
                      className={`${metric.change >= 0 ? 'text-success border-success/30' : 'text-destructive border-destructive/30'} text-xs`}
                    >
                      {metric.change >= 0 ? <TrendingUp className="h-3 w-3 ml-0.5" /> : <TrendingDown className="h-3 w-3 ml-0.5" />}
                      {Math.abs(metric.change).toFixed(0)}%
                    </Badge>
                  )}
                </div>
              </div>
              {metric.showProgress !== false && metric.target && (
                <div className="space-y-1">
                  <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                    <div 
                      className={`absolute inset-y-0 right-0 rounded-full transition-all duration-500 ${getProgressColor(metric)}`}
                      style={{
                        width: `${Math.min(100, metric.isInverse 
                          ? Math.min(100, (metric.target / Math.max(metric.value, 0.1)) * 100)
                          : (metric.value / metric.target) * 100
                        )}%`
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      الهدف: {metric.isInverse ? `أقل من ${metric.target}` : metric.target}
                      {metric.isInverse ? ' يوم' : '%'}
                    </span>
                    {(metric.isInverse ? metric.value <= metric.target : metric.value >= metric.target) && (
                      <span className="text-success flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        تم تحقيق الهدف
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
