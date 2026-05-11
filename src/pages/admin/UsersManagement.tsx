import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { 
  Search,
  Shield,
  User as UserIcon,
  Loader2,
  RefreshCw,
  History,
  Plus,
  Minus,
  Download,
  Calendar,
  Filter,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Users,
  UserCog,
  UserPlus,
  Trash2,
  X,
  Crown
} from 'lucide-react';
import { exportToExcel } from '@/lib/exportToExcel';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfileDialog } from '@/components/admin/UserProfileDialog';
import { StaffUsersTable } from '@/components/admin/StaffUsersTable';
import { CustomersTable } from '@/components/admin/CustomersTable';
import { CreateStaffDialog } from '@/components/admin/CreateStaffDialog';
import { DeleteStaffDialog } from '@/components/admin/DeleteStaffDialog';
import { AddRoleDialog } from '@/components/admin/AddRoleDialog';
import { useDebounce } from '@/hooks/useDebounce';
import type { AppRole } from '@/types/database';
import { PageHeader } from '@/components/admin/PageHeader';
import { StatCard } from '@/components/admin/StatCard';

interface UserWithRole {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  nationality: string | null;
  created_at: string;
  roles: AppRole[];
  email?: string;
}

interface ActivityLogEntry {
  id: string;
  target_user_id: string;
  performed_by: string;
  action: 'add_role' | 'remove_role' | 'create_staff' | 'delete_staff';
  role: AppRole;
  created_at: string;
  target_user_name?: string;
  performer_name?: string;
}

const ROLE_OPTIONS: { value: AppRole; label: string; description: string }[] = [
  { value: 'customer', label: 'عميل', description: 'صلاحيات التقديم على التأشيرات' },
  { value: 'agent', label: 'وكيل', description: 'مراجعة الطلبات المُعيّنة' },
  { value: 'admin', label: 'مشرف', description: 'صلاحيات كاملة على النظام' },
  { value: 'tour_operator', label: 'وكيل سياحي', description: 'إدارة البرامج السياحية في بوابة /tourism-portal' },
];

