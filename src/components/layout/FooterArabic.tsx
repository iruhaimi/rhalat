import { Link } from 'react-router-dom';
import { Mail, Phone, Clock, Facebook, Twitter, Instagram, BadgeCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFooterSettings } from '@/hooks/useFooterSettings';
import { parseWorkingHours, formatWorkingHours } from '@/lib/workingHours';
import logo from '@/assets/logo.png.asset.json';

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
  const { t } = useLanguage();
  const { data: footerSettings } = useFooterSettings();

  // Group settings by category
  const contactSettings = footerSettings?.filter(s => s.category === 'contact') || [];
  const socialSettings = footerSettings?.filter(s => s.category === 'social') || [];
  const generalSettings = footerSettings?.filter(s => s.category === 'general') || [];
   const quickLinksSettings = footerSettings?.filter(s => s.category === 'quick_links') || [];
   const policiesSettings = footerSettings?.filter(s => s.category === 'policies') || [];

  // Essential links moved from the header to keep the top nav clean.
  // Merged with DB-driven quick links, deduplicated by URL.
  const movedFromHeader: Array<{ id: string; value: string; url: string }> = [
    { id: 'mv-tourism', value: 'برامج سياحية', url: '/tourism' },
    { id: 'mv-blog', value: 'المدونة', url: '/blog' },
    { id: 'mv-faq', value: 'الأسئلة الشائعة', url: '/faq' },
    { id: 'mv-about', value: 'من نحن', url: '/about' },
    { id: 'mv-contact', value: 'تواصل معنا', url: '/contact' },
  ];
  const existingUrls = new Set(quickLinksSettings.map((l: any) => l.url));
  const mergedQuickLinks = [
    ...quickLinksSettings,
    ...movedFromHeader.filter((l) => !existingUrls.has(l.url)),
  ];

  // Get specific general settings
  const companyName = generalSettings.find(s => s.key === 'company_name')?.value || 'عطلات رحلاتكم للسياحة والسفر';
  const description = generalSettings.find(s => s.key === 'description')?.value || t('footer.about');
  const legalNotice = generalSettings.find(s => s.key === 'legal_notice')?.value;

  return (
    <footer className="border-t border-border bg-card" style={{ paddingBottom: 'var(--safe-area-bottom, 0px)' }}>
      <div className="container-section py-12 md:py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2">
              <img 
                src={logo.url} 
                alt={companyName}
                className="h-14 w-auto object-contain"
              />
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              {description}
            </p>
            <div className="mt-4 rounded-xl border-2 border-primary/30 bg-primary/10 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <BadgeCheck className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm font-bold text-primary">مرخصون من وزارة السياحة والتجارة</span>
              </div>
              <div className="space-y-1.5 text-sm text-foreground">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">فئة الترخيص</span>
                  <span className="font-bold text-slate-900">وكالة سفر وسياحة</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">ترخيص وزارة السياحة</span>
                  <span className="font-bold tabular-nums text-slate-900" dir="ltr">73100234</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">ترخيص وزارة التجارة</span>
                  <span className="font-bold tabular-nums text-slate-900" dir="ltr">7010581259</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-foreground">{t('footer.quickLinks')}</h3>
            <ul className="mt-4 space-y-3">
               {mergedQuickLinks.map((link: any) => (
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

          {/* Policies */}
          <div>
            <h3 className="font-semibold text-foreground">{t('footer.policies')}</h3>
            <ul className="mt-4 space-y-3">
               {policiesSettings.map((link) => (
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
            <h3 className="font-semibold text-foreground">تواصل معنا</h3>
            <div className="mt-4 space-y-3">
              {contactSettings.map((item) => {
                const icon = getIconComponent(item.icon, "h-4 w-4 flex-shrink-0");

                if (item.key === 'working_hours') {
                  const parsed = parseWorkingHours(item.value);
                  const lines = parsed ? formatWorkingHours(parsed, 'ar') : [item.value];
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
                      <span dir={item.key === 'phone' ? 'ltr' : 'rtl'}>{item.value}</span>
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

        {/* Bottom */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-8 md:flex-row">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {companyName}. {t('footer.rights')}.
          </p>
          <div className="flex items-center gap-4">
            {socialSettings.map((item) => {
              const icon = getIconComponent(item.icon, "h-5 w-5");
              if (!item.url || !icon) return null;
              
              return (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground transition-colors hover:text-foreground"
                  aria-label={item.label}
                >
                  {icon}
                </a>
              );
            })}
          </div>
        </div>

        {/* Legal Notice */}
        {legalNotice && (
          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              {legalNotice}
            </p>
          </div>
        )}
      </div>
    </footer>
  );
}
