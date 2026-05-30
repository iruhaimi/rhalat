import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, MessageSquare, Trash2, ExternalLink, Wrench } from 'lucide-react';
import { toast } from 'sonner';

type Conv = { id: string; title: string; created_at: string; updated_at: string };
type Msg = { id: string; role: string; content: string | null; tool_name: string | null; tool_result: any; created_at: string };

export default function AIAssistantHistory() {
  const { isSuperAdmin, loading: permsLoading } = usePermissions();
  const [convs, setConvs] = useState<Conv[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<Conv | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ai_assistant_conversations')
      .select('id, title, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(100);
    setConvs(data ?? []);
    // counts
    if (data && data.length > 0) {
      const map: Record<string, number> = {};
      await Promise.all(
        data.map(async (c) => {
          const { count } = await supabase
            .from('ai_assistant_messages')
            .select('id', { count: 'exact', head: true })
            .eq('conversation_id', c.id);
          map[c.id] = count ?? 0;
        })
      );
      setCounts(map);
    }
    setLoading(false);
  };

  const openConv = async (c: Conv) => {
    setSelected(c);
    const { data } = await supabase
      .from('ai_assistant_messages')
      .select('id, role, content, tool_name, tool_result, created_at')
      .eq('conversation_id', c.id)
      .order('created_at', { ascending: true });
    setMessages((data ?? []) as Msg[]);
  };

  const deleteConv = async (c: Conv) => {
    if (!confirm(`حذف "${c.title}"؟`)) return;
    const { error } = await supabase.from('ai_assistant_conversations').delete().eq('id', c.id);
    if (error) toast.error(error.message);
    else {
      toast.success('تم الحذف');
      if (selected?.id === c.id) { setSelected(null); setMessages([]); }
      load();
    }
  };

  useEffect(() => { load(); }, []);

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">سجل محادثات المساعد الذكي</h1>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/ai-assistant">← العودة للمساعد</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 h-[calc(100vh-12rem)]">
        <Card className="p-3 flex flex-col overflow-hidden">
          <p className="text-sm text-muted-foreground mb-2">{convs.length} محادثة</p>
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-1">
              {loading && <p className="text-sm text-muted-foreground p-2">جار التحميل...</p>}
              {!loading && convs.length === 0 && (
                <p className="text-sm text-muted-foreground p-2">لا توجد محادثات.</p>
              )}
              {convs.map(c => (
                <div key={c.id}
                  className={`rounded border p-2 cursor-pointer hover:bg-muted/50 ${selected?.id === c.id ? 'bg-muted' : ''}`}
                  onClick={() => openConv(c)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{c.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {new Date(c.updated_at).toLocaleString('ar-SA')}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      <MessageSquare className="h-3 w-3 ml-1" />{counts[c.id] ?? 0}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        <Card className="flex flex-col overflow-hidden">
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              اختر محادثة لعرض رسائلها
            </div>
          ) : (
            <>
              <div className="border-b p-3 flex items-center gap-2">
                <h2 className="font-semibold flex-1 truncate">{selected.title}</h2>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/ai-assistant"><ExternalLink className="h-3.5 w-3.5 ml-1" />فتح</Link>
                </Button>
                <Button variant="destructive" size="sm" onClick={() => deleteConv(selected)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="flex flex-col gap-3">
                  {messages.map(m => (
                    <div key={m.id} className={`rounded-lg px-3 py-2 text-sm ${
                      m.role === 'user' ? 'bg-primary/10 self-start' :
                      m.role === 'tool' ? 'bg-muted border border-dashed text-xs' :
                      'bg-muted'
                    }`}>
                      <p className="text-[11px] font-mono text-muted-foreground mb-1">
                        {m.role}{m.tool_name ? ` · ${m.tool_name}` : ''} · {new Date(m.created_at).toLocaleString('ar-SA')}
                      </p>
                      {m.role === 'tool' ? (
                        <div className="flex items-start gap-2">
                          <Wrench className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                          <pre className="text-[11px] overflow-x-auto whitespace-pre-wrap">
                            {JSON.stringify(m.tool_result, null, 2)}
                          </pre>
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}