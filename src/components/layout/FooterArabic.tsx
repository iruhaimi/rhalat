import { Link } from 'react-router-dom';
import { Mail, Phone, Clock, Facebook, Twitter, Instagram, BadgeCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFooterSettings } from '@/hooks/useFooterSettings';
import { parseWorkingHours, formatWorkingHours } from '@/lib/workingHours';
import logo from '@/assets/logo.png.asset.json';
import { assetUrl } from '@/lib/assetUrl';
import ComplianceDisclaimer from '@/components/layout/ComplianceDisclaimer';
import { LEGAL } from '@/config/legal';

// TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const getIconComponent = (iconName: string | null, className: string = "h-4 w-4") => {
  switch (iconName) {
    case 'Phone': return <Phone className={className} />;
    case 'Mail': return <Mail className={className} />;
    case 'Clock': return <Clock className={className} />;
    case 'Twitter': return <Twitter className={className} />;
    case 'Instagram': return <Instagram className={className} />;
    case 'Facebook': return <Facebook className={className} />;
    case 'TikTok': return <TikTokIcon className={className} />;
    default: return null;
  }
};

export default function FooterArabic() {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const { data: footerSettings } = useFooterSettings();

  // Group settings by category
  const contactSettings = footerSettings?.filter(s => s.category === 'contact') || [];
  const socialSettings = footerSettings?.filter(s => s.category === 'social') || [];
  const generalSettings = footerSettings?.filter(s => s.category === 'general') || [];
   const quickLinksSettings = footerSettings?.filter(s => s.category === 'quick_links') || [];
   const policiesSettings = footerSettings?.filter(s => s.category === 'policies') || [];

  // Curated browse links (Explore column)
  const exploreFallback: Array<{ id: string; value: string; url: string }> = isRTL ? [
    { id: 'mv-home', value: 'الرئيسية', url: '/' },
    { id: 'mv-destinations', value: 'الوجهات', url: '/destinations' },
    { id: 'mv-pricing', value: 'الأسعار', url: '/pricing' },
    { id: 'mv-tourism', value: 'برامج سياحية', url: '/tourism' },
    { id: 'mv-about', value: 'من نحن', url: '/about' },
  ] : [
    { id: 'mv-home', value: 'Home', url: '/' },
    { id: 'mv-destinations', value: 'Destinations', url: '/destinations' },
    { id: 'mv-pricing', value: 'Pricing', url: '/pricing' },
    { id: 'mv-tourism', value: 'Tourism Programs', url: '/tourism' },
    { id: 'mv-about', value: 'About Us', url: '/about' },
  ];
  // URLs that belong in the "Help" column instead of "Explore"
  const HELP_URLS = new Set(['/faq', '/track', '/track-order', '/track-application', '/support']);
  // URLs to exclude (handled by dedicated columns elsewhere)
  const EXCLUDE_URLS = new Set(['/contact', '/blog']);

  const allLinks = [...quickLinksSettings, ...exploreFallback].filter(
    (l: any) => l.url && !EXCLUDE_URLS.has(l.url)
  );
  // Dedupe by URL (keep first occurrence — DB wins over fallback)
  const seen = new Set<string>();
  const uniqueLinks = allLinks.filter((l: any) => {
    if (seen.has(l.url)) return false;
    seen.add(l.url);
    return true;
  });

  const exploreLinks = uniqueLinks.filter((l: any) => !HELP_URLS.has(l.url));
  const helpLinksFromQuick = uniqueLinks.filter((l: any) => HELP_URLS.has(l.url));
  // Help column = support links + policy links combined
  const helpLinksBase = [...helpLinksFromQuick, ...policiesSettings];
  const hasDeleteAccount = helpLinksBase.some((l: any) => l.url === '/delete-account');
  const helpLinks = hasDeleteAccount
    ? helpLinksBase
    : [...helpLinksBase, { id: 'policy-delete-account', value: isRTL ? 'حذف الحساب' : 'Delete Account', url: '/delete-account' }];

  // Get specific general settings
  const companyName = generalSettings.find(s => s.key === 'company_name')?.value || (isRTL ? 'عطلات رحلاتكم للسياحة والسفر' : "Otolat Rahlatcom Travel & Tourism");
  const description = generalSettings.find(s => s.key === 'description')?.value || t('footer.about');

  return (
    <footer className="border-t border-border bg-card" style={{ paddingBottom: 'var(--safe-area-bottom, 0px)' }}>
      <div className="container-section py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 items-start">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2">
              <img 
                src={assetUrl(logo.url)} 
                alt={companyName}
                className="h-14 w-auto object-contain"
              />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              {description}
            </p>
            {/* Socials moved up here */}
            {socialSettings.length > 0 && (
              <div className="mt-5 flex items-center gap-3">
                {socialSettings.map((item) => {
                  const icon = getIconComponent(item.icon, "h-4 w-4");
                  if (!item.url || !icon) return null;
                  return (
                    <a
                      key={item.id}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={item.label}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-background text-muted-foreground transition-colors hover:bg-primary hover:text-primary-foreground hover:border-primary"
                    >
                      {icon}
                    </a>
                  );
                })}
              </div>
            )}
          </div>

          {/* Explore */}
          <div>
            <h3 className="font-semibold text-foreground">{isRTL ? 'استكشف' : 'Explore'}</h3>
            <ul className="mt-4 space-y-3">
              {exploreLinks.map((link: any) => (
                <li key={link.id}>
                  <Link
                    to={link.url || '/'}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.value}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Help & Policies */}
          <div>
            <h3 className="font-semibold text-foreground">{isRTL ? 'مساعدة' : 'Help'}</h3>
            <ul className="mt-4 space-y-3">
              {helpLinks.map((link: any) => (
                <li key={link.id}>
                  <Link
                    to={link.url || '/'}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.value}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact - Dynamic from DB */}
          <div>
            <h3 className="font-semibold text-foreground">{isRTL ? 'تواصل معنا' : 'Contact Us'}</h3>
            <div className="mt-4 space-y-3">
              {contactSettings.map((item) => {
                const icon = getIconComponent(item.icon, "h-4 w-4 flex-shrink-0");

                if (item.key === 'working_hours') {
                  const parsed = parseWorkingHours(item.value);
                  const lines = parsed ? formatWorkingHours(parsed, isRTL ? 'ar' : 'en') : [item.value];
                  return (
                    <div
                      key={item.id}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="mt-0.5">{icon}</span>
                      <div className="space-y-0.5">
                        {lines.map((line, idx) => (
                          <div key={idx}>{line}</div>
                        ))}
                      </div>
                    </div>
                  );
                }

                if (item.url) {
                  return (
                    <a 
                      key={item.id}
                      href={item.url}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {icon}
                      <span dir={item.key === 'phone' ? 'ltr' : (isRTL ? 'rtl' : 'ltr')}>{item.value}</span>
                    </a>
                  );
                }
                
                return (
                  <div 
                    key={item.id}
                    className="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    {icon}
                    <span>{item.value}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Official Accreditation Strip — single source of truth for license numbers */}
        <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-5 md:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 flex-shrink-0">
                <BadgeCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-primary">{isRTL ? 'مرخصون رسمياً' : 'Officially Licensed'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{isRTL ? 'المملكة العربية السعودية' : 'Kingdom of Saudi Arabia'}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-2 flex-1 lg:max-w-3xl">
              <div className="rounded-xl bg-background border border-border px-3 py-2.5 text-center">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{isRTL ? 'فئة الترخيص' : 'License Category'}</div>
                <div className="text-xs font-bold text-foreground mt-1">{isRTL ? 'وكالة سفر وسياحة' : 'Travel & Tourism Agency'}</div>
              </div>
              <div className="rounded-xl bg-background border border-border px-3 py-2.5 text-center">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{isRTL ? 'وزارة السياحة' : 'Ministry of Tourism'}</div>
                <div dir="ltr" className="text-xs font-bold text-foreground mt-1 tabular-nums">{LEGAL.tourismLicense}</div>
              </div>
              <div className="rounded-xl bg-background border border-border px-3 py-2.5 text-center">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{isRTL ? 'السجل التجاري' : 'Commercial Registration'}</div>
                <div dir="ltr" className="text-xs font-bold text-foreground mt-1 tabular-nums">{LEGAL.commercialRegistration}</div>
              </div>
              <div className="rounded-xl bg-background border border-border px-3 py-2.5 text-center">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">{isRTL ? 'الرقم الضريبي (VAT)' : 'VAT Number'}</div>
                <div dir="ltr" className="text-xs font-bold text-foreground mt-1 tabular-nums">{LEGAL.vatNumber}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Google Ads compliance disclaimer — required, do not remove */}
        <ComplianceDisclaimer variant="footer" />

        {/* Final bar: copyright + non-government notice */}
        <div className="mt-8 border-t border-border pt-6 flex flex-col items-center gap-2 text-center">
          <p className="text-xs text-muted-foreground">
            {isRTL
              ? 'هذا الموقع يقدم خدمات المساعدة في تجهيز طلبات التأشيرات فقط، ولا يصدر التأشيرات ولا يمثل أي سفارة أو جهة حكومية رسمية.'
              : 'This website only provides visa application preparation assistance services; it does not issue visas and does not represent any embassy or official government entity.'}
          </p>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {companyName}. {t('footer.rights')}.
          </p>
        </div>
      </div>
    </footer>
  );
}
