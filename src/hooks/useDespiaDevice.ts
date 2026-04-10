import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isDespia } from '@/lib/despia';

declare global {
  interface Window {
    despia?: {
      uuid?: string;
      onesignalplayerid?: string;
    };
  }
}

/**
 * Registers the Despia device (UUID + OneSignal Player ID) 
 * with the backend after user login.
 */
export function useDespiaDevice(userId: string | undefined) {
  useEffect(() => {
    if (!userId || !isDespia()) return;

    const registerDevice = async () => {
      const uuid = window.despia?.uuid;
      const playerId = window.despia?.onesignalplayerid;

      if (!uuid || !playerId) return;

      try {
        await (supabase as any)
          .from('user_push_devices')
          .upsert(
            {
              user_id: userId,
              device_uuid: uuid,
              onesignal_player_id: playerId,
              platform: navigator.userAgent.includes('despia-iphone') || navigator.userAgent.includes('despia-ipad') 
                ? 'ios' 
                : 'android',
              last_active: new Date().toISOString(),
            },
            { onConflict: 'device_uuid' }
          );
      } catch (error) {
        console.error('Failed to register Despia device:', error);
      }
    };

    registerDevice();
  }, [userId]);
}
