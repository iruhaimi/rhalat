import { Outlet } from 'react-router-dom';
import HeaderArabic from './HeaderArabic';
import FooterArabic from './FooterArabic';
import FloatingWhatsApp from './FloatingWhatsApp';
import CookieConsent from './CookieConsent';
import { useAuth } from '@/contexts/AuthContext';
import { useDespiaDevice } from '@/hooks/useDespiaDevice';

export default function MainLayout() {
  const { user } = useAuth();
  useDespiaDevice(user?.id);

  return (
    <div className="flex min-h-screen flex-col" style={{ paddingLeft: 'var(--safe-area-left, 0px)', paddingRight: 'var(--safe-area-right, 0px)' }}>
      <HeaderArabic />
      <main className="flex-1">
        <Outlet />
      </main>
      <FooterArabic />
      <FloatingWhatsApp />
      <CookieConsent />
    </div>
  );
}
