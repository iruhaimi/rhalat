import { Link } from 'react-router-dom';
import { Mail, Phone, Clock, Facebook, Twitter, Instagram, BadgeCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFooterSettings } from '@/hooks/useFooterSettings';
import { parseWorkingHours, formatWorkingHours } from '@/lib/workingHours';
import logo from '@/assets/logo.png.asset.json';
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

        {/* Official Accreditation Strip — single source of truth for license numbers */}
        <div className="mt-12 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-5 md:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 flex-shrink-0">
                <BadgeCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-primary">مرخصون رسمياً من وزارة السياحة والتجارة</p>
                <p className="text-xs text-muted-foreground mt-0.5">المملكة العربية السعودية</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-2 flex-1 lg:max-w-3xl">
              <div className="rounded-xl bg-background border border-border px-3 py-2.5 text-center">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">فئة الترخيص</div>
                <div className="text-xs font-bold text-foreground mt-1">وكالة سفر وسياحة</div>
              </div>
              <div className="rounded-xl bg-background border border-border px-3 py-2.5 text-center">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">وزارة السياحة</div>
                <div dir="ltr" className="text-xs font-bold text-foreground mt-1 tabular-nums">{LEGAL.tourismLicense}</div>
              </div>
              <div className="rounded-xl bg-background border border-border px-3 py-2.5 text-center">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">السجل التجاري</div>
                <div dir="ltr" className="text-xs font-bold text-foreground mt-1 tabular-nums">{LEGAL.commercialRegistration}</div>
              </div>
              <div className="rounded-xl bg-background border border-border px-3 py-2.5 text-center">
                <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">الرقم الضريبي (VAT)</div>
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
            هذا الموقع يقدم خدمات المساعدة في إصدار التأشيرات ولا يمثل أي سفارة أو جهة حكومية رسمية.
          </p>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} {companyName}. {t('footer.rights')}.
          </p>
        </div>
      </div>
    </footer>
  );
}
