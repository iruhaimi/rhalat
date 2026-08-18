import { Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import HeaderArabic from './HeaderArabic';
import FooterArabic from './FooterArabic';
import ComplianceDisclaimer from './ComplianceDisclaimer';
import { useAuth } from '@/contexts/AuthContext';
import { useDespiaDevice } from '@/hooks/useDespiaDevice';

const FloatingWhatsApp = lazy(() => import('./FloatingWhatsApp'));
const CookieConsent = lazy(() => import('./CookieConsent'));

export default function MainLayout() {
  const { user } = useAuth();
  useDespiaDevice(user?.id);

  return (
    <div className="flex min-h-screen flex-col" style={{ paddingLeft: 'var(--safe-area-left, 0px)', paddingRight: 'var(--safe-area-right, 0px)' }}>
      <HeaderArabic />
      <ComplianceDisclaimer variant="banner" />
      <main className="flex-1" style={{ paddingBottom: 'calc(4.5rem + var(--safe-area-bottom, 0px))' }}>
        <Outlet />
      </main>
      <FooterArabic />
      <Suspense fallback={null}>
        <FloatingWhatsApp />
        <CookieConsent />
      </Suspense>
    </div>
  );
}
