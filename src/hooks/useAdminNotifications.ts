import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { uniqueChannelName } from '@/lib/realtimeChannel';

// Sound notification utility
const playNotificationSound = () => {
  try {
    // Create a simple notification sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Pleasant notification tone
    oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5 note
    oscillator.frequency.setValueAtTime(1320, audioContext.currentTime + 0.1); // E6 note
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    console.log('Audio notification not supported');
  }
};

// Visual notification - flash the tab/title
const flashTabTitle = (message: string) => {
  const originalTitle = document.title;
  let isOriginal = true;
  
  const interval = setInterval(() => {
    document.title = isOriginal ? `🔔 ${message}` : originalTitle;
    isOriginal = !isOriginal;
  }, 1000);

  // Stop flashing after 5 seconds or when tab is focused
  const stopFlashing = () => {
    clearInterval(interval);
    document.title = originalTitle;
  };

  setTimeout(stopFlashing, 5000);
  window.addEventListener('focus', stopFlashing, { once: true });
};

export function useAdminNotifications(onNewTransfer?: () => void, onNewWork?: () => void) {
  const { profile, isAdmin } = useAuth();
  const hasSetupRef = useRef(false);

  useEffect(() => {
    if (!profile?.id || !isAdmin || hasSetupRef.current) return;
    
    hasSetupRef.current = true;

    // Subscribe to new transfer requests
    const transferChannel = supabase
      .channel(uniqueChannelName('admin-transfer-notifications'))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_transfer_requests',
        },
        (payload) => {
          const newTransfer = payload.new as any;
          
          if (newTransfer.status === 'pending') {
            playNotificationSound();
            flashTabTitle('طلب تحويل جديد');
            
            toast.info('طلب تحويل جديد', {
              description: 'تم استلام طلب تحويل جديد يتطلب مراجعتك',
              duration: 8000,
              action: {
                label: 'عرض',
                onClick: () => {
                  // Scroll to transfers section or trigger refresh
                  onNewTransfer?.();
                },
              },
            });
          }
        }
      )
      .subscribe();

    // Subscribe to new work submissions
    const workChannel = supabase
      .channel(uniqueChannelName('admin-work-notifications'))
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'agent_work_submissions',
        },
        (payload) => {
          const newWork = payload.new as any;
          
          if (newWork.status === 'pending') {
            playNotificationSound();
            flashTabTitle('ملف إتمام جديد');
            
            toast.info('ملف إتمام عمل جديد', {
              description: 'تم رفع ملف إتمام عمل جديد يتطلب مراجعتك',
              duration: 8000,
              action: {
                label: 'عرض',
                onClick: () => {
                  onNewWork?.();
                },
              },
            });
          }
        }
      )
      .subscribe();

    return () => {
      hasSetupRef.current = false;
      supabase.removeChannel(transferChannel);
      supabase.removeChannel(workChannel);
    };
  }, [profile?.id, isAdmin, onNewTransfer, onNewWork]);
}
