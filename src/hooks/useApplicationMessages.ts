import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ApplicationMessage, SendMessageData, SenderType, AttachmentType } from '@/types/messages';

export function useApplicationMessages(applicationId: string) {
  const { profile, isAgent, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ApplicationMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Determine sender type based on user role.
  // Admins/Owners send as 'admin'; agents as 'agent'; everyone else as 'customer'.
  const senderType: SenderType = isAdmin
    ? ('admin' as SenderType)
    : isAgent
      ? 'agent'
      : 'customer';

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    if (!applicationId) return;

    try {
      const { data, error } = await supabase
        .from('application_messages')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Type cast with safe fallback
      const typedMessages = (data || []).map((msg: any) => ({
        ...msg,
        priority: msg.priority as 'normal' | 'important' | 'urgent',
        sender_type: msg.sender_type as SenderType,
        attachment_type: msg.attachment_type as AttachmentType | null,
      })) as ApplicationMessage[];

      setMessages(typedMessages);
      
      // Calculate unread count for current user
      const unread = typedMessages.filter(
        m => !m.is_read && m.sender_id !== profile?.id
      ).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [applicationId, profile?.id]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!applicationId) return;

    const channel = supabase
      .channel(`messages-${applicationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'application_messages',
          filter: `application_id=eq.${applicationId}`,
        },
        (payload) => {
          const newMessage = payload.new as any;
          const typedMessage: ApplicationMessage = {
            ...newMessage,
            priority: newMessage.priority as 'normal' | 'important' | 'urgent',
            sender_type: newMessage.sender_type as SenderType,
            attachment_type: newMessage.attachment_type as AttachmentType | null,
          };
          
          setMessages(prev => [...prev, typedMessage]);
          
          // Update unread count if message is from other party
          if (typedMessage.sender_id !== profile?.id) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'application_messages',
          filter: `application_id=eq.${applicationId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setMessages(prev =>
            prev.map(m => m.id === updated.id ? {
              ...updated,
              priority: updated.priority as 'normal' | 'important' | 'urgent',
              sender_type: updated.sender_type as SenderType,
              attachment_type: updated.attachment_type as AttachmentType | null,
            } : m)
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [applicationId, profile?.id]);

  // Send message
  const sendMessage = async (data: Omit<SendMessageData, 'application_id'>) => {
    if (!profile?.id || !applicationId) return false;

    setSending(true);
    try {
      const { error } = await supabase
        .from('application_messages')
        .insert({
          application_id: applicationId,
          sender_id: profile.id,
          sender_type: senderType,
          sender_name: profile.full_name,
          content: data.content,
          priority: data.priority || 'normal',
          attachment_path: data.attachment_path || null,
          attachment_name: data.attachment_name || null,
          attachment_type: data.attachment_type || null,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error sending message:', error);
      return false;
    } finally {
      setSending(false);
    }
  };

  // Mark messages as read
  const markAsRead = async () => {
    if (!profile?.id || !applicationId) return;

    const unreadIds = messages
      .filter(m => !m.is_read && m.sender_id !== profile.id)
      .map(m => m.id);

    if (unreadIds.length === 0) return;

    try {
      await supabase
        .from('application_messages')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .in('id', unreadIds);

      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  return {
    messages,
    loading,
    sending,
    unreadCount,
    sendMessage,
    markAsRead,
    refetch: fetchMessages,
    senderType,
    isReadOnly: false, // RLS enforces who can actually send
  };
}
