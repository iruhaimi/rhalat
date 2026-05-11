import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Users,
  Loader2,
  BarChart3,
  TrendingUp,
  Sparkles,
  Crown,
  Activity,
  ArrowUpRight,
  Calendar,
  Zap,
  Settings2
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import ApplicationTrendsChart from '@/components/admin/charts/ApplicationTrendsChart';
import StatusDistributionChart from '@/components/admin/charts/StatusDistributionChart';
import CountryApplicationsChart from '@/components/admin/charts/CountryApplicationsChart';
import RevenueStatsCard from '@/components/admin/charts/RevenueStatsCard';
import RecentActivityFeed from '@/components/admin/charts/RecentActivityFeed';
import PerformanceMetricsCard from '@/components/admin/charts/PerformanceMetricsCard';
import AgentPerformanceCard from '@/components/admin/charts/AgentPerformanceCard';
import AgentNotesPerformance from '@/components/admin/charts/AgentNotesPerformance';
import AgentPerformanceChart from '@/components/admin/charts/AgentPerformanceChart';
import AgentsComparisonTable from '@/components/admin/charts/AgentsComparisonTable';
import { QuickActionsPanel } from '@/components/admin/QuickActionsPanel';
import { UrgentTasksDashboard } from '@/components/admin/UrgentTasksDashboard';

interface DashboardStats {
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  totalUsers: number;
  recentApplications: any[];
  allApplications: any[];
  payments: any[];
  statusHistory: any[];
}

