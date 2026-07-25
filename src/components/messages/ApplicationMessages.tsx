import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  MessageCircle, 
  Send, 
  Loader2, 
  AlertCircle,
  AlertTriangle,
  Paperclip,
  Image as ImageIcon,
  FileText,
  X,
  CheckCheck,
  Check,
  Clock,
  Lock
} from 'lucide-react';
import { useApplicationMessages } from '@/hooks/useApplicationMessages';
import { FilePreview } from '@/components/ui/FilePreview';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { MessagePriority, AttachmentType } from '@/types/messages';

interface ApplicationMessagesProps {
  applicationId: string;
  customerName?: string;
  agentName?: string;
}

export function ApplicationMessages({ 
  applicationId, 
  customerName,
  agentName 
}: ApplicationMessagesProps) {
  const { 
    messages, 
    loading, 
    sending, 
    unreadCount,
    sendMessage, 
    markAsRead,
    markOneAsRead,
    senderType,
    isReadOnly
  } = useApplicationMessages(applicationId);

  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<MessagePriority>('normal');
  const [attachment, setAttachment] = useState<{
    file: File;
    type: AttachmentType;
    preview?: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark as read when viewing
  useEffect(() => {
    if (unreadCount > 0) {
      markAsRead();
    }
  }, [unreadCount, markAsRead]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict MIME allowlist — reject spoofed extensions
    const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);
    if (!ALLOWED.has(file.type)) {
      toast.error('يُسمح فقط بالصور ومستندات PDF');
      return;
    }
    const isImage = file.type.startsWith('image/');

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('الحد الأقصى لحجم الملف هو 5 ميجابايت');
      return;
    }

    const type: AttachmentType = isImage ? 'image' : 'pdf';
    const preview = isImage ? URL.createObjectURL(file) : undefined;

    setAttachment({ file, type, preview });
  };

  const removeAttachment = () => {
    if (attachment?.preview) {
      URL.revokeObjectURL(attachment.preview);
    }
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async () => {
    if (!content.trim() && !attachment) return;

    let attachmentPath: string | undefined;
    let attachmentName: string | undefined;
    let attachmentType: AttachmentType | undefined;

    // Upload attachment if exists
    if (attachment) {
      if (!user) {
        toast.error('يجب تسجيل الدخول لإرفاق ملف');
        return;
      }
      setUploading(true);
      try {
        // RLS on `documents` bucket requires the first path segment to equal
        // auth.uid(). Extension is derived from the validated MIME (not user
        // input) to prevent path/type spoofing.
        const extByMime: Record<string, string> = {
          'image/jpeg': 'jpg',
          'image/png': 'png',
          'image/webp': 'webp',
          'application/pdf': 'pdf',
        };
        const ext = extByMime[attachment.file.type] || 'bin';
        const uuid = (crypto as any)?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const path = `${user.id}/messages/${applicationId}/${uuid}.${ext}`;

        const { error } = await supabase.storage
          .from('documents')
          .upload(path, attachment.file, {
            contentType: attachment.file.type,
            upsert: false,
          });

        if (error) throw error;

        attachmentPath = path;
        attachmentName = attachment.file.name;
        attachmentType = attachment.type;
      } catch (error) {
        console.error('Error uploading file:', error);
        toast.error('حدث خطأ في رفع الملف');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    const success = await sendMessage({
      content: content.trim() || (attachment ? 'مرفق' : ''),
      priority,
      attachment_path: attachmentPath,
      attachment_name: attachmentName,
      attachment_type: attachmentType,
    });

    if (success) {
      setContent('');
      setPriority('normal');
      removeAttachment();
    } else {
      toast.error('حدث خطأ في إرسال الرسالة');
    }
  };

  const getPriorityConfig = (p: MessagePriority) => {
    switch (p) {
      case 'urgent':
        return { 
          label: 'عاجل', 
          icon: AlertCircle, 
          className: 'bg-destructive/10 text-destructive border-destructive/20' 
        };
      case 'important':
        return { 
          label: 'مهم', 
          icon: AlertTriangle, 
          className: 'bg-warning/10 text-warning border-warning/20' 
        };
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageCircle className="h-5 w-5 text-primary" />
            المراسلات
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col h-[500px]">
      <CardHeader className="pb-3 shrink-0 border-b">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            المراسلات
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} جديد
              </Badge>
            )}
          </span>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs gap-1"
                onClick={() => markAsRead()}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                تعليم الكل كمقروء
              </Button>
            )}
            {isReadOnly && (
              <Badge variant="outline" className="text-xs gap-1">
                <Lock className="h-3 w-3" />
                عرض فقط
              </Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>

      {/* Messages List */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <MessageCircle className="h-12 w-12 mb-2 opacity-30" />
            <p className="text-sm">لا توجد رسائل بعد</p>
            {!isReadOnly && (
              <p className="text-xs mt-1">ابدأ المحادثة الآن</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => {
              const isOwnMessage = message.sender_type === senderType;
              const priorityConfig = getPriorityConfig(message.priority);
              
              return (
                <div
                  key={message.id}
                  className={cn(
                    'flex gap-3',
                    isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                  )}
                >
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className={cn(
                      "text-xs",
                      message.sender_type === 'agent'
                        ? "bg-primary/10 text-primary"
                        : message.sender_type === 'admin'
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : "bg-success/10 text-success"
                    )}>
                      {(message.sender_name || (
                        message.sender_type === 'agent' ? 'و' :
                        message.sender_type === 'admin' ? 'إ' : 'ع'
                      )).charAt(0)}
                    </AvatarFallback>
                  </Avatar>

                  <div className={cn(
                    'flex flex-col max-w-[75%]',
                    isOwnMessage ? 'items-end' : 'items-start'
                  )}>
                    {/* Sender name & priority */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs text-muted-foreground">
                        {message.sender_name || (
                          message.sender_type === 'agent' ? (agentName || 'الوكيل') :
                          message.sender_type === 'admin' ? 'الإدارة' :
                          (customerName || 'العميل')
                        )}
                      </span>
                      {message.sender_type === 'admin' && (
                        <Badge className="text-[10px] py-0 px-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                          الإدارة
                        </Badge>
                      )}
                      {priorityConfig && (
                        <Badge variant="outline" className={cn("text-[10px] py-0 px-1", priorityConfig.className)}>
                          <priorityConfig.icon className="h-2.5 w-2.5 ml-0.5" />
                          {priorityConfig.label}
                        </Badge>
                      )}
                    </div>

                    {/* Message bubble */}
                    <div className={cn(
                      'rounded-xl px-4 py-2.5 shadow-sm',
                      isOwnMessage 
                        ? 'bg-primary text-primary-foreground rounded-br-sm' 
                        : 'bg-muted rounded-bl-sm'
                    )}>
                      <p className="text-sm whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </p>
                    </div>

                    {/* Attachment */}
                    {message.attachment_path && (
                      <div className="mt-2 w-full max-w-xs">
                        <FilePreview
                          fileName={message.attachment_name || 'مرفق'}
                          filePath={message.attachment_path}
                          variant="compact"
                        />
                      </div>
                    )}

                    {/* Time & read status */}
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(message.created_at), 'HH:mm', { locale: ar })}
                      </span>
                      {isOwnMessage && (
                        message.is_read ? (
                          <CheckCheck className="h-3 w-3 text-primary" />
                        ) : (
                          <Check className="h-3 w-3 text-muted-foreground" />
                        )
                      )}
                      {!isOwnMessage && !message.is_read && (
                        <button
                          type="button"
                          onClick={() => markOneAsRead(message.id)}
                          className="text-[10px] text-primary hover:underline"
                        >
                          تعليم كمقروء
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Input Area */}
      {!isReadOnly && (
        <div className="shrink-0 border-t p-4 space-y-3 bg-muted/30">
          {/* Attachment preview */}
          {attachment && (
            <div className="flex items-center gap-3 p-2 rounded-lg bg-background border">
              {attachment.type === 'image' && attachment.preview ? (
                <img 
                  src={attachment.preview} 
                  alt="معاينة" 
                  className="h-12 w-12 object-cover rounded"
                />
              ) : (
                <div className="h-12 w-12 flex items-center justify-center bg-destructive/10 rounded">
                  <FileText className="h-6 w-6 text-destructive" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{attachment.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(attachment.file.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                onClick={removeAttachment}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Priority selector & attachment button */}
          <div className="flex items-center gap-2">
            <Select value={priority} onValueChange={(v) => setPriority(v as MessagePriority)}>
              <SelectTrigger className="w-28 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">عادي</SelectItem>
                <SelectItem value="important">⚠️ مهم</SelectItem>
                <SelectItem value="urgent">🚨 عاجل</SelectItem>
              </SelectContent>
            </Select>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*,.pdf"
              onChange={handleFileSelect}
            />
            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9"
              onClick={() => fileInputRef.current?.click()}
              disabled={!!attachment}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
          </div>

          {/* Message input */}
          <div className="flex gap-2">
            <Textarea
              placeholder="اكتب رسالتك..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={2}
              className="resize-none flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <Button
              onClick={handleSend}
              disabled={sending || uploading || (!content.trim() && !attachment)}
              className="h-auto px-4"
            >
              {sending || uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