export default function UsersManagement() {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search with debounce
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // Date filter for users
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  // Activity log
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [loadingLog, setLoadingLog] = useState(false);
  
  // Dialogs
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [newRole, setNewRole] = useState<AppRole | ''>('');
  const [updating, setUpdating] = useState(false);
  const [showCreateStaffDialog, setShowCreateStaffDialog] = useState(false);
  const [showDeleteStaffDialog, setShowDeleteStaffDialog] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<UserWithRole | null>(null);
  
  // Activity log filters
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const debouncedLogSearchQuery = useDebounce(logSearchQuery, 300);
  const [logDateFrom, setLogDateFrom] = useState('');
  const [logDateTo, setLogDateTo] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchUsers();
    fetchActivityLog();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*');

      if (rolesError) throw rolesError;

      // Fetch emails for all users (admin only function)
      const usersWithRolesAndEmails = await Promise.all(
        (profiles || []).map(async (profile) => {
          // Get email using the secure database function
          const { data: email } = await supabase.rpc('get_user_email', {
            target_user_id: profile.user_id
          });

          return {
            ...profile,
            roles: roles?.filter(r => r.user_id === profile.user_id).map(r => r.role) || [],
            email: email || undefined,
          };
        })
      );

      setUsers(usersWithRolesAndEmails);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('حدث خطأ في تحميل المستخدمين');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLog = async () => {
    setLoadingLog(true);
    try {
      const { data: logs, error } = await supabase
        .from('role_activity_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const userIds = new Set<string>();
      logs?.forEach(log => {
        userIds.add(log.target_user_id);
        userIds.add(log.performed_by);
      });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name')
        .in('user_id', Array.from(userIds));

      const userNameMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);

      const enhancedLogs: ActivityLogEntry[] = logs?.map(log => ({
        ...log,
        action: log.action as 'add_role' | 'remove_role',
        target_user_name: userNameMap.get(log.target_user_id) || 'مستخدم غير معروف',
        performer_name: userNameMap.get(log.performed_by) || 'مستخدم غير معروف',
      })) || [];

      setActivityLog(enhancedLogs);
    } catch (error) {
      console.error('Error fetching activity log:', error);
    } finally {
      setLoadingLog(false);
    }
  };

  const logActivity = async (targetUserId: string, action: 'add_role' | 'remove_role', role: AppRole) => {
    if (!user) return;
    
    try {
      await supabase.from('role_activity_log').insert({
        target_user_id: targetUserId,
        performed_by: user.id,
        action,
        role,
      });
    } catch (error) {
      console.error('Error logging activity:', error);
    }
  };

  const handleAddRole = async () => {
    if (!selectedUser || !newRole) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUser.user_id,
          role: newRole,
        });

      if (error) throw error;

      await logActivity(selectedUser.user_id, 'add_role', newRole);

      toast.success('تم إضافة الصلاحية بنجاح');
      setShowRoleDialog(false);
      setSelectedUser(null);
      setNewRole('');
      fetchUsers();
      fetchActivityLog();
    } catch (error: any) {
      console.error('Error adding role:', error);
      if (error.code === '23505') {
        toast.error('هذه الصلاحية موجودة مسبقاً');
      } else {
        toast.error('حدث خطأ في إضافة الصلاحية');
      }
    } finally {
      setUpdating(false);
    }
  };

  const [roleToRemove, setRoleToRemove] = useState<{ userId: string; role: AppRole } | null>(null);
  const [showRemoveRoleDialog, setShowRemoveRoleDialog] = useState(false);
  const [removingRole, setRemovingRole] = useState(false);

  const handleRemoveRole = (userId: string, role: AppRole) => {
    setRoleToRemove({ userId, role });
    setShowRemoveRoleDialog(true);
  };

  const confirmRemoveRole = async () => {
    if (!roleToRemove) return;

    setRemovingRole(true);
    try {
      // Extra guard (UI-level): prevent removing the last admin role (system lockout)
      if (roleToRemove.role === 'admin') {
        const { count: adminCount, error: adminCountError } = await supabase
          .from('user_roles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'admin');

        if (adminCountError) throw adminCountError;

        if ((adminCount || 0) <= 1) {
          toast.error('لا يمكن إزالة دور المشرف من آخر مشرف في النظام');
          setShowRemoveRoleDialog(false);
          setRoleToRemove(null);
          return;
        }
      }

      const { error, count } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', roleToRemove.userId)
        .eq('role', roleToRemove.role);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }

      await logActivity(roleToRemove.userId, 'remove_role', roleToRemove.role);

      toast.success('تم حذف الصلاحية بنجاح');
      setShowRemoveRoleDialog(false);
      setRoleToRemove(null);
      fetchUsers();
      fetchActivityLog();
    } catch (error: any) {
      console.error('Error removing role:', error);
      const msg = (error?.message || '').toString();
      if (msg.includes('cannot_remove_last_admin')) {
        toast.error('لا يمكن إزالة دور المشرف من آخر مشرف في النظام');
      } else {
        toast.error(`حدث خطأ في حذف الصلاحية: ${error.message || 'خطأ غير معروف'}`);
      }
    } finally {
      setRemovingRole(false);
    }
  };

  const handleDeleteAllRoles = async () => {
    if (!selectedUser) return;
    
    setUpdating(true);
    try {
      // Extra guard (UI-level): prevent removing all roles from the last admin
      if (selectedUser.roles.includes('admin')) {
        const { count: adminCount, error: adminCountError } = await supabase
          .from('user_roles')
          .select('id', { count: 'exact', head: true })
          .eq('role', 'admin');

        if (adminCountError) throw adminCountError;

        if ((adminCount || 0) <= 1) {
          toast.error('لا يمكن إزالة صلاحيات آخر مشرف في النظام');
          return;
        }
      }

      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUser.user_id);

      if (error) throw error;

      toast.success('تم إلغاء جميع صلاحيات المستخدم');
      setShowDeleteDialog(false);
      setSelectedUser(null);
      fetchUsers();
      fetchActivityLog();
    } catch (error) {
      console.error('Error deleting roles:', error);
      const msg = (error as any)?.message?.toString?.() || '';
      if (msg.includes('cannot_remove_last_admin')) {
        toast.error('لا يمكن إزالة صلاحيات آخر مشرف في النظام');
      } else {
        toast.error('حدث خطأ في إلغاء الصلاحيات');
      }
    } finally {
      setUpdating(false);
    }
  };

  // Fetch owners (those with manage_staff permission)
  const [owners, setOwners] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    const fetchOwners = async () => {
      const { data } = await supabase
        .from('staff_permissions')
        .select('user_id')
        .eq('permission', 'manage_staff');
      
      setOwners(new Set(data?.map(o => o.user_id) || []));
    };
    fetchOwners();
  }, [users]);

  // Filter users with memoization
  const { staffUsers, customerUsers, stats } = useMemo(() => {
    const filterBySearchAndDate = (user: UserWithRole) => {
      // Search filter
      if (debouncedSearchQuery) {
        const searchLower = debouncedSearchQuery.toLowerCase();
        const matchesSearch = 
          user.full_name?.toLowerCase().includes(searchLower) ||
          user.phone?.includes(debouncedSearchQuery) ||
          user.nationality?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      // Date from filter
      if (dateFrom) {
        const userDate = new Date(user.created_at);
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (userDate < fromDate) return false;
      }
      
      // Date to filter
      if (dateTo) {
        const userDate = new Date(user.created_at);
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        if (userDate > toDate) return false;
      }
      
      return true;
    };

    // Staff = users with admin or agent role (may also have customer)
    const staff = users.filter(u => {
      const isStaff = u.roles.includes('admin') || u.roles.includes('agent');
      return isStaff && filterBySearchAndDate(u);
    });
    
    // Customers = users with ONLY customer role
    const customers = users.filter(u => {
      const isOnlyCustomer = u.roles.length === 1 && u.roles.includes('customer');
      const hasNoRoles = u.roles.length === 0;
      return (isOnlyCustomer || hasNoRoles) && filterBySearchAndDate(u);
    });

    // Count customers same way as list: only customer role OR no roles, and NOT admin/agent
    const customersCount = users.filter(u => {
      const isOnlyCustomer = u.roles.length === 1 && u.roles.includes('customer');
      const hasNoRoles = u.roles.length === 0;
      return isOnlyCustomer || hasNoRoles;
    }).length;

    // Count owners (admins with manage_staff permission)
    const ownersCount = users.filter(u => u.roles.includes('admin') && owners.has(u.user_id)).length;
    
    // Count regular admins (admins without manage_staff permission)
    const regularAdminsCount = users.filter(u => u.roles.includes('admin') && !owners.has(u.user_id)).length;

    return {
      staffUsers: staff,
      customerUsers: customers,
      stats: {
        total: users.length,
        owners: ownersCount,
        admins: regularAdminsCount,
        agents: users.filter(u => u.roles.includes('agent')).length,
        customers: customersCount,
      }
    };
  }, [users, debouncedSearchQuery, dateFrom, dateTo, owners]);

  const getRoleBadge = (role: AppRole) => {
    const config: Record<AppRole, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      customer: { label: 'عميل', variant: 'secondary' },
      agent: { label: 'وكيل', variant: 'default' },
      admin: { label: 'مشرف', variant: 'destructive' },
      tour_operator: { label: 'منظم رحلات', variant: 'outline' },
    };
    return (
      <Badge variant={config[role].variant} className="text-xs">
        {config[role].label}
      </Badge>
    );
  };

  // Export users to Excel
  const exportUsersToExcel = async (type: 'staff' | 'customers' | 'all') => {
    const usersToExport = type === 'staff' 
      ? staffUsers 
      : type === 'customers' 
        ? customerUsers 
        : [...staffUsers, ...customerUsers];
    
    const data = usersToExport.map(user => ({
      full_name: user.full_name || 'غير محدد',
      phone: user.phone || '-',
      nationality: user.nationality || '-',
      created_at: format(new Date(user.created_at), 'dd/MM/yyyy', { locale: ar }),
      roles: user.roles.map(r => ROLE_OPTIONS.find(o => o.value === r)?.label).join(', ') || 'عميل',
    }));

    const typeName = type === 'staff' ? 'الموظفين' : type === 'customers' ? 'العملاء' : 'المستخدمين';
    
    await exportToExcel({
      sheetName: 'المستخدمين',
      fileName: `${typeName}_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
      columns: [
        { header: 'الاسم', key: 'full_name', width: 25 },
        { header: 'رقم الجوال', key: 'phone', width: 15 },
        { header: 'الجنسية', key: 'nationality', width: 15 },
        { header: 'تاريخ التسجيل', key: 'created_at', width: 15 },
        { header: 'الصلاحيات', key: 'roles', width: 20 },
      ],
      data,
    });
    toast.success(`تم تصدير قائمة ${typeName} بنجاح`);
  };

  // Dialog handlers
  const openRoleDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setNewRole('');
    setShowRoleDialog(true);
  };

  const openProfileDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setShowProfileDialog(true);
  };

  const openDeleteDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
  };

  const clearUserFilters = () => {
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
  };

  // Activity log helpers
  const getActionLabel = (action: 'add_role' | 'remove_role' | 'create_staff' | 'delete_staff') => {
    const labels: Record<string, string> = {
      'add_role': 'إضافة صلاحية',
      'remove_role': 'حذف صلاحية',
      'create_staff': 'إنشاء موظف',
      'delete_staff': 'حذف موظف',
    };
    return labels[action] || action;
  };

  const getActionIcon = (action: 'add_role' | 'remove_role' | 'create_staff' | 'delete_staff') => {
    switch (action) {
      case 'add_role':
        return <Plus className="h-4 w-4 text-primary" />;
      case 'remove_role':
        return <Minus className="h-4 w-4 text-destructive" />;
      case 'create_staff':
        return <UserPlus className="h-4 w-4 text-primary" />;
      case 'delete_staff':
        return <Trash2 className="h-4 w-4 text-destructive" />;
      default:
        return <Plus className="h-4 w-4" />;
    }
  };

  // Filter activity log
  const filteredActivityLog = useMemo(() => {
    return activityLog.filter(log => {
      if (debouncedLogSearchQuery) {
        const searchLower = debouncedLogSearchQuery.toLowerCase();
        const matchesTarget = log.target_user_name?.toLowerCase().includes(searchLower);
        const matchesPerformer = log.performer_name?.toLowerCase().includes(searchLower);
        if (!matchesTarget && !matchesPerformer) return false;
      }
      
      if (logDateFrom) {
        const logDate = new Date(log.created_at);
        const fromDate = new Date(logDateFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (logDate < fromDate) return false;
      }
      
      if (logDateTo) {
        const logDate = new Date(log.created_at);
        const toDate = new Date(logDateTo);
        toDate.setHours(23, 59, 59, 999);
        if (logDate > toDate) return false;
      }
      
      return true;
    });
  }, [activityLog, debouncedLogSearchQuery, logDateFrom, logDateTo]);

  // Export activity log to Excel
  const exportActivityLogToExcel = async () => {
    const data = filteredActivityLog.map(log => ({
      created_at: format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ar }),
      action: getActionLabel(log.action),
      target_user_name: log.target_user_name || 'غير معروف',
      role: ROLE_OPTIONS.find(r => r.value === log.role)?.label || log.role,
      performer_name: log.performer_name || 'غير معروف',
    }));

    await exportToExcel({
      sheetName: 'سجل النشاطات',
      fileName: `سجل_النشاطات_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
      columns: [
        { header: 'التاريخ والوقت', key: 'created_at', width: 20 },
        { header: 'الإجراء', key: 'action', width: 15 },
        { header: 'المستخدم المستهدف', key: 'target_user_name', width: 25 },
        { header: 'الصلاحية', key: 'role', width: 12 },
        { header: 'بواسطة', key: 'performer_name', width: 25 },
      ],
      data,
    });
    toast.success('تم تصدير سجل النشاطات بنجاح');
  };

  const clearLogFilters = () => {
    setLogSearchQuery('');
    setLogDateFrom('');
    setLogDateTo('');
    setCurrentPage(1);
  };

  // Pagination logic
  const totalPages = Math.ceil(filteredActivityLog.length / itemsPerPage);
  const paginatedActivityLog = filteredActivityLog.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedLogSearchQuery, logDateFrom, logDateTo]);

  const hasFilters = searchQuery || dateFrom || dateTo;

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        icon={Users}
        title="إدارة المستخدمين"
        description="إدارة شاملة للمستخدمين وصلاحياتهم"
        actions={
          <>
            <Button onClick={() => exportUsersToExcel('all')} variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              تصدير الكل
            </Button>
            <Button onClick={() => { fetchUsers(); fetchActivityLog(); }} variant="outline" size="sm" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>
          </>
        }
      />

      {/* Stats Cards */}
      <div data-admin-stats="true" className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        <StatCard label="إجمالي المستخدمين" value={stats.total} icon={Users} tone="primary" index={0} />
        <StatCard label="المالكين" value={stats.owners} icon={Crown} tone="gold" index={1} />
        <StatCard label="المشرفين" value={stats.admins} icon={Shield} tone="danger" index={2} />
        <StatCard label="الوكلاء" value={stats.agents} icon={UserCog} tone="primary" index={3} />
        <StatCard label="العملاء" value={stats.customers} icon={UserCheck} tone="muted" index={4} />
      </div>

      <Tabs defaultValue="staff" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="staff" className="gap-2">
            <UserCog className="h-4 w-4" />
            الموظفين ({staffUsers.length})
          </TabsTrigger>
          <TabsTrigger value="customers" className="gap-2">
            <UserCheck className="h-4 w-4" />
            العملاء ({customerUsers.length})
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-2">
            <History className="h-4 w-4" />
            سجل النشاطات
          </TabsTrigger>
        </TabsList>

        {/* Shared Filters for Users */}
        <div className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="بحث فوري بالاسم، رقم الجوال، أو الجنسية..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    placeholder="من تاريخ"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">إلى</span>
                  <Input
                    type="date"
                    placeholder="إلى تاريخ"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-40"
                  />
                </div>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearUserFilters}>
                    <X className="h-4 w-4 ml-1" />
                    مسح
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Staff Tab */}
        <TabsContent value="staff" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                الموظفين (المشرفين والوكلاء)
              </CardTitle>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Button size="sm" onClick={() => setShowCreateStaffDialog(true)}>
                    <UserPlus className="h-4 w-4 ml-2" />
                    إنشاء موظف
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => exportUsersToExcel('staff')}>
                  <Download className="h-4 w-4 ml-2" />
                  تصدير
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <StaffUsersTable
                  users={staffUsers}
                  onViewProfile={openProfileDialog}
                  onAddRole={openRoleDialog}
                  onDeleteRoles={openDeleteDialog}
                  onRemoveRole={handleRemoveRole}
                  onDeleteStaff={(user) => {
                    setStaffToDelete(user);
                    setShowDeleteStaffDialog(true);
                  }}
                  isAdmin={isAdmin}
                  onRefresh={() => {
                    fetchUsers();
                    fetchActivityLog();
                  }}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Customers Tab */}
        <TabsContent value="customers" className="space-y-4 mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                العملاء
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => exportUsersToExcel('customers')}>
                <Download className="h-4 w-4 ml-2" />
                تصدير
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <CustomersTable
                  users={customerUsers}
                  onViewProfile={openProfileDialog}
                  onAddRole={openRoleDialog}
                  isAdmin={isAdmin}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Log Tab */}
        <TabsContent value="activity" className="space-y-4 mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="بحث بالاسم..."
                    value={logSearchQuery}
                    onChange={(e) => setLogSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    placeholder="من تاريخ"
                    value={logDateFrom}
                    onChange={(e) => setLogDateFrom(e.target.value)}
                    className="w-40"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">إلى</span>
                  <Input
                    type="date"
                    placeholder="إلى تاريخ"
                    value={logDateTo}
                    onChange={(e) => setLogDateTo(e.target.value)}
                    className="w-40"
                  />
                </div>
                {(logSearchQuery || logDateFrom || logDateTo) && (
                  <Button variant="ghost" size="sm" onClick={clearLogFilters}>
                    <Filter className="h-4 w-4 ml-1" />
                    مسح الفلاتر
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                سجل تغييرات الصلاحيات ({filteredActivityLog.length})
              </CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={exportActivityLogToExcel}
                disabled={filteredActivityLog.length === 0}
              >
                <Download className="h-4 w-4 ml-2" />
                تصدير Excel
              </Button>
            </CardHeader>
            <CardContent>
              {loadingLog ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredActivityLog.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  {activityLog.length === 0 ? 'لا توجد نشاطات مسجلة بعد' : 'لا توجد نتائج مطابقة للبحث'}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">التاريخ والوقت</TableHead>
                        <TableHead className="text-right">الإجراء</TableHead>
                        <TableHead className="text-right">المستخدم المستهدف</TableHead>
                        <TableHead className="text-right">الصلاحية</TableHead>
                        <TableHead className="text-right">بواسطة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedActivityLog.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(log.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getActionIcon(log.action)}
                              <span>{getActionLabel(log.action)}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">
                            {log.target_user_name}
                          </TableCell>
                          <TableCell>
                            {getRoleBadge(log.role)}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {log.performer_name}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    عرض {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredActivityLog.length)} من {filteredActivityLog.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronRight className="h-4 w-4" />
                      السابق
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum: number;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            className="w-9 h-9"
                            onClick={() => setCurrentPage(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      التالي
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Role Dialog */}
      <AddRoleDialog
        open={showRoleDialog}
        onOpenChange={setShowRoleDialog}
        selectedUser={selectedUser}
        newRole={newRole}
        onNewRoleChange={(v) => setNewRole(v as AppRole)}
        onAddRole={handleAddRole}
        updating={updating}
        roleOptions={ROLE_OPTIONS}
      />

      {/* User Profile Dialog (View + Edit combined) */}
      <UserProfileDialog
        user={selectedUser}
        open={showProfileDialog}
        onOpenChange={setShowProfileDialog}
        onSuccess={fetchUsers}
        canEdit={isAdmin}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              إلغاء جميع صلاحيات المستخدم
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من إلغاء جميع صلاحيات المستخدم <strong>{selectedUser?.full_name}</strong>؟
              <br />
              سيفقد المستخدم جميع صلاحياته في النظام.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllRoles}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {updating && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              تأكيد الإلغاء
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Single Role Confirmation Dialog */}
      <AlertDialog open={showRemoveRoleDialog} onOpenChange={setShowRemoveRoleDialog}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Minus className="h-5 w-5 text-destructive" />
              حذف الصلاحية
            </AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف صلاحية <strong>{ROLE_OPTIONS.find(r => r.value === roleToRemove?.role)?.label}</strong> من هذا المستخدم؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel onClick={() => setRoleToRemove(null)}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveRole}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removingRole}
            >
              {removingRole && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              تأكيد الحذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Staff Dialog */}
      <CreateStaffDialog
        open={showCreateStaffDialog}
        onOpenChange={setShowCreateStaffDialog}
        onSuccess={() => {
          fetchUsers();
          fetchActivityLog();
        }}
      />

      {/* Delete Staff Dialog */}
      <DeleteStaffDialog
        user={staffToDelete}
        open={showDeleteStaffDialog}
        onOpenChange={setShowDeleteStaffDialog}
        onSuccess={() => {
          fetchUsers();
          fetchActivityLog();
        }}
      />
    </div>
  );
}