export default function AdminDashboard() {
  const { isAdmin, profile } = useAuth();
  const { isSuperAdmin, hasPermission } = usePermissions();
  const [stats, setStats] = useState<DashboardStats>({
    totalApplications: 0,
    pendingApplications: 0,
    approvedApplications: 0,
    rejectedApplications: 0,
    totalUsers: 0,
    recentApplications: [],
    allApplications: [],
    payments: [],
    statusHistory: [],
  });
  const [loading, setLoading] = useState(true);
  const currentDate = new Date();
  const greeting = getGreeting();

  function getGreeting() {
    const hour = currentDate.getHours();
    if (hour < 12) return 'صباح الخير';
    if (hour < 17) return 'مساء الخير';
    return 'مساء الخير';
  }

  // Prepare mini chart data for last 7 days
  const miniChartData = useMemo(() => {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStr = date.toISOString().split('T')[0];
      const count = stats.allApplications.filter(
        app => app.created_at.split('T')[0] === dayStr
      ).length;
      last7Days.push({
        day: date.toLocaleDateString('ar-SA', { weekday: 'short' }),
        count,
      });
    }
    return last7Days;
  }, [stats.allApplications]);

  // Status distribution for mini pie chart
  const statusPieData = useMemo(() => {
    const pending = stats.pendingApplications;
    const approved = stats.approvedApplications;
    const rejected = stats.rejectedApplications;
    const draft = stats.totalApplications - pending - approved - rejected;
    return [
      { name: 'معالجة', value: pending, color: 'hsl(var(--warning))' },
      { name: 'معتمد', value: approved, color: 'hsl(var(--success))' },
      { name: 'مرفوض', value: rejected, color: 'hsl(var(--destructive))' },
      { name: 'مسودة', value: Math.max(0, draft), color: 'hsl(var(--muted-foreground))' },
    ].filter(d => d.value > 0);
  }, [stats]);

  // Today's stats
  const todayStats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayApps = stats.allApplications.filter(
      app => app.created_at.split('T')[0] === today
    );
    const todayApproved = todayApps.filter(app => app.status === 'approved').length;
    const todaySubmitted = todayApps.filter(app => app.status === 'submitted').length;
    return {
      total: todayApps.length,
      approved: todayApproved,
      submitted: todaySubmitted,
    };
  }, [stats.allApplications]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch all applications with visa type and country info
      const { data: applications, error: appError } = await supabase
        .from('applications')
        .select(`
          id, 
          status, 
          created_at, 
          submitted_at,
          approved_at,
          visa_type:visa_types(name, country:countries(name))
        `)
        .order('created_at', { ascending: false });

      if (appError) throw appError;

      const totalApplications = applications?.length || 0;
      const pendingApplications = applications?.filter(a => 
        ['submitted', 'under_review', 'processing', 'documents_required'].includes(a.status)
      ).length || 0;
      const approvedApplications = applications?.filter(a => a.status === 'approved').length || 0;
      const rejectedApplications = applications?.filter(a => a.status === 'rejected').length || 0;

      // Fetch users count (only for admin)
      let totalUsers = 0;
      if (isAdmin) {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true });
        totalUsers = count || 0;
      }

      // Fetch payments for revenue stats
      const { data: payments } = await supabase
        .from('payments')
        .select('amount, status, paid_at, created_at');

      // Fetch recent status changes
      const { data: statusHistory } = await supabase
        .from('application_status_history')
        .select('id, application_id, old_status, new_status, created_at, notes')
        .order('created_at', { ascending: false })
        .limit(20);

      setStats({
        totalApplications,
        pendingApplications,
        approvedApplications,
        rejectedApplications,
        totalUsers,
        recentApplications: applications?.slice(0, 5) || [],
        allApplications: applications || [],
        payments: payments || [],
        statusHistory: statusHistory || [],
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'إجمالي الطلبات',
      value: stats.totalApplications,
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'طلبات قيد المعالجة',
      value: stats.pendingApplications,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'طلبات معتمدة',
      value: stats.approvedApplications,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'طلبات مرفوضة',
      value: stats.rejectedApplications,
      icon: XCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10',
    },
  ];

  if (isAdmin) {
    statCards.push({
      title: 'إجمالي المستخدمين',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-info',
      bgColor: 'bg-info/10',
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Hero Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 md:p-8 text-primary-foreground">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/5 rounded-full translate-x-1/4 translate-y-1/4" />
        <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-white/5 rounded-full" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          {/* Left side - Greeting */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 text-primary-foreground/80">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">
                {currentDate.toLocaleDateString('ar-SA', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Sparkles className="h-7 w-7" />
              {greeting}، {profile?.full_name?.split(' ')[0] || 'المشرف'}
            </h1>
            <p className="text-primary-foreground/80 max-w-lg">
              إليك نظرة سريعة على أداء المنصة اليوم. تابع الطلبات والإحصائيات من هنا.
            </p>
            {isSuperAdmin && (
              <Badge className="bg-white/20 text-white hover:bg-white/30 gap-1 mt-2">
                <Crown className="h-3 w-3" />
                مدير عام
              </Badge>
            )}
          </div>
          
          {/* Right side - Mini Charts & Stats */}
          <div className="flex flex-wrap items-start gap-4">
            {/* Today's Activity Card */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 min-w-[140px]">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4" />
                <span className="text-xs font-medium">نشاط اليوم</span>
              </div>
              <div className="text-3xl font-bold">{todayStats.total}</div>
              <div className="text-xs text-primary-foreground/70">طلب جديد</div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center min-w-[100px]">
              <div className="text-3xl font-bold">{stats.pendingApplications}</div>
              <div className="text-xs text-primary-foreground/70">قيد المعالجة</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center min-w-[100px]">
              <div className="text-3xl font-bold flex items-center justify-center gap-1">
                {stats.approvedApplications}
                <ArrowUpRight className="h-4 w-4 text-emerald-300" />
              </div>
              <div className="text-xs text-primary-foreground/70">معتمدة</div>
            </div>

            {/* Mini Area Chart */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 min-w-[180px]">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="h-3 w-3" />
                <span className="text-[10px] font-medium">آخر 7 أيام</span>
              </div>
              <div className="h-[50px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={miniChartData}>
                    <defs>
                      <linearGradient id="heroChartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="white" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="white" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <Tooltip 
                      contentStyle={{ 
                        background: 'rgba(255,255,255,0.9)', 
                        border: 'none', 
                        borderRadius: '8px',
                        fontSize: '12px',
                        color: 'hsl(var(--primary))'
                      }}
                      formatter={(value: number) => [`${value} طلب`, '']}
                      labelFormatter={(label) => label}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="rgba(255,255,255,0.8)" 
                      strokeWidth={2}
                      fill="url(#heroChartGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Mini Pie Chart */}
            {statusPieData.length > 0 && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 min-w-[100px] flex flex-col items-center">
                <span className="text-[10px] font-medium mb-1">التوزيع</span>
                <div className="h-[50px] w-[50px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={12}
                        outerRadius={22}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          background: 'rgba(255,255,255,0.95)', 
                          border: 'none', 
                          borderRadius: '8px',
                          fontSize: '11px'
                        }}
                        formatter={(value: number, name: string) => [`${value}`, name]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat, index) => (
          <Card key={index} className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor} transition-transform group-hover:scale-110`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">من إجمالي الطلبات</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tabs for different views */}
      <Tabs defaultValue="control-center" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="control-center" className="gap-2">
            <Settings2 className="h-4 w-4" />
            مركز التحكم
          </TabsTrigger>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="urgent" className="gap-2">
            <Zap className="h-4 w-4" />
            المهام العاجلة
          </TabsTrigger>
          <TabsTrigger value="analytics" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            التحليلات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="control-center" className="space-y-4">
          <QuickActionsPanel />
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Recent Applications */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">أحدث الطلبات</CardTitle>
                <Link 
                  to={isAdmin ? '/admin/applications' : '/agent/applications'}
                  className="text-sm text-primary hover:underline"
                >
                  عرض الكل
                </Link>
              </CardHeader>
              <CardContent>
                {stats.recentApplications.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">لا توجد طلبات حالياً</p>
                ) : (
                  <div className="space-y-3">
                    {stats.recentApplications.map((app) => (
                      <div 
                        key={app.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium">
                            {app.visa_type?.country?.name} - {app.visa_type?.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(app.created_at).toLocaleDateString('ar-SA')}
                          </p>
                        </div>
                        <StatusBadge status={app.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <RecentActivityFeed activities={stats.statusHistory} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Stats - Only visible to users with view_revenue permission */}
            {hasPermission('view_revenue') && <RevenueStatsCard payments={stats.payments} />}
            
            {/* Performance Metrics */}
            <PerformanceMetricsCard applications={stats.allApplications} />
          </div>

          {/* Agent Performance */}
          {isAdmin && (
            <div className="grid gap-4 md:grid-cols-2">
              <AgentPerformanceCard />
              <AgentNotesPerformance />
            </div>
          )}
        </TabsContent>

        <TabsContent value="urgent" className="space-y-4">
          <div data-urgent-banner="true">
            <UrgentTasksDashboard />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Agents Comparison Table */}
          {isAdmin && <AgentsComparisonTable />}

          {/* Agent Performance Charts */}
          {isAdmin && <AgentPerformanceChart />}

          {/* Application Trends */}
          <ApplicationTrendsChart applications={stats.allApplications} days={30} />

          <div className="grid gap-4 md:grid-cols-2">
            {/* Status Distribution */}
            <StatusDistributionChart applications={stats.allApplications} />
            
            {/* Country Applications */}
            <CountryApplicationsChart applications={stats.allApplications} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'مسودة', className: 'bg-muted text-muted-foreground' },
    pending_payment: { label: 'بانتظار الدفع', className: 'bg-warning/10 text-warning' },
    submitted: { label: 'مقدم', className: 'bg-info/10 text-info' },
    under_review: { label: 'قيد المراجعة', className: 'bg-primary/10 text-primary' },
    documents_required: { label: 'مستندات مطلوبة', className: 'bg-warning/10 text-warning' },
    processing: { label: 'قيد المعالجة', className: 'bg-primary/10 text-primary' },
    approved: { label: 'معتمد', className: 'bg-success/10 text-success' },
    rejected: { label: 'مرفوض', className: 'bg-destructive/10 text-destructive' },
    cancelled: { label: 'ملغي', className: 'bg-muted text-muted-foreground' },
  };

  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
