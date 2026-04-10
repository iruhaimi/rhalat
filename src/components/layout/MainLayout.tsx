import { Outlet } from 'react-router-dom';
import HeaderArabic from './HeaderArabic';
import FooterArabic from './FooterArabic';
import FloatingWhatsApp from './FloatingWhatsApp';
import CookieConsent from './CookieConsent';

export default function MainLayout() {
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
