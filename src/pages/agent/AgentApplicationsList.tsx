import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Search, 
  Eye, 
  Filter,
  Loader2,
  RefreshCw,
  Calendar,
  MapPin,
  X,
  FileText,
  Clock,
  FileSpreadsheet,
  ArrowLeftRight,
  CheckCircle2,
  AlertCircle,
  Send,
  FileCheck,
  UserMinus,
  TrendingUp
} from 'lucide-react';
import { format, isAfter, isBefore, startOfDay, endOfDay, subDays, subMonths, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import { exportToExcel } from '@/lib/exportToExcel';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
  { value: 'all', label: 'جميع الحالات' },
  { value: 'submitted', label: 'مقدم' },
  { value: 'under_review', label: 'قيد المراجعة' },
  { value: 'documents_required', label: 'مستندات مطلوبة' },
  { value: 'processing', label: 'قيد المعالجة' },
  { value: 'approved', label: 'معتمد' },
  { value: 'rejected', label: 'مرفوض' },
];

const DATE_RANGE_OPTIONS = [
  { value: 'all', label: 'كل الفترات' },
  { value: 'today', label: 'اليوم' },
  { value: 'week', label: 'آخر 7 أيام' },
  { value: 'month', label: 'آخر 30 يوم' },
  { value: '3months', label: 'آخر 3 أشهر' },
];

interface Application {
  id: string;
  status: string;
  created_at: string;
  submitted_at: string | null;
  travel_date: string | null;
  user_id: string;
  visa_type: {
    name: string;
    country: {
      id: string;
      name: string;
    };
  };
  profile: {
    full_name: string;
    phone: string;
  };
}

interface Country {
  id: string;
  name: string;
}

interface TransferRequest {
  id: string;
  application_id: string;
  status: string;
  to_agent_id: string;
  created_at: string;
}

interface WorkSubmission {
  id: string;
  application_id: string;
  status: string;
  created_at: string;
}

