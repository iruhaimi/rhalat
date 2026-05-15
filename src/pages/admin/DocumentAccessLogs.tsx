import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
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
  Shield, 
  Search, 
  FileText, 
  Eye, 
  Download, 
  Edit,
  Calendar,
  User,
  AlertTriangle,
  Filter,
  RefreshCw
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface DocumentAccessLog {
  id: string;
  document_id: string;
  application_id: string;
  accessed_by: string;
  accessed_by_name: string | null;
  access_type: string;
  document_type: string | null;
  user_agent: string | null;
  created_at: string;
}

export default function DocumentAccessLogs() {
  const { direction } = useLanguage();
  const { isSuperAdmin, hasPermission } = usePermissions();
  const { isAdmin } = useAuth();
  const isRTL = direction === 'rtl';

  const [searchQuery, setSearchQuery] = useState('');
  const [accessTypeFilter, setAccessTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['document-access-logs', accessTypeFilter, dateFilter],
    queryFn: async () => {
      let query = supabase
        .from('document_access_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (accessTypeFilter !== 'all') {
        query = query.eq('access_type', accessTypeFilter);
      }

      if (dateFilter === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        query = query.gte('created_at', today.toISOString());
      } else if (dateFilter === 'week') {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        query = query.gte('created_at', weekAgo.toISOString());
      } else if (dateFilter === 'month') {
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        query = query.gte('created_at', monthAgo.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DocumentAccessLog[];
    },
    enabled: isAdmin || isSuperAdmin
  });

  // Filter by search
  const filteredLogs = logs?.filter(log => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      log.accessed_by_name?.toLowerCase().includes(search) ||
      log.document_type?.toLowerCase().includes(search) ||
      log.application_id.toLowerCase().includes(search)
    );
  });

  // Stats
  const stats = {
    total: logs?.length || 0,
    views: logs?.filter(l => l.access_type === 'view').length || 0,
    downloads: logs?.filter(l => l.access_type === 'download').length || 0,
    updates: logs?.filter(l => l.access_type === 'update').length || 0,
  };

  const getAccessTypeIcon = (type: string) => {
    switch (type) {
      case 'view': return <Eye className="h-4 w-4 text-info" />;
      case 'download': return <Download className="h-4 w-4 text-success" />;
      case 'update': return <Edit className="h-4 w-4 text-warning" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getAccessTypeBadge = (type: string) => {
    switch (type) {
      case 'view':
        return <Badge variant="outline" className="bg-info/10 text-info border-info/30">عرض</Badge>;
      case 'download':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30">تحميل</Badge>;
      case 'update':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30">تحديث</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  if (!isAdmin && !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">غير مصرح</h2>
            <p className="text-muted-foreground">
              هذه الصفحة متاحة فقط للمشرفين
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", isRTL && "text-right")}>
      {/* Header */}
      <div className="flex items-center gap-4 pb-4 border-b">
        <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">سجلات وصول المستندات</h1>
          <p className="text-muted-foreground">
            تتبع جميع عمليات الوصول للمستندات الحساسة
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">إجمالي العمليات</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">عمليات العرض</p>
                <p className="text-2xl font-bold text-info">{stats.views}</p>
              </div>
              <Eye className="h-8 w-8 text-info/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">عمليات التحميل</p>
                <p className="text-2xl font-bold text-success">{stats.downloads}</p>
              </div>
              <Download className="h-8 w-8 text-success/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">عمليات التحديث</p>
                <p className="text-2xl font-bold text-warning">{stats.updates}</p>
              </div>
              <Edit className="h-8 w-8 text-warning/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم أو نوع المستند أو رقم الطلب..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={accessTypeFilter} onValueChange={setAccessTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 ml-2" />
                <SelectValue placeholder="نوع العملية" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">الكل</SelectItem>
                <SelectItem value="view">عرض</SelectItem>
                <SelectItem value="download">تحميل</SelectItem>
                <SelectItem value="update">تحديث</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[150px]">
                <Calendar className="h-4 w-4 ml-2" />
                <SelectValue placeholder="الفترة" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الفترات</SelectItem>
                <SelectItem value="today">اليوم</SelectItem>
                <SelectItem value="week">آخر أسبوع</SelectItem>
                <SelectItem value="month">آخر شهر</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            سجل الوصول
            {filteredLogs && (
              <Badge variant="secondary" className="mr-2">
                {filteredLogs.length} سجل
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !filteredLogs || filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">لا توجد سجلات وصول</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="overflow-x-auto">
              <Table className="table-fixed w-full" style={{ minWidth: '900px' }}>
                <colgroup>
                  <col style={{ width: '240px' }} />
                  <col style={{ width: '180px' }} />
                  <col style={{ width: '180px' }} />
                  <col style={{ width: '160px' }} />
                  <col style={{ width: '200px' }} />
                </colgroup>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="text-right font-semibold">الموظف</TableHead>
                    <TableHead className="text-right font-semibold">نوع العملية</TableHead>
                    <TableHead className="text-right font-semibold">نوع المستند</TableHead>
                    <TableHead className="text-right font-semibold">رقم الطلب</TableHead>
                    <TableHead className="text-right font-semibold">التوقيت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} className="h-[60px]">
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-2 min-w-0">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium truncate">
                            {log.accessed_by_name || 'غير معروف'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="flex items-center gap-2">
                          {getAccessTypeIcon(log.access_type)}
                          {getAccessTypeBadge(log.access_type)}
                        </div>
                      </TableCell>
                      <TableCell className="align-middle">
                        <span className="text-sm truncate block">
                          {log.document_type || '-'}
                        </span>
                      </TableCell>
                      <TableCell className="align-middle">
                        <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                          {log.application_id.slice(0, 8)}...
                        </code>
                      </TableCell>
                      <TableCell className="align-middle">
                        <div className="text-sm tabular-nums">
                          <p>{format(new Date(log.created_at), 'dd/MM/yyyy HH:mm', { locale: ar })}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ar })}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
