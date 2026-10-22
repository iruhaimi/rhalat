import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarCheck, FileText, Plane, ShieldCheck, MessageCircle, ArrowLeft, Mail, MapPin, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SEO from '@/components/seo/SEO';
import CookieConsent from '@/components/layout/CookieConsent';
import { useFooterSettings } from '@/hooks/useFooterSettings';
import { parseWorkingHours, formatWorkingHours } from '@/lib/workingHours';
import { openExternalUrl } from '@/lib/despia';
import { trackConversion } from '@/lib/gtagEvents';
import { campaignWhatsAppUrl } from '@/config/adsCampaign';
import { LEGAL } from '@/config/legal';
import heroImage from '@/assets/ads/campaign-paris.jpg';
import logo from '@/assets/logo.png.asset.json';
import { assetUrl } from '@/lib/assetUrl';

const services = [
  { icon: CalendarCheck, title: 'حجز المواعيد الرسمية', description: 'حجز وتنسيق المواعيد عبر الأنظمة المعتمدة، حسب توفرها وشروط الجهة المختصة.' },
  { icon: FileText, title: 'تعبئة نموذج DS-160', description: 'تعبئة استمارة التقديم للسفارة الأمريكية ومراجعتها بدقة وفق بياناتك.' },
  { icon: Plane, title: 'حجوزات الطيران والفنادق', description: 'توفير حجوزات مبدئية مناسبة لملف التأشيرة وفق متطلبات وجهتك.' },
  { icon: ShieldCheck, title: 'وثيقة التأمين الطبي', description: 'تجهيز تأمين طبي يستوفي الحد الأدنى لاشتراطات الشنغن بحسب التغطية المطلوبة.' },
];
const steps = [
  { title: 'التواصل وتحديد الدولة المطلوبة', description: 'نراجع وجهتك وموعد السفر ونحدد الخدمات المطلوبة.' },
  { title: 'تدقيق المتطلبات وتجهيز الملف', description: 'نراجع المستندات ونجهّز النماذج والحجوزات المناسبة.' },
  { title: 'استلام الملف جاهزاً للموعد', description: 'تستلم ملفك مطبوعاً لتقديمه شخصياً في الموعد حسب متطلبات الجهة المختصة.' },
];

function WhatsAppCTA({ placement, children, className = '' }: { placement: string; children: React.ReactNode; className?: string }) {
  return (
    <Button asChild variant="whatsapp" size="lg" className={`track-whatsapp-conversion h-auto min-h-14 whitespace-normal px-5 py-3 text-base leading-relaxed ${className}`}>
      <a id={placement === 'hero' ? 'google-ads-whatsapp-btn' : `google-ads-whatsapp-btn-${placement}`} data-campaign="google_ads_visa" href={campaignWhatsAppUrl()} target="_blank" rel="noopener noreferrer"
        onClick={(event) => {
          event.preventDefault();
          trackConversion('generate_lead', { source: 'google_ads_visa', channel: 'whatsapp', placement });
          openExternalUrl(campaignWhatsAppUrl());
        }}>
        <MessageCircle aria-hidden="true" />{children}<ArrowLeft aria-hidden="true" />
      </a>
    </Button>
  );
}

