import { useEffect, useState } from 'react';
import { Link } from '@/lib/router-compat';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Eye,
  BarChart3,
  ListTodo
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { AgentPerformanceReport } from '@/components/agent/AgentPerformanceReport';

interface DashboardStats {
  total: number;
  pending: number;
  approved: number;
  processing: number;
}

interface RecentApplication {
  id: string;
  status: string;
  created_at: string;
  visa_type: {
    name: string;
    country: {
      name: string;
    };
  };
  profile: {
    full_name: string;
  };
}

export default function AgentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ total: 0, pending: 0, approved: 0, processing: 0 });
  const [recentApplications, setRecentApplications] = useState<RecentApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      // Fetch applications assigned to this agent (RLS will filter automatically)
      const { data: applications, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          visa_type:visa_types(
            name,
            country:countries(name)
          ),
          profile:profiles!applications_user_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const apps = applications || [];
      
      setStats({
        total: apps.length,
        pending: apps.filter(a => ['submitted', 'under_review', 'documents_required'].includes(a.status)).length,
        approved: apps.filter(a => a.status === 'approved').length,
        processing: apps.filter(a => a.status === 'processing').length,
      });

      setRecentApplications(apps.slice(0, 5) as RecentApplication[]);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
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
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h2 className="text-2xl font-bold">لوحة تحكم الوكيل</h2>
        <p className="text-muted-foreground">مرحباً بك في لوحة إدارة الطلبات المعينة لك</p>
      </div>

      {/* Tabs for Dashboard and Performance */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 p-1">
          <TabsTrigger value="overview" className="gap-2 data-[state=active]:bg-background">
            <ListTodo className="h-4 w-4" />
            نظرة عامة
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-2 data-[state=active]:bg-background">
            <BarChart3 className="h-4 w-4" />
            تقرير الأداء
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">إجمالي طلباتي</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">الطلبات المعينة لك</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">بانتظار المراجعة</CardTitle>
                <Clock className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{stats.pending}</div>
                <p className="text-xs text-muted-foreground">تحتاج مراجعة</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">قيد المعالجة</CardTitle>
                <AlertCircle className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{stats.processing}</div>
                <p className="text-xs text-muted-foreground">جاري معالجتها</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">تم الاعتماد</CardTitle>
                <CheckCircle className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">{stats.approved}</div>
                <p className="text-xs text-muted-foreground">طلبات معتمدة</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Applications */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>آخر الطلبات المعينة لي</CardTitle>
              <Button asChild variant="outline" size="sm">
                <Link to="/agent/applications">عرض الكل</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {recentApplications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>لا توجد طلبات معينة لك حالياً</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentApplications.map((app) => (
                    <div 
                      key={app.id} 
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="space-y-1">
                        <p className="font-medium">{app.profile?.full_name || 'غير محدد'}</p>
                        <p className="text-sm text-muted-foreground">
                          {app.visa_type?.country?.name} - {app.visa_type?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(app.created_at), 'dd MMM yyyy', { locale: ar })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(app.status)}
                        <Button asChild size="sm" variant="ghost">
                          <Link to={`/agent/applications/${app.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <AgentPerformanceReport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
