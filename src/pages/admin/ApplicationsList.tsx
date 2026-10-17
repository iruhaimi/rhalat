import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { AdminTable } from '@/components/admin/AdminTable';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Search, 
  Eye, 
  Filter,
  Loader2,
  RefreshCw,
  Download,
  Users,
  ClipboardList
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { exportToExcel } from '@/lib/exportToExcel';
import { BulkAssignDialog } from '@/components/admin/BulkAssignDialog';
import { PageHeader } from '@/components/admin/PageHeader';

const STATUS_OPTIONS = [
  { value: 'all', label: 'جميع الحالات' },
  { value: 'draft', label: 'مسودة' },
  { value: 'pending_payment', label: 'بانتظار الدفع' },
  { value: 'submitted', label: 'مقدم' },
  { value: 'under_review', label: 'قيد المراجعة' },
  { value: 'documents_required', label: 'مستندات مطلوبة' },
  { value: 'processing', label: 'قيد المعالجة' },
  { value: 'approved', label: 'معتمد' },
  { value: 'rejected', label: 'مرفوض' },
  { value: 'cancelled', label: 'ملغي' },
];

const ASSIGNMENT_OPTIONS = [
  { value: 'all', label: 'الكل' },
  { value: 'unassigned', label: 'بدون وكيل' },
  { value: 'assigned', label: 'مُسند' },
];

interface Application {
  id: string;
  status: string;
  created_at: string;
  travel_date: string | null;
  user_id: string;
  assigned_agent_id: string | null;
  visa_type: {
    name: string;
    country: {
      name: string;
    };
  };
  profile: {
    full_name: string;
    phone: string;
  };
  assigned_agent?: {
    full_name: string;
  } | null;
}