export default function AgentApplicationsList() {
  const { profile } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [workSubmissions, setWorkSubmissions] = useState<WorkSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchApplications();
    fetchCountries();
  }, []);

  useEffect(() => {
    if (profile) {
      fetchTransferRequests();
      fetchWorkSubmissions();
    }
  }, [profile]);

  const fetchCountries = async () => {
    const { data } = await supabase
      .from('countries')
      .select('id, name')
      .eq('is_active', true)
      .order('name');
    
    setCountries(data || []);
  };

  const fetchTransferRequests = async () => {
    if (!profile) return;
    
    const { data } = await supabase
      .from('agent_transfer_requests')
      .select('id, application_id, status, to_agent_id, created_at')
      .eq('from_agent_id', profile.id);
    
    setTransferRequests(data || []);
  };

  const fetchWorkSubmissions = async () => {
    if (!profile) return;
    
    const { data } = await supabase
      .from('agent_work_submissions')
      .select('id, application_id, status, created_at')
      .eq('agent_id', profile.id);
    
    setWorkSubmissions(data || []);
  };

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          submitted_at,
          travel_date,
          user_id,
          visa_type:visa_types(
            name,
            country:countries(id, name)
          ),
          profile:profiles!applications_user_id_fkey(
            full_name,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get transfer status for an application
  const getTransferStatus = (appId: string) => {
    const transfer = transferRequests.find(t => t.application_id === appId);
    if (!transfer) return null;
    return transfer.status;
  };

  // Get work submission status for an application
  const getWorkStatus = (appId: string) => {
    const work = workSubmissions.find(w => w.application_id === appId);
    if (!work) return null;
    return work.status;
  };

  // Active filters count
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (countryFilter !== 'all') count++;
    if (dateRangeFilter !== 'all') count++;
    if (searchQuery) count++;
    return count;
  }, [statusFilter, countryFilter, dateRangeFilter, searchQuery]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCountryFilter('all');
    setDateRangeFilter('all');
  };

  // Filter applications
  const filteredApplications = useMemo(() => {
    let filtered = applications.filter(app => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = 
          app.id.toLowerCase().includes(searchLower) ||
          app.profile?.full_name?.toLowerCase().includes(searchLower) ||
          app.profile?.phone?.includes(searchQuery) ||
          app.visa_type?.country?.name?.toLowerCase().includes(searchLower) ||
          app.visa_type?.name?.toLowerCase().includes(searchLower);
        
        if (!matchesSearch) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && app.status !== statusFilter) {
        return false;
      }

      // Country filter
      if (countryFilter !== 'all' && app.visa_type?.country?.id !== countryFilter) {
        return false;
      }

      // Date range filter
      if (dateRangeFilter !== 'all') {
        const appDate = new Date(app.created_at);
        const now = new Date();
        
        switch (dateRangeFilter) {
          case 'today':
            if (!isAfter(appDate, startOfDay(now)) || !isBefore(appDate, endOfDay(now))) {
              return false;
            }
            break;
          case 'week':
            if (isBefore(appDate, subDays(now, 7))) return false;
            break;
          case 'month':
            if (isBefore(appDate, subDays(now, 30))) return false;
            break;
          case '3months':
            if (isBefore(appDate, subMonths(now, 3))) return false;
            break;
        }
      }

      return true;
    });

    // Tab filter
    if (activeTab === 'transferred') {
      const transferredAppIds = transferRequests.map(t => t.application_id);
      filtered = filtered.filter(app => transferredAppIds.includes(app.id));
    } else if (activeTab === 'completed') {
      const completedAppIds = workSubmissions
        .filter(w => w.status === 'approved')
        .map(w => w.application_id);
      filtered = filtered.filter(app => completedAppIds.includes(app.id));
    } else if (activeTab === 'pending_work') {
      const pendingWorkAppIds = workSubmissions
        .filter(w => w.status === 'pending')
        .map(w => w.application_id);
      filtered = filtered.filter(app => pendingWorkAppIds.includes(app.id));
    } else if (activeTab === 'active') {
      const activeStatuses = ['submitted', 'under_review', 'documents_required', 'processing'];
      filtered = filtered.filter(app => activeStatuses.includes(app.status));
    }

    return filtered;
  }, [applications, searchQuery, statusFilter, countryFilter, dateRangeFilter, activeTab, transferRequests, workSubmissions]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      draft: { label: 'مسودة', variant: 'secondary' },
      pending_payment: { label: 'بانتظار الدفع', variant: 'outline' },
      submitted: { label: 'مقدم', variant: 'default' },
      under_review: { label: 'قيد المراجعة', variant: 'default' },
      documents_required: { label: 'مستندات مطلوبة', variant: 'outline' },
      processing: { label: 'قيد المعالجة', variant: 'default' },
      approved: { label: 'معتمد', variant: 'default' },
      rejected: { label: 'مرفوض', variant: 'destructive' },
      cancelled: { label: 'ملغي', variant: 'secondary' },
    };
    const config = statusConfig[status] || statusConfig.draft;
    
    const colorClasses: Record<string, string> = {
      draft: 'bg-muted text-muted-foreground',
      pending_payment: 'bg-warning/10 text-warning border-warning/30',
      submitted: 'bg-info/10 text-info',
      under_review: 'bg-primary/10 text-primary',
      documents_required: 'bg-warning/10 text-warning border-warning/30',
      processing: 'bg-primary/10 text-primary',
      approved: 'bg-success/10 text-success',
      rejected: 'bg-destructive/10 text-destructive',
      cancelled: 'bg-muted text-muted-foreground',
    };
    
    return (
      <Badge variant={config.variant} className={colorClasses[status] || ''}>
        {config.label}
      </Badge>
    );
  };

  // Enhanced stats
  const stats = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter(a => ['submitted', 'under_review', 'documents_required', 'processing'].includes(a.status)).length;
    const approved = applications.filter(a => a.status === 'approved').length;
    const rejected = applications.filter(a => a.status === 'rejected').length;
    
    const transferredCount = transferRequests.length;
    const pendingTransfers = transferRequests.filter(t => t.status === 'pending').length;
    const completedWork = workSubmissions.filter(w => w.status === 'approved').length;
    const pendingWork = workSubmissions.filter(w => w.status === 'pending').length;
    
    // Calculate productivity rate
    const productivityRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    
    return { 
      total, 
      pending, 
      approved, 
      rejected,
      transferredCount,
      pendingTransfers,
      completedWork,
      pendingWork,
      productivityRate
    };
  }, [applications, transferRequests, workSubmissions]);

  const handleExportToExcel = async () => {
    if (filteredApplications.length === 0) {
      toast.error('لا توجد بيانات للتصدير');
      return;
    }

    setExporting(true);
    try {
      const statusLabels: Record<string, string> = {
        draft: 'مسودة',
        pending_payment: 'بانتظار الدفع',
        submitted: 'مقدم',
        under_review: 'قيد المراجعة',
        documents_required: 'مستندات مطلوبة',
        processing: 'قيد المعالجة',
        approved: 'معتمد',
        rejected: 'مرفوض',
        cancelled: 'ملغي',
      };

      const data = filteredApplications.map(app => ({
        id: app.id.slice(0, 8),
        full_name: app.profile?.full_name || '-',
        phone: app.profile?.phone || '-',
        country: app.visa_type?.country?.name || '-',
        visa_type: app.visa_type?.name || '-',
        status: statusLabels[app.status] || app.status,
        transfer_status: getTransferStatus(app.id) ? 'محول' : '-',
        work_status: getWorkStatus(app.id) === 'approved' ? 'مكتمل' : getWorkStatus(app.id) === 'pending' ? 'بانتظار المراجعة' : '-',
        submitted_at: app.submitted_at 
          ? format(new Date(app.submitted_at), 'dd/MM/yyyy')
          : format(new Date(app.created_at), 'dd/MM/yyyy'),
      }));

      await exportToExcel({
        sheetName: 'طلباتي',
        fileName: `طلباتي_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
        columns: [
          { header: 'رقم الطلب', key: 'id', width: 15 },
          { header: 'مقدم الطلب', key: 'full_name', width: 25 },
          { header: 'الجوال', key: 'phone', width: 18 },
          { header: 'الوجهة', key: 'country', width: 15 },
          { header: 'نوع التأشيرة', key: 'visa_type', width: 20 },
          { header: 'الحالة', key: 'status', width: 15 },
          { header: 'التحويل', key: 'transfer_status', width: 12 },
          { header: 'الإتمام', key: 'work_status', width: 15 },
          { header: 'تاريخ التقديم', key: 'submitted_at', width: 15 },
        ],
        data,
      });

      toast.success('تم تصدير البيانات بنجاح');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      toast.error('حدث خطأ في تصدير البيانات');
    } finally {
      setExporting(false);
    }
  };

  // Get indicator badges for application row
  const getApplicationIndicators = (appId: string) => {
    const transferStatus = getTransferStatus(appId);
    const workStatus = getWorkStatus(appId);
    const indicators = [];

    if (transferStatus === 'pending') {
      indicators.push(
        <TooltipProvider key="transfer-pending">
          <Tooltip>
            <TooltipTrigger>
              <Badge className="bg-warning/10 text-warning border-warning/30 gap-1">
                <ArrowLeftRight className="h-3 w-3" />
                تحويل معلق
              </Badge>
            </TooltipTrigger>
            <TooltipContent>طلب تحويل قيد انتظار موافقة المشرف</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (transferStatus === 'approved') {
      indicators.push(
        <TooltipProvider key="transfer-approved">
          <Tooltip>
            <TooltipTrigger>
              <Badge className="bg-info/10 text-info gap-1">
                <UserMinus className="h-3 w-3" />
                تم التحويل
              </Badge>
            </TooltipTrigger>
            <TooltipContent>تم تحويل هذا الطلب لوكيل آخر</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (transferStatus === 'rejected') {
      indicators.push(
        <TooltipProvider key="transfer-rejected">
          <Tooltip>
            <TooltipTrigger>
              <Badge className="bg-destructive/10 text-destructive gap-1">
                <X className="h-3 w-3" />
                تحويل مرفوض
              </Badge>
            </TooltipTrigger>
            <TooltipContent>تم رفض طلب التحويل</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    if (workStatus === 'pending') {
      indicators.push(
        <TooltipProvider key="work-pending">
          <Tooltip>
            <TooltipTrigger>
              <Badge className="bg-primary/10 text-primary gap-1">
                <Clock className="h-3 w-3" />
                إتمام معلق
              </Badge>
            </TooltipTrigger>
            <TooltipContent>ملف الإتمام قيد مراجعة المشرف</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (workStatus === 'approved') {
      indicators.push(
        <TooltipProvider key="work-approved">
          <Tooltip>
            <TooltipTrigger>
              <Badge className="bg-success/10 text-success gap-1">
                <CheckCircle2 className="h-3 w-3" />
                مكتمل
              </Badge>
            </TooltipTrigger>
            <TooltipContent>تم اعتماد إتمام المعاملة</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    } else if (workStatus === 'returned') {
      indicators.push(
        <TooltipProvider key="work-returned">
          <Tooltip>
            <TooltipTrigger>
              <Badge className="bg-warning/10 text-warning gap-1">
                <AlertCircle className="h-3 w-3" />
                معاد للمراجعة
              </Badge>
            </TooltipTrigger>
            <TooltipContent>أعاد المشرف الملف للتعديل</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return indicators;
  };

  // Get days since submission
  const getDaysSinceSubmission = (submittedAt: string | null, createdAt: string) => {
    const date = submittedAt ? new Date(submittedAt) : new Date(createdAt);
    return differenceInDays(new Date(), date);
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold">طلباتي</h2>
          <p className="text-muted-foreground">عرض وإدارة الطلبات المعينة لك</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleExportToExcel} 
            variant="outline" 
            size="sm"
            disabled={exporting || filteredApplications.length === 0}
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 ml-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 ml-2" />
            )}
            تصدير Excel
          </Button>
          <Button onClick={() => { fetchApplications(); fetchTransferRequests(); fetchWorkSubmissions(); }} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 ml-2" />
            تحديث
          </Button>
        </div>
      </div>

      {/* Enhanced Quick Stats */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">إجمالي الطلبات</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.pending}</p>
                <p className="text-xs text-muted-foreground">قيد المعالجة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completedWork}</p>
                <p className="text-xs text-muted-foreground">معاملات مكتملة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-info/5 to-info/10 border-info/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-info/10">
                <ArrowLeftRight className="h-5 w-5 text-info" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.transferredCount}</p>
                <p className="text-xs text-muted-foreground">طلبات محولة</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-success/10">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.productivityRate}%</p>
                <p className="text-xs text-muted-foreground">معدل الإنجاز</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap">
          <TabsTrigger value="all" className="gap-2 data-[state=active]:bg-background">
            <FileText className="h-4 w-4" />
            الكل
            <Badge variant="secondary" className="mr-1">{applications.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-2 data-[state=active]:bg-background">
            <Clock className="h-4 w-4" />
            نشطة
            <Badge variant="secondary" className="mr-1">{stats.pending}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending_work" className="gap-2 data-[state=active]:bg-background">
            <Send className="h-4 w-4" />
            بانتظار الاعتماد
            <Badge variant="secondary" className="mr-1">{stats.pendingWork}</Badge>
          </TabsTrigger>
          <TabsTrigger value="completed" className="gap-2 data-[state=active]:bg-background">
            <FileCheck className="h-4 w-4" />
            مكتملة
            <Badge variant="secondary" className="mr-1">{stats.completedWork}</Badge>
          </TabsTrigger>
          <TabsTrigger value="transferred" className="gap-2 data-[state=active]:bg-background">
            <ArrowLeftRight className="h-4 w-4" />
            محولة
            <Badge variant="secondary" className="mr-1">{stats.transferredCount}</Badge>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Advanced Filters */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              البحث والفلترة
            </CardTitle>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground">
                <X className="h-4 w-4 ml-1" />
                مسح الفلاتر ({activeFiltersCount})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم، الجوال، رقم الطلب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="الحالة" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Country Filter */}
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="الوجهة" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الوجهات</SelectItem>
                {countries.map((country) => (
                  <SelectItem key={country.id} value={country.id}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
              <SelectTrigger>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <SelectValue placeholder="الفترة" />
                </div>
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <span>الطلبات ({filteredApplications.length})</span>
            {filteredApplications.length !== applications.length && (
              <span className="text-sm font-normal text-muted-foreground">
                من أصل {applications.length} طلب
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-muted-foreground">
                {applications.length === 0 
                  ? 'لا توجد طلبات معينة لك حالياً'
                  : 'لا توجد نتائج مطابقة للفلاتر المحددة'}
              </p>
              {activeFiltersCount > 0 && (
                <Button variant="link" onClick={clearAllFilters} className="mt-2">
                  مسح جميع الفلاتر
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table className="table-fixed w-full" style={{ minWidth: '1100px' }}>
                <colgroup>
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '220px' }} />
                  <col style={{ width: '200px' }} />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '140px' }} />
                  <col style={{ width: '160px' }} />
                  <col style={{ width: '110px' }} />
                </colgroup>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-right font-semibold">رقم الطلب</TableHead>
                    <TableHead className="text-right font-semibold">مقدم الطلب</TableHead>
                    <TableHead className="text-right font-semibold">الوجهة</TableHead>
                    <TableHead className="text-right font-semibold">تاريخ التقديم</TableHead>
                    <TableHead className="text-right font-semibold">الحالة</TableHead>
                    <TableHead className="text-right font-semibold">حالة العمل</TableHead>
                    <TableHead className="text-right font-semibold">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => {
                    const indicators = getApplicationIndicators(app.id);
                    const daysSince = getDaysSinceSubmission(app.submitted_at, app.created_at);
                    
                    return (
                      <TableRow key={app.id} className="hover:bg-muted/50 h-[68px]">
                        <TableCell className="font-mono text-xs align-middle">
                          <div className="flex flex-col gap-1">
                            <span className="truncate">{app.id.slice(0, 8)}...</span>
                            {daysSince > 3 && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 w-fit bg-warning/10 text-warning border-warning/30">
                                منذ {daysSince} يوم
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="min-w-0">
                            <p className="font-medium truncate">{app.profile?.full_name || 'غير محدد'}</p>
                            <p className="text-xs text-muted-foreground tabular-nums truncate" dir="ltr">{app.profile?.phone || '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          <div className="flex items-center gap-2 min-w-0">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <div className="min-w-0">
                              <p className="truncate">{app.visa_type?.country?.name || '-'}</p>
                              <p className="text-xs text-muted-foreground truncate">{app.visa_type?.name || '-'}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="align-middle whitespace-nowrap text-sm">
                          {app.submitted_at 
                            ? format(new Date(app.submitted_at), 'dd MMM yyyy', { locale: ar })
                            : format(new Date(app.created_at), 'dd MMM yyyy', { locale: ar })}
                        </TableCell>
                        <TableCell className="align-middle">{getStatusBadge(app.status)}</TableCell>
                        <TableCell className="align-middle">
                          <div className="flex flex-wrap gap-1 items-center">
                            {indicators.length > 0 ? indicators : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-middle">
                          <Button asChild size="sm" variant="outline">
                            <Link to={`/agent/applications/${app.id}`}>
                              <Eye className="h-4 w-4 ml-1" />
                              عرض
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
