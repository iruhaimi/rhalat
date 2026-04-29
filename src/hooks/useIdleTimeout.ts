import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const IDLE_LIMIT_MS = 30 * 60 * 1000; // 30 minutes
const WARNING_BEFORE_MS = 2 * 60 * 1000; // warn 2 min before logout

const ACTIVITY_EVENTS = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

export function useIdleTimeout() {
  const { user, profile, isAdmin, isAgent, signOut, session } = useAuth();
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState(false);
  const timersRef = useRef<{ warn?: number; logout?: number }>({});

  const isStaff = isAdmin || isAgent;

  const performLogout = useCallback(async (reason: string) => {
    setShowWarning(false);
    try { await signOut(true); } catch {}
    toast.warning(reason);
    navigate('/portal-x7k9m2', { replace: true });
  }, [signOut, navigate]);

  const resetTimers = useCallback(() => {
    if (timersRef.current.warn) window.clearTimeout(timersRef.current.warn);
    if (timersRef.current.logout) window.clearTimeout(timersRef.current.logout);
    timersRef.current.warn = window.setTimeout(() => setShowWarning(true), IDLE_LIMIT_MS - WARNING_BEFORE_MS);
    timersRef.current.logout = window.setTimeout(
      () => performLogout('انتهت الجلسة بسبب الخمول. الرجاء تسجيل الدخول مرة أخرى.'),
      IDLE_LIMIT_MS
    );
  }, [performLogout]);

  const handleActivity = useCallback(() => {
    if (showWarning) setShowWarning(false);
    resetTimers();
  }, [resetTimers, showWarning]);

  useEffect(() => {
    if (!isStaff || !user) return;
    resetTimers();
    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, handleActivity, { passive: true }));
    return () => {
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, handleActivity));
      if (timersRef.current.warn) window.clearTimeout(timersRef.current.warn);
      if (timersRef.current.logout) window.clearTimeout(timersRef.current.logout);
    };
  }, [isStaff, user, handleActivity, resetTimers]);

  // Server-side forced-logout (after portal rotation)
  useEffect(() => {
    if (!isStaff || !session || !profile) return;
    const checkForceLogout = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('force_logout_after')
        .eq('id', profile.id)
        .maybeSingle();
      if (data?.force_logout_after) {
        const forceTs = new Date(data.force_logout_after).getTime();
        const lastSignIn = session.user.last_sign_in_at
          ? new Date(session.user.last_sign_in_at).getTime()
          : new Date(session.user.created_at).getTime();
        if (forceTs > lastSignIn) {
          performLogout('تم تدوير مسار البوابة. الرجاء تسجيل الدخول من الرابط الجديد.');
        }
      }
    };
    checkForceLogout();
    const interval = window.setInterval(checkForceLogout, 60_000);
    return () => window.clearInterval(interval);
  }, [isStaff, session, profile, performLogout]);

  const extendSession = useCallback(() => handleActivity(), [handleActivity]);

  return { showWarning, extendSession, performLogout };
}
