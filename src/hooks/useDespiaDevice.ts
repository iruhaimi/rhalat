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

    let cancelled = false;
    let attempts = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const registerDevice = async (): Promise<boolean> => {
      const uuid = window.despia?.uuid;
      const playerId = window.despia?.onesignalplayerid;

      // The native bridge injects these asynchronously after the webview boots,
      // so they are frequently missing on first render.
      if (!uuid || !playerId) return false;

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
        return true;
      } catch (error) {
        console.error('Failed to register Despia device:', error);
        return false;
      }
    };

    // Retry for ~30s (every 2s) until the bridge exposes the push identifiers.
    const attempt = async () => {
      if (cancelled) return;
      const ok = await registerDevice();
      if (ok || cancelled || attempts >= 15) return;
      attempts += 1;
      timer = setTimeout(attempt, 2000);
    };
    attempt();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [userId]);
}