export default function LandingVisa() {
  const reduceMotion = useReducedMotion();
  const { data: settings = [] } = useFooterSettings();
  const contacts = settings.filter(item => item.category === 'contact');
  const email = contacts.find(item => item.key === 'email')?.value || LEGAL.supportEmail;
  const address = contacts.find(item => item.key === 'address')?.value || 'الرياض - حي الربيع - شارع أبي بن معاذ الأنصاري';
  const hours = contacts.find(item => item.key === 'working_hours')?.value || 'يومياً: ١٠ صباحاً - ١٠ مساءً';
  const schedule = parseWorkingHours(hours);
  const hoursLines = schedule ? formatWorkingHours(schedule, 'ar') : [hours];

  return (
    <div dir="rtl" lang="ar" className="ads-campaign min-h-screen bg-background text-foreground">
      <SEO title="تجهيز ملفات وحجز مواعيد تأشيرات شنغن وأمريكا | عطلات رحلاتكم" description="خدمات خاصة لتجهيز ملفات المواعيد والمستندات ونموذج DS-160 والحجوزات والتأمين الطبي. لسنا جهة حكومية ولا نضمن منح التأشيرة." path="/ads-visa" />
      <div className="sticky top-0 z-30 border-b border-border bg-navy text-navy-foreground">
        <div className="container-section flex items-start gap-2 py-3">
          <Info className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />
          <p className="text-xs leading-relaxed md:text-sm"><strong>إخلاء مسؤولية قانوني:</strong> منصة عطلات رحلاتكم مكتب خدمات خاصة لمساندة تجهيز ملفات المواعيد والمستندات. لسنا سفارة أو قنصلية أو جهة حكومية تابعة لأي دولة ولا نتبع لمراكز التأشيرات (VFS/TLS/BLS)، وقرار منح التأشيرة سيادي بيد السفارات حصراً.</p>
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
        <section className="relative isolate overflow-hidden border-b border-border">
          <img src={heroImage} alt="برج إيفل وأفق باريس" width={1600} height={912} fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover object-left" />
          <div className="ads-hero-scrim absolute inset-0 -z-10" />
          <div className="container-section py-10 md:py-14">
            <motion.div initial={reduceMotion ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="max-w-2xl">
              <p className="mb-4 text-sm font-semibold text-primary">شنغن · الولايات المتحدة الأمريكية</p>
              <h1 className="font-cairo text-3xl font-bold leading-[1.65] text-primary md:text-4xl">تجهيز ملفات وحجز مواعيد تأشيرات شنغن وأمريكا</h1>
              <p className="mt-4 max-w-xl text-base leading-8 text-foreground md:text-lg">خدمة متخصصة لاستكمال استمارات التقديم، حجوزات الطيران والفنادق، والتأمين الطبي لتقديم ملف متكامل وفق متطلبات وجهتك.</p>
              <WhatsAppCTA placement="hero" className="mt-6 w-full sm:w-auto">ابدأ تجهيز ملفك عبر واتساب</WhatsAppCTA>
              <p className="mt-4 text-sm leading-7 text-foreground">حجوزات مبدئية أو مؤكدة بحسب الخدمة المتفق عليها ومتطلبات الجهة المختصة.</p>
            </motion.div>
          </div>
        </section>
        <section className="container-section py-10 md:py-14" aria-labelledby="services-title">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div><p className="mb-2 text-sm font-semibold text-primary">ملفك، بكل تفاصيله</p><h2 id="services-title" className="text-2xl font-bold md:text-3xl">خدمات تجهيز طلب التأشيرة</h2></div>
            <p className="text-sm text-muted-foreground">خدمات اختيارية مدفوعة</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {services.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-lg border border-border bg-card p-5">
                <Icon className="mb-5 h-7 w-7 text-primary" aria-hidden="true" />
                <h3 className="text-lg font-bold leading-7">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{description}</p>
              </article>
            ))}
          </div>
        </section>
        <section className="border-y border-border bg-muted/50 py-10 md:py-14" aria-labelledby="steps-title">
          <div className="container-section">
            <h2 id="steps-title" className="text-2xl font-bold md:text-3xl">من أول رسالة إلى ملف جاهز</h2>
            <ol className="mt-8 grid gap-7 md:grid-cols-3">
              {steps.map((step, index) => <li key={step.title} className="flex items-start gap-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-background font-bold text-primary">{index + 1}</span><div><h3 className="font-bold leading-7">{step.title}</h3><p className="mt-2 text-sm leading-7 text-muted-foreground">{step.description}</p></div></li>)}
            </ol>
          </div>
        </section>
        <section className="container-section py-10 md:py-14">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div><h2 className="text-2xl font-bold md:text-3xl">جاهز نجهّز ملفك؟</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">حدد الدولة المطلوبة وتواصل مع فريقنا لمعرفة المتطلبات ورسوم الخدمة.</p></div>
            <WhatsAppCTA placement="closing" className="w-full md:w-auto">تواصل مع فريق تجهيز الملفات</WhatsAppCTA>
          </div>
        </section>
      </main>
      <footer className="border-t border-border bg-card">
        <div className="container-section py-9">
          <div className="grid gap-8 md:grid-cols-2">
            <div><h2 className="text-lg font-bold text-primary">{LEGAL.companyNameAr}</h2><p className="mt-3 text-sm leading-7 text-muted-foreground">رسوم خدمتنا منفصلة عن الرسوم الحكومية. يمكنك التقديم مباشرة عبر الجهات الرسمية دون الاستعانة بنا. لا نصدر التأشيرات ولا نضمن قبولها أو توفر المواعيد.</p><Link to="/official-embassies" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline">روابط السفارات والجهات الرسمية <ArrowLeft className="ms-2 h-4 w-4" /></Link></div>
            <address className="space-y-3 text-sm not-italic text-muted-foreground"><p className="flex items-start gap-2"><MapPin className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" />{address}</p><p className="flex flex-wrap items-center gap-2"><Mail className="h-4 w-4" aria-hidden="true" /><a href={`mailto:${email}`} dir="ltr" className="break-all hover:text-primary">{email}</a></p><div className="flex items-start gap-2"><Clock className="mt-1 h-4 w-4 shrink-0" aria-hidden="true" /><div>{hoursLines.map(line => <p key={line} className="leading-7">{line}</p>)}</div></div><WhatsAppCTA placement="contact" className="w-full sm:w-auto">واتساب الحملة: <bdi>0504539157</bdi></WhatsAppCTA></address>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-5 text-xs leading-6 text-muted-foreground"><span>ترخيص وزارة السياحة: <bdi>{LEGAL.tourismLicense}</bdi></span><span>السجل التجاري: <bdi>{LEGAL.commercialRegistration}</bdi></span><span>الرقم الضريبي: <bdi>{LEGAL.vatNumber}</bdi></span></div>
          <nav aria-label="السياسات القانونية" className="mt-4 flex flex-wrap gap-x-6 text-sm text-primary"><Link to="/privacy" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center hover:underline">سياسة الخصوصية</Link><Link to="/terms" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center hover:underline">الشروط والأحكام</Link><Link to="/refund" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center hover:underline">سياسة الإلغاء والاسترداد</Link></nav>
          <p className="mt-3 text-xs text-muted-foreground">© {new Date().getFullYear()} عطلات رحلاتكم. جميع الحقوق محفوظة.</p>
        </div>
      </footer>
      <div className="ads-mobile-cta fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card px-3 pt-3 md:hidden"><WhatsAppCTA placement="mobile" className="w-full text-sm">تواصل عبر واتساب لتجهيز ملفك</WhatsAppCTA></div>
      <CookieConsent />
    </div>
  );
}
