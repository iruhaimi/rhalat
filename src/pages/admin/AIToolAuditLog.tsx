import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Download, CheckCircle2, XCircle, ChevronDown, ChevronRight } from 'lucide-react';

type Row = {
  id: string;
  tool_name: string;
  arguments: any;
  result: any;
  success: boolean;
  error: string | null;
  duration_ms: number | null;
  created_at: string;
  conversation_id: string | null;
};

export default function AIToolAuditLog() {
  const { isSuperAdmin, loading: permsLoading } = usePermissions();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ai_tool_invocations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500);
    setRows((data ?? []) as Row[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggle = (id: string) => {
    const s = new Set(expanded);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpanded(s);
  };

  const filtered = rows.filter(r => {
    if (statusFilter === 'success' && !r.success) return false;
    if (statusFilter === 'failed' && r.success) return false;
    if (search && !r.tool_name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const exportCSV = () => {
    const header = ['created_at', 'tool_name', 'success', 'duration_ms', 'error', 'arguments', 'result'];
    const csv = [
      header.join(','),
      ...filtered.map(r => [
        r.created_at,
        r.tool_name,
        r.success,
        r.duration_ms ?? '',
        (r.error ?? '').replace(/,/g, ';'),
        JSON.stringify(r.arguments).replace(/"/g, '""'),
        JSON.stringify(r.result).replace(/"/g, '""'),
      ].map(v => `"${v}"`).join(','))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (permsLoading) return null;
  if (!isSuperAdmin) {
    return (
      <Card className="p-6 text-center">
        <AlertTriangle className="h-10 w-10 mx-auto text-destructive mb-2" />
        <p>هذه الصفحة متاحة لمالك النظام فقط.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-2xl font-bold">سجل تدقيق أدوات المساعد الذكي</h1>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/ai-assistant">← العودة للمساعد</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="h-4 w-4 ml-1" /> تصدير CSV
          </Button>
        </div>
      </div>

      <Card className="p-3 flex flex-wrap gap-2 items-center">
        <Input
          placeholder="بحث باسم الأداة..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">الكل</SelectItem>
            <SelectItem value="success">ناجحة</SelectItem>
            <SelectItem value="failed">فاشلة</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filtered.length} / {rows.length}</Badge>
      </Card>

      <Card>
        <ScrollArea className="h-[calc(100vh-20rem)]">
          {loading ? (
            <p className="p-6 text-center text-muted-foreground">جار التحميل...</p>
          ) : filtered.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground">لا توجد سجلات.</p>
          ) : (
            <div className="divide-y">
              {filtered.map(r => (
                <div key={r.id} className="p-3">
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => toggle(r.id)}
                  >
                    {expanded.has(r.id) ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    {r.success
                      ? <CheckCircle2 className="h-4 w-4 text-green-600" />
                      : <XCircle className="h-4 w-4 text-destructive" />}
                    <code className="text-sm font-mono">{r.tool_name}</code>
                    <span className="text-xs text-muted-foreground mr-auto">
                      {new Date(r.created_at).toLocaleString('ar-SA')}
                    </span>
                    {r.duration_ms != null && (
                      <Badge variant="outline" className="text-[10px]">{r.duration_ms}ms</Badge>
                    )}
                  </div>
                  {expanded.has(r.id) && (
                    <div className="mt-2 mr-6 grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="font-semibold mb-1">المدخلات:</p>
                        <pre className="bg-muted rounded p-2 overflow-x-auto max-h-60">
                          {JSON.stringify(r.arguments, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <p className="font-semibold mb-1">النتيجة:</p>
                        <pre className="bg-muted rounded p-2 overflow-x-auto max-h-60">
                          {JSON.stringify(r.result, null, 2)}
                        </pre>
                        {r.error && <p className="text-destructive mt-1">خطأ: {r.error}</p>}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </Card>
    </div>
  );
}