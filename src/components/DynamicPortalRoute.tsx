import { useEffect, useState } from 'react';
import { useLocation, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import SecureStaffAuth from '@/pages/SecureStaffAuth';

/**
 * Catches any path and checks against the current secret_path in DB.
 * If matches → render SecureStaffAuth.
 * If not    → render NotFound.
 */
export default function DynamicPortalRoute({ fallback }: { fallback: JSX.Element }) {
  const location = useLocation();
  const [status, setStatus] = useState<'loading' | 'match' | 'no-match'>('loading');

  useEffect(() => {
    let active = true;
    const path = location.pathname.replace(/^\/+/, '').replace(/\/+$/, '');
    if (!path) { setStatus('no-match'); return; }
    supabase
      .rpc('check_staff_portal_path', { p_candidate: path })
      .then(({ data }) => {
        if (!active) return;
        setStatus(data === true ? 'match' : 'no-match');
      });
    return () => { active = false; };
  }, [location.pathname]);

  if (status === 'loading') return null;
  if (status === 'match') return <SecureStaffAuth />;
  return fallback;
}
