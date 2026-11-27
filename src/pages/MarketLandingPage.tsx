import { Link } from '@/lib/router-compat';
import { motion, useReducedMotion } from 'framer-motion';
import { CheckCircle2, MessageCircle, ArrowLeft, Mail, MapPin, Clock, Info, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ApplyNowButton from '@/components/layout/ApplyNowButton';
import CallNowButton from '@/components/layout/CallNowButton';
import SEO from '@/components/seo/SEO';
import CookieConsent from '@/components/layout/CookieConsent';
import { useFooterSettings } from '@/hooks/useFooterSettings';
import { parseWorkingHours, formatWorkingHours } from '@/lib/workingHours';
import { openExternalUrl } from '@/lib/despia';
import { trackConversion } from '@/lib/gtagEvents';
import { ADS_CAMPAIGN } from '@/config/adsCampaign';
import { MARKET_LANDINGS, marketWhatsAppUrl, type MarketKey } from '@/config/marketLandings';
import { LEGAL } from '@/config/legal';
import logo from '@/assets/logo.png.asset.json';
import { assetUrl } from '@/lib/assetUrl';
import liberty from '@/assets/ads/landmark-liberty.jpg';
import eiffel from '@/assets/ads/landmark-eiffel.jpg';
import bigben from '@/assets/ads/landmark-bigben.jpg';

const HERO: Partial<Record<MarketKey, { src: string; alt: string }>> = {
  usa: { src: liberty, alt: 'تمثال الحرية في نيويورك' },
  schengen: { src: eiffel, alt: 'برج إيفل في باريس' },
  uk: { src: bigben, alt: 'ساعة بيغ بن في لندن' },
};

export default function MarketLandingPage({ market: key }: { market: MarketKey }) {
  const m = MARKET_LANDINGS[key];
  const reduceMotion = useReducedMotion();
  const { data: settings = [] } = useFooterSettings();
  const contacts = settings.filter(item => item.category === 'contact');
  const email = contacts.find(item => item.key === 'email')?.value || LEGAL.supportEmail;
  const address = contacts.find(item => item.key === 'address')?.value || 'الرياض - حي الربيع - شارع أبي بن معاذ الأنصاري';
  const hours = contacts.find(item => item.key === 'working_hours')?.value || 'يومياً: ١٠ صباحاً - ١٠ مساءً';
  const schedule = parseWorkingHours(hours);
  const hoursLines = schedule ? formatWorkingHours(schedule, 'ar') : [hours];
  const url = marketWhatsAppUrl(m, ADS_CAMPAIGN.whatsappPhone);
  const hero = HERO[key];
  const reveal = (i = 0) => reduceMotion ? {} : { initial: { opacity: 0, y: 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-40px' }, transition: { duration: 0.35, delay: i * 0.06 } };

  const CTA = ({ placement, children, className = '' }: { placement: string; children: React.ReactNode; className?: string }) => (
    <Button asChild variant="whatsapp" size="lg" className={`track-whatsapp-conversion h-auto min-h-14 whitespace-normal px-5 py-3 text-base leading-relaxed ${className}`}>
      <a id={`lp-${key}-whatsapp-${placement}`} data-campaign={`google_ads_${key}`} href={url} target="_blank" rel="noopener noreferrer"
        onClick={(e) => { e.preventDefault(); trackConversion('generate_lead', { source: `google_ads_${key}`, channel: 'whatsapp', placement }, ADS_CAMPAIGN.conversionDestination); openExternalUrl(url); }}>
        <MessageCircle aria-hidden="true" />{children}<ArrowLeft aria-hidden="true" />
      </a>
    </Button>
  );

  const faqSchema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: m.faq.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })) };

  return (
    <div dir="rtl" lang="ar" className="ads-campaign min-h-screen bg-background pb-24 text-foreground md:pb-0">
      <SEO title={m.seoTitle} description={m.seoDescription} path={m.path} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="border-b border-border bg-navy text-navy-foreground">
        <div className="container-section flex items-start gap-2 py-3">
          <Info className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="text-xs leading-relaxed md:text-sm"><strong>تنبيه:</strong> عطلات رحلاتكم وكالة سفر خاصة تقدم خدمات مساعدة مدفوعة. لسنا جهة حكومية ولا نمثل أي سفارة أو قنصلية أو مركز تأشيرات، ولا نضمن صدور التأشيرة أو توفر المواعيد.</p>
        </div>
      </div>
      <header className="border-b border-border bg-card">
        <div className="container-section flex min-h-20 flex-wrap items-center justify-between gap-3 py-3">
          <Link to="/" aria-label="عطلات رحلاتكم — الرئيسية" className="flex items-center gap-3">
            <img src={assetUrl(logo.url)} alt="" className="h-12 w-auto max-w-28 object-contain" />
            <span className="text-lg font-bold text-primary">عطلات رحلاتكم</span>
          </Link>
          <span className="text-xs text-muted-foreground">وكالة سفر وسياحة خاصة</span>
        </div>
      </header>
      <main>
        <section className={`relative isolate overflow-hidden border-b border-border ${hero ? '' : 'bg-muted/60'}`}>
          {hero && <><img src={hero.src} alt={hero.alt} fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover" /><div className="ads-hero-scrim absolute inset-0 -z-10" /></>}
          <div className="container-section py-10 md:py-16">
            <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-2xl">
              <p className="mb-4 text-sm font-semibold text-primary">{m.eyebrow}</p>
              <h1 className="font-cairo text-3xl font-bold leading-[1.6] text-primary md:text-4xl">{m.title}</h1>
              <p className="mt-4 max-w-xl text-base leading-8 text-foreground md:text-lg">{m.intro}</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <CTA placement="hero" className="w-full sm:w-auto">{m.heroCta}</CTA>
                <ApplyNowButton className="w-full sm:w-auto" />
                <CallNowButton className="w-full sm:w-auto" />
              </div>
              <p className="mt-4 text-sm leading-7 text-foreground">{m.heroNote}</p>
            </motion.div>
          </div>
        </section>

        <section className="container-section py-10 md:py-14" aria-labelledby="services-title">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <h2 id="services-title" className="text-2xl font-bold md:text-3xl">{m.servicesTitle}</h2>
            <p className="text-sm text-muted-foreground">خدمات اختيارية مدفوعة</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {m.services.map((s, i) => (
              <motion.article key={s.title} {...reveal(i)} className="rounded-lg border border-border bg-card p-5">
                <span className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{i + 1}</span>
                <h3 className="text-lg font-bold leading-7">{s.title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{s.description}</p>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-muted/50 py-10 md:py-14" aria-labelledby="benefits-title">
          <div className="container-section">
            <h2 id="benefits-title" className="text-2xl font-bold md:text-3xl">{m.benefitsTitle}</h2>
            <div className="mt-7 grid gap-5 md:grid-cols-3">
              {m.benefits.map((b, i) => (
                <motion.div key={b.title} {...reveal(i)} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                  <div><h3 className="font-bold leading-7">{b.title}</h3><p className="mt-1 text-sm leading-7 text-muted-foreground">{b.description}</p></div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="container-section py-10 md:py-14" aria-labelledby="steps-title">
          <h2 id="steps-title" className="text-2xl font-bold md:text-3xl">{m.stepsTitle}</h2>
          <ol className="mt-8 grid gap-7 md:grid-cols-3">
            {m.steps.map((step, i) => (
              <motion.li key={step.title} {...reveal(i)} className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-background font-bold text-primary">{i + 1}</span>
                <div><h3 className="font-bold leading-7">{step.title}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{step.description}</p></div>
              </motion.li>
            ))}
          </ol>
        </section>

        <section className="border-y border-border bg-muted/50 py-10 md:py-14" aria-labelledby="faq-title">
          <div className="container-section max-w-3xl">
            <h2 id="faq-title" className="text-2xl font-bold md:text-3xl">أسئلة شائعة عن {m.label}</h2>
            <div className="mt-6 space-y-3">
              {m.faq.map(f => (
                <details key={f.q} className="group rounded-lg border border-border bg-card p-4">
                  <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 font-bold leading-7">{f.q}<span className="text-primary transition-transform group-open:rotate-45" aria-hidden="true">+</span></summary>
                  <p className="mt-2 text-sm leading-7 text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="container-section py-10 md:py-14">
          <div className="rounded-lg border border-border bg-card p-5 md:p-6">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              <div className="text-sm leading-7 text-muted-foreground">
                <h2 className="text-base font-bold text-foreground">طبيعة خدمتنا بوضوح</h2>
                <p className="mt-1">نحن مزود خدمة تجاري مستقل. خدمتنا ليست إلزامية، ويمكنك التقديم بنفسك مباشرة عبر الجهة الرسمية دون أي وسيط. رسوم خدمتنا منفصلة عن الرسوم الحكومية، ولا نتحكم في المواعيد أو مدد المعالجة أو قرارات القبول.</p>
                <Link to="/official-embassies" className="mt-2 inline-flex min-h-11 items-center font-semibold text-primary hover:underline">روابط السفارات والجهات الرسمية <ArrowLeft className="ms-2 h-4 w-4" /></Link>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div><h2 className="text-2xl font-bold md:text-3xl">{m.closingTitle}</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">{m.closingText}</p></div>
            <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
              <ApplyNowButton className="w-full md:w-auto" />
              <CTA placement="closing" className="w-full md:w-auto">{m.closingCta}</CTA>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-border bg-card">
        <div className="container-section py-9">
          <div className="grid gap-8 md:grid-cols-2">
            <div><h2 className="text-lg font-bold text-primary">{LEGAL.companyNameAr}</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">لا نصدر التأشيرات ولا نضمن قبولها.</p></div>
            <address className="space-y-3 text-sm not-italic text-muted-foreground"><p className="flex items-start gap-2"><MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />{address}</p><p className="flex flex-wrap items-center gap-2"><Mail className="h-4 w-4" aria-hidden="true" /><a href={`mailto:${email}`} dir="ltr" className="break-all hover:text-primary">{email}</a></p><div className="flex items-start gap-2"><Clock className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /><div>{hoursLines.map(line => <p key={line} className="leading-7">{line}</p>)}</div></div></address>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-5 text-xs leading-6 text-muted-foreground"><span>ترخيص وزارة السياحة: <bdi>{LEGAL.tourismLicense}</bdi></span><span>السجل التجاري: <bdi>{LEGAL.commercialRegistration}</bdi></span><span>الرقم الضريبي: <bdi>{LEGAL.vatNumber}</bdi></span></div>
          <nav aria-label="السياسات القانونية" className="mt-4 flex flex-wrap gap-x-6 text-sm text-primary"><Link to="/privacy" className="inline-flex min-h-11 items-center hover:underline">سياسة الخصوصية</Link><Link to="/terms" className="inline-flex min-h-11 items-center hover:underline">الشروط والأحكام</Link><Link to="/refund" className="inline-flex min-h-11 items-center hover:underline">سياسة الإلغاء والاسترداد</Link></nav>
          <p className="mt-3 text-xs text-muted-foreground">© {new Date().getFullYear()} عطلات رحلاتكم. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
      <div className="ads-mobile-cta fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card px-3 pt-3 md:hidden">
        <div className="flex items-stretch gap-2">
          <ApplyNowButton label="قدّم" className="min-h-12 flex-1 px-2 py-2 text-xs" />
          <CallNowButton label="اتصل" className="min-h-12 flex-1 px-2 py-2 text-xs" />
          <CTA placement="mobile" className="min-h-12 flex-1 px-2 py-2 text-xs">استفسار</CTA>
        </div>
      </div>
      <CookieConsent />
    </div>
  );
}
