import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, FileSearch, Loader2, RefreshCw, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

const PAGE_SIZE = 50;

const categoryColors: Record<string, string> = {
  security: 'bg-red-100 text-red-800 border-red-200',
  general: 'bg-gray-100 text-gray-800 border-gray-200',
  application: 'bg-blue-100 text-blue-800 border-blue-200',
  user: 'bg-purple-100 text-purple-800 border-purple-200',
  settings: 'bg-amber-100 text-amber-800 border-amber-200',
};

export default function StaffAuditLog() {
  const [search, setSearch] = useState('');
  const [eventType, setEventType] = useState<string>('all');
  const [category, setCategory] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);

  const { data: eventTypes } = useQuery({
    queryKey: ['audit-event-types'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_audit_event_types');
      if (error) throw error;
      return data || [];
    },
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['staff-audit-log', search, eventType, category, dateFrom, dateTo, page],
    queryFn: async () => {
      let q = supabase
        .from('staff_audit_log')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (eventType !== 'all') q = q.eq('event_type', eventType);
      if (category !== 'all') q = q.eq('event_category', category);
      if (dateFrom) q = q.gte('created_at', new Date(dateFrom).toISOString());
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        q = q.lte('created_at', to.toISOString());
      }
      if (search.trim()) {
        const s = `%${search.trim()}%`;
        q = q.or(`actor_email.ilike.${s},actor_name.ilike.${s},description.ilike.${s}`);
      }

      const { data, error, count } = await q;
      if (error) throw error;
      return { rows: data || [], total: count || 0 };
    },
  });

  const totalPages = useMemo(() => Math.ceil((data?.total || 0) / PAGE_SIZE), [data]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    eventTypes?.forEach((e: any) => e.event_category && set.add(e.event_category));
    return Array.from(set);
  }, [eventTypes]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileSearch className="h-6 w-6 text-primary" />
            سجل تدقيق أعمال الموظفين
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            عرض جميع العمليات الحساسة التي قام بها فريق العمل (للقراءة فقط)
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
          <RefreshCw className={`h-4 w-4 ml-2 ${isFetching ? 'animate-spin' : ''}`} />
          تحديث
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">عوامل التصفية</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="بحث (الاسم/البريد/الوصف)..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pr-9"
            />
          </div>

          <Select value={category} onValueChange={(v) => { setCategory(v); setPage(0); }}>
            <SelectTrigger><SelectValue placeholder="الفئة" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الفئات</SelectItem>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={eventType} onValueChange={(v) => { setEventType(v); setPage(0); }}>
            <SelectTrigger><SelectValue placeholder="نوع الحدث" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأحداث</SelectItem>
              {eventTypes?.map((e: any) => (
                <SelectItem key={e.event_type} value={e.event_type}>
                  {e.event_type} ({e.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2 lg:col-span-1">
            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }} />
          </div>
          <div className="flex gap-2 lg:col-span-1">
            <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="overflow-x-auto">
                <Table className="table-fixed w-full" style={{ minWidth: '1100px' }}>
                  <colgroup>
                    <col style={{ width: '160px' }} />
                    <col style={{ width: '220px' }} />
                    <col style={{ width: '160px' }} />
                    <col style={{ width: '140px' }} />
                    <col style={{ width: '320px' }} />
                    <col style={{ width: '180px' }} />
                  </colgroup>
                  <TableHeader className="sticky top-0 bg-card z-10">
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="text-right font-semibold">الوقت</TableHead>
                      <TableHead className="text-right font-semibold">المستخدم</TableHead>
                      <TableHead className="text-right font-semibold">الحدث</TableHead>
                      <TableHead className="text-right font-semibold">الفئة</TableHead>
                      <TableHead className="text-right font-semibold">الوصف</TableHead>
                      <TableHead className="text-right font-semibold">الهدف</TableHead>
                    </TableRow>
                  </TableHeader>
                <TableBody>
                  {data?.rows.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد سجلات مطابقة</TableCell></TableRow>
                  ) : data?.rows.map((row: any) => (
                    <TableRow key={row.id} className="h-[60px]">
                      <TableCell className="text-xs whitespace-nowrap align-middle tabular-nums">
                        {format(new Date(row.created_at), 'yyyy/MM/dd HH:mm', { locale: ar })}
                      </TableCell>
                      <TableCell className="text-sm align-middle">
                        <div className="font-medium truncate">{row.actor_name || '—'}</div>
                        <div className="text-xs text-muted-foreground truncate" dir="ltr">{row.actor_email}</div>
                      </TableCell>
                      <TableCell className="align-middle"><Badge variant="outline" className="truncate max-w-full">{row.event_type}</Badge></TableCell>
                      <TableCell className="align-middle">
                        <Badge variant="outline" className={categoryColors[row.event_category] || ''}>
                          {row.event_category}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm align-middle truncate" title={row.description}>{row.description}</TableCell>
                      <TableCell className="text-xs text-muted-foreground align-middle truncate">
                        {row.target_type ? `${row.target_type}#${(row.target_id || '').slice(0, 8)}` : '—'}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            صفحة {page + 1} من {totalPages} (إجمالي {data?.total} سجل)
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>السابق</Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>التالي</Button>
          </div>
        </div>
      )}
    </div>
  );
}
