import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Send, Loader2, Plus, AlertTriangle, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';

const MAX_LEN = 4000;
const sanitize = (s: string) => s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').slice(0, MAX_LEN);

type Msg = {
  id: string;
  role: 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_name?: string | null;
  tool_result?: any;
  created_at: string;
};

const SUGGESTIONS = [
  'اعرض لي الطلبات المعلقة منذ أسبوع',
  'اعرض أداء الوكلاء هذا الشهر',
  'كم عدد الطلبات الجديدة اليوم؟',
  'غير سعر تأشيرة فرنسا السياحية إلى 1500 ريال',
];

export default function AIAssistant() {
  const { user } = useAuth();
  const { isSuperAdmin, loading: permsLoading } = usePermissions();
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversations, setConversations] = useState<{ id: string; title: string; updated_at: string }[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadConversations = async () => {
    const { data } = await supabase
      .from('ai_assistant_conversations')
      .select('id, title, updated_at')
      .order('updated_at', { ascending: false })
      .limit(20);
    setConversations(data ?? []);
  };

  const loadMessages = async (id: string) => {
    const { data } = await supabase
      .from('ai_assistant_messages')
      .select('id, role, content, tool_name, tool_result, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });
    setMessages((data ?? []) as Msg[]);
  };

  useEffect(() => { loadConversations(); }, []);
  useEffect(() => { if (convId) loadMessages(convId); else setMessages([]); }, [convId]);
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' }), 100);
  }, [messages]);

  const send = async (text?: string) => {
    const message = sanitize((text ?? input).trim());
    if (!message || sending) return;
    setInput('');
    setSending(true);

    // Optimistic add
    setMessages(prev => [...prev, {
      id: 'tmp-' + Date.now(), role: 'user', content: message, created_at: new Date().toISOString(),
    }]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-ai-agent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({ conversation_id: convId, message }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error === 'rate_limited'
          ? 'تجاوزت الحد المسموح (30 رسالة/دقيقة). انتظر قليلاً.'
          : data.error || 'فشل الطلب';
        throw new Error(msg);
      }

      const newId = data.conversation_id;
      if (!convId) setConvId(newId);
      await loadMessages(newId);
      loadConversations();
    } catch (e: any) {
      toast.error('خطأ: ' + (e?.message ?? 'تعذّر الإرسال'));
    } finally {
      setSending(false);
    }
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
    <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-4 h-[calc(100vh-7rem)]">
      {/* Conversations sidebar */}
      <Card className="p-3 flex flex-col gap-2 overflow-hidden">
        <Button variant="default" size="sm" onClick={() => { setConvId(null); setMessages([]); }}>
          <Plus className="h-4 w-4 ml-1" /> محادثة جديدة
        </Button>
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-1">
            {conversations.map(c => (
              <button
                key={c.id}
                onClick={() => setConvId(c.id)}
                className={`text-right text-sm px-2 py-2 rounded hover:bg-muted truncate ${convId === c.id ? 'bg-muted font-medium' : ''}`}
              >
                {c.title}
              </button>
            ))}
            {conversations.length === 0 && (
              <p className="text-xs text-muted-foreground p-2">لا توجد محادثات بعد.</p>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat area */}
      <Card className="flex flex-col overflow-hidden">
        <div className="flex items-center gap-2 border-b p-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">المساعد الذكي للإدارة</h2>
          <Badge variant="outline" className="mr-auto">Gemini Flash</Badge>
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/ai-assistant/history">السجل</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/admin/ai-assistant/audit">التدقيق</Link>
          </Button>
        </div>

        <ScrollArea className="flex-1 p-4" ref={scrollRef as any}>
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <Sparkles className="h-12 w-12 text-primary/40" />
              <div>
                <h3 className="font-semibold mb-1">مرحباً بك في المساعد الذكي</h3>
                <p className="text-sm text-muted-foreground">اكتب أمراً بالعربية لإدارة الموقع. مثال:</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
                {SUGGESTIONS.map(s => (
                  <Button key={s} variant="outline" size="sm" onClick={() => send(s)} disabled={sending}>
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                    m.role === 'user' ? 'bg-primary text-primary-foreground' :
                    m.role === 'tool' ? 'bg-muted border border-dashed text-xs' :
                    'bg-muted'
                  }`}>
                    {m.role === 'tool' ? (
                      <div className="flex items-start gap-2">
                        <Wrench className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-mono text-[11px] mb-1">{m.tool_name}</p>
                          <pre className="text-[11px] overflow-x-auto whitespace-pre-wrap max-h-40">
                            {JSON.stringify(m.tool_result, null, 2)}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{m.content ?? ''}</ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="flex justify-end">
                  <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> يفكر...
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="border-t p-3 flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={e => setInput(sanitize(e.target.value))}
            placeholder="اكتب أمرك هنا... (Shift+Enter لسطر جديد)"
            className="resize-none min-h-[44px] max-h-32"
            rows={1}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            disabled={sending}
          />
          <div className="flex flex-col items-center gap-1">
            <Button onClick={() => send()} disabled={sending || !input.trim()} size="icon">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {input.length}/{MAX_LEN}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}