export default function ApplicationsList() {
  const { isAdmin } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAssignOpen, setBulkAssignOpen] = useState(false);

  useEffect(() => {
    fetchApplications();
  }, [assignmentFilter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('applications')
        .select(`
          id,
          status,
          created_at,
          travel_date,
          user_id,
          assigned_agent_id,
          visa_type:visa_types(
            name,
            country:countries(name)
          ),
          profile:profiles!applications_user_id_fkey(
            full_name,
            phone
          ),
          assigned_agent:profiles!applications_assigned_agent_id_fkey(
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (assignmentFilter === 'unassigned') {
        query = query.is('assigned_agent_id', null);
      } else if (assignmentFilter === 'assigned') {
        query = query.not('assigned_agent_id', 'is', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      setApplications(data || []);
      setSelectedIds(new Set());
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusCounts = useMemo(() => {
    const counts = new Map<string, number>();
    applications.forEach(app => {
      counts.set(app.status, (counts.get(app.status) || 0) + 1);
    });
    return counts;
  }, [applications]);

  // One chip for "الكل" plus one per status actually present in the data
  const statusChips = useMemo(() => {
    const ordered = STATUS_OPTIONS.filter(
      opt => opt.value === 'all' || statusCounts.has(opt.value)
    );
    const extras = Array.from(statusCounts.keys())
      .filter(s => !STATUS_OPTIONS.some(opt => opt.value === s))
      .map(s => ({ value: s, label: s }));
    return [...ordered, ...extras].map(opt => ({
      ...opt,
      count: opt.value === 'all' ? applications.length : (statusCounts.get(opt.value) || 0),
    }));
  }, [statusCounts, applications]);

  const filteredApplications = applications.filter(app => {
    if (statusFilter !== 'all' && app.status !== statusFilter) return false;
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      app.id.toLowerCase().includes(searchLower) ||
      app.profile?.full_name?.toLowerCase().includes(searchLower) ||
      app.profile?.phone?.includes(searchQuery) ||
      app.visa_type?.country?.name?.toLowerCase().includes(searchLower) ||
      app.assigned_agent?.full_name?.toLowerCase().includes(searchLower)
    );
  });

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredApplications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApplications.map(a => a.id)));
    }
  };

  const selectedAppsForBulk = filteredApplications
    .filter(a => selectedIds.has(a.id))
    .map(a => ({
      id: a.id,
      applicant_name: a.profile?.full_name || 'عميل',
      country: a.visa_type?.country?.name || '',
      visa_type: a.visa_type?.name || '',
    }));

  const getStatusLabel = (status: string) => {
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
    return statusLabels[status] || status;
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

  const handleExportToExcel = async () => {
    const data = filteredApplications.map(app => ({
      id: app.id,
      full_name: app.profile?.full_name || 'غير محدد',
      phone: app.profile?.phone || '-',
      country: app.visa_type?.country?.name || '-',
      visa_type: app.visa_type?.name || '-',
      created_at: format(new Date(app.created_at), 'yyyy-MM-dd'),
      travel_date: app.travel_date ? format(new Date(app.travel_date), 'yyyy-MM-dd') : '-',
      status: getStatusLabel(app.status),
    }));

    await exportToExcel({
      sheetName: 'الطلبات',
      fileName: `applications_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.xlsx`,
      columns: [
        { header: 'رقم الطلب', key: 'id', width: 40 },
        { header: 'اسم مقدم الطلب', key: 'full_name', width: 25 },
        { header: 'رقم الجوال', key: 'phone', width: 15 },
        { header: 'الوجهة', key: 'country', width: 15 },
        { header: 'نوع التأشيرة', key: 'visa_type', width: 20 },
        { header: 'تاريخ الإنشاء', key: 'created_at', width: 12 },
        { header: 'تاريخ السفر', key: 'travel_date', width: 12 },
        { header: 'الحالة', key: 'status', width: 15 },
      ],
      data,
    });
  };

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        icon={ClipboardList}
        title="إدارة الطلبات"
        description="عرض وإدارة جميع طلبات التأشيرات في مكان واحد"
        actions={
          <>
            {selectedIds.size > 0 && (
              <Button onClick={() => setBulkAssignOpen(true)} variant="default" size="sm">
                <Users className="h-4 w-4 ml-2" />
                تعيين جماعي ({selectedIds.size})
              </Button>
            )}
            <Button onClick={handleExportToExcel} variant="outline" size="sm">
              <Download className="h-4 w-4 ml-2" />
              تصدير Excel
            </Button>
            <Button onClick={fetchApplications} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 ml-2" />
              تحديث
            </Button>
          </>
        }
      />

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم، رقم الجوال، أو رقم الطلب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <Filter className="h-4 w-4 ml-2" />
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
            <Select value={assignmentFilter} onValueChange={setAssignmentFilter}>
              <SelectTrigger className="w-full md:w-36">
                <Users className="h-4 w-4 ml-2" />
                <SelectValue placeholder="الإسناد" />
              </SelectTrigger>
              <SelectContent>
                {ASSIGNMENT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Status chips */}
      <div className="flex flex-wrap items-center gap-2">
        {statusChips.map((chip) => {
          const isActive = statusFilter === chip.value;
          return (
            <button
              key={chip.value}
              type="button"
              onClick={() => {
                setStatusFilter(chip.value);
                setSelectedIds(new Set());
              }}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card text-foreground border border-border hover:bg-muted'
              }`}
            >
              {chip.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
                  isActive
                    ? 'bg-primary-foreground/20 text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {chip.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Applications Table */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>
            الطلبات ({filteredApplications.length})
          </CardTitle>
          {selectedIds.size > 0 && (
            <span className="text-sm text-muted-foreground">
              تم تحديد {selectedIds.size} طلب
            </span>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              لا توجد طلبات مطابقة للبحث
            </div>
          ) : (
            <AdminTable
              minWidth="1100px"
              columns={[
                {
                  width: '48px',
                  align: 'center',
                  label: (
                    <Checkbox
                      checked={selectedIds.size === filteredApplications.length && filteredApplications.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  ),
                },
                { width: '120px', label: 'رقم الطلب' },
                { width: '220px', label: 'مقدم الطلب' },
                { width: '160px', label: 'الوجهة' },
                { width: '160px', label: 'الوكيل' },
                { width: '140px', label: 'تاريخ الإنشاء' },
                { width: '140px', label: 'الحالة' },
                { width: '110px', label: 'إجراءات' },
              ]}
            >
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id} className={`h-[64px] ${selectedIds.has(app.id) ? 'bg-primary/5' : ''}`}>
                      <TableCell className="text-center align-middle">
                        <Checkbox
                          checked={selectedIds.has(app.id)}
                          onCheckedChange={() => toggleSelect(app.id)}
                        />
                      </TableCell>
                      <TableCell className="font-mono text-xs align-middle truncate">
                        {app.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="min-w-0">
                          <p className="font-medium truncate">{app.profile?.full_name || 'غير محدد'}</p>
                          <p className="text-xs text-muted-foreground tabular-nums truncate" dir="ltr">{app.profile?.phone || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle truncate">{app.visa_type?.country?.name || '-'}</TableCell>
                      <TableCell className="align-middle truncate">
                        {app.assigned_agent?.full_name || (
                          <span className="text-destructive text-xs">غير مُسند</span>
                        )}
                      </TableCell>
                      <TableCell className="align-middle whitespace-nowrap text-sm">
                        {format(new Date(app.created_at), 'dd MMM yyyy', { locale: ar })}
                      </TableCell>
                      <TableCell className="align-middle">{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="align-middle">
                        <Button asChild size="sm" variant="outline">
                          <Link to={`${isAdmin ? '/admin' : '/agent'}/applications/${app.id}`}>
                            <Eye className="h-4 w-4 ml-1" />
                            عرض
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
            </AdminTable>
          )}
        </CardContent>
      </Card>

      {/* Bulk Assign Dialog */}
      <BulkAssignDialog
        open={bulkAssignOpen}
        onOpenChange={setBulkAssignOpen}
        selectedApplications={selectedAppsForBulk}
        onSuccess={fetchApplications}
      />
    </div>
  );
}
