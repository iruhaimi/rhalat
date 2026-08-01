import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  ArrowRight,
  CheckCircle2, 
  FileText,
  AlertCircle,
  Lightbulb,
  ListChecks,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { VisaCard } from '@/components/visa/VisaCard';
import SchengenDetail from './SchengenDetail';
import SEO from '@/components/seo/SEO';
import { getSharpFlagUrl } from '@/lib/flagUtils';
import type { Country, VisaType } from '@/types/database';

export default function CountryDetail() {
  const { countryCode } = useParams();
  const { t, direction } = useLanguage();
  const [country, setCountry] = useState<Country | null>(null);
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const isSchengen = countryCode?.toUpperCase() === 'SCHENGEN';
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    async function fetchData() {
      if (!countryCode || isSchengen) {
        setIsLoading(false);
        return;
      }

      const { data: countryData, error: countryError } = await supabase
        .from('countries')
        .select('*')
        .eq('code', countryCode.toUpperCase())
        .maybeSingle();

      if (countryError || !countryData) {
        setIsLoading(false);
        return;
      }

      setCountry(countryData as Country);

      const { data: visaData } = await supabase
        .from('visa_types')
        .select('*')
        .eq('country_id', countryData.id)
        .eq('is_active', true)
        .order('price');

      if (visaData) {
        setVisaTypes(visaData as VisaType[]);
      }

      setIsLoading(false);
    }

    fetchData();
  }, [countryCode, isSchengen]);

  // Handle Schengen special case
  if (isSchengen) {
    return <SchengenDetail />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-section py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <Skeleton className="h-48 w-full rounded-lg mb-8" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!country) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-section py-16 text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-destructive mb-4" />
          <h1 className="text-2xl font-bold mb-2">{t('countries.notFound') || 'الدولة غير موجودة'}</h1>
          <p className="text-muted-foreground mb-6">
            {t('countries.notFoundDesc') || 'الدولة التي تبحث عنها غير متوفرة حالياً'}
          </p>
          <Button asChild>
            <Link to="/destinations">{t('countries.viewAll')}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const generalRequirements = direction === 'rtl' ? [
    'جواز سفر ساري المفعول (6 أشهر على الأقل)',
    'صور شخصية بخلفية بيضاء',
    'كشف حساب بنكي آخر 3 أشهر',
    'حجز فندقي مؤكد',
    'حجز طيران ذهاب وعودة',
    'تأمين سفر ساري',
  ] : [
    'Valid passport (6+ months validity)',
    'Passport photos with white background',
    'Bank statement for last 3 months',
    'Confirmed hotel booking',
    'Round-trip flight booking',
    'Valid travel insurance',
  ];

  const minPrice = visaTypes.length ? Math.min(...visaTypes.map(v => v.price)) : null;
  const minDays = visaTypes.length ? Math.min(...visaTypes.map(v => v.processing_days)) : null;
  const countryTitle = country.seo_title || `تأشيرة ${country.name} — الشروط والأسعار | عطلات رحلاتكم`;
  const countryDesc = country.seo_description || `استخرج تأشيرة ${country.name} بسهولة من السعودية: ${visaTypes.length} نوع تأشيرة${minPrice ? `، تبدأ من ${minPrice} ر.س` : ''}${minDays ? `، معالجة خلال ${minDays} أيام` : ''}. متطلبات واضحة ودعم متواصل.`;
  const faqsArr: Array<{ question: string; answer: string }> = Array.isArray(country.faqs) ? country.faqs : [];
  const stepsArr: Array<{ title: string; description?: string }> = Array.isArray(country.processing_steps) ? country.processing_steps : [];
  const tipsArr: Array<any> = Array.isArray(country.tips) ? country.tips : [];
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `خدمات تأشيرة ${country.name}`,
    serviceType: "Visa Application Service",
    areaServed: { "@type": "Country", name: country.name },
    provider: { "@type": "Organization", name: "عطلات رحلاتكم", url: "https://visafaster.com/" },
    ...(minPrice && {
      offers: {
        "@type": "AggregateOffer",
        priceCurrency: "SAR",
        lowPrice: String(minPrice),
        offerCount: String(visaTypes.length),
      },
    }),
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: "https://visafaster.com/" },
      { "@type": "ListItem", position: 2, name: "الوجهات", item: "https://visafaster.com/destinations" },
      { "@type": "ListItem", position: 3, name: country.name, item: `https://visafaster.com/country/${country.code}` },
    ],
  };
  const dynamicFaqs = faqsArr.length > 0 ? faqsArr : [
    { question: `كم تستغرق تأشيرة ${country.name}؟`, answer: minDays ? `مدة المعالجة تبدأ من ${minDays} أيام عمل حسب نوع التأشيرة وحالة الطلب.` : "تختلف مدة المعالجة حسب نوع التأشيرة." },
    { question: `كم سعر تأشيرة ${country.name}؟`, answer: minPrice ? `الأسعار تبدأ من ${minPrice} ر.س حسب نوع التأشيرة المختار.` : "تختلف الأسعار حسب نوع التأشيرة." },
    { question: `ما المستندات المطلوبة لتأشيرة ${country.name}؟`, answer: generalRequirements.join('، ') + '.' },
  ];
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: dynamicFaqs.map(f => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  // Group visa types by entry type for tab navigation
  const isRTL = direction === 'rtl';
  const entryTypeLabel = (key: string) => {
    if (key === 'single') return isRTL ? 'دخول واحد' : 'Single Entry';
    if (key === 'multiple') return isRTL ? 'دخول متعدد' : 'Multiple Entry';
    if (key === 'transit') return isRTL ? 'عبور / ترانزيت' : 'Transit';
    return key;
  };
  const entryTypes = Array.from(
    new Set(visaTypes.map(v => v.entry_type).filter(Boolean) as string[])
  );
  const showTabs = entryTypes.length > 1;
  const filteredVisas = activeTab === 'all' ? visaTypes : visaTypes.filter(v => v.entry_type === activeTab);

  const defaultSteps = [
    { title: isRTL ? 'تعبئة البيانات' : 'Fill the form', description: isRTL ? 'أدخل بياناتك الأساسية وارفع المستندات المطلوبة عبر نموذجنا الآمن.' : 'Submit your details and upload required documents via our secure form.' },
    { title: isRTL ? 'المراجعة والتدقيق' : 'Review & Audit', description: isRTL ? 'يقوم خبراؤنا بمراجعة طلبك لضمان خلوه من الأخطاء وزيادة فرص القبول.' : 'Our experts audit your application to maximize approval chances.' },
    { title: isRTL ? 'حجز الموعد' : 'Book Appointment', description: isRTL ? 'نقوم بجدولة الموعد الأنسب لك في السفارة أو المركز المعتمد.' : 'We schedule the best appointment for you at the embassy or VFS center.' },
    { title: isRTL ? 'استلام التأشيرة' : 'Receive Visa', description: isRTL ? 'استلم جواز سفرك مع التأشيرة المختومة من مكتبنا أو عبر البريد.' : 'Receive your passport with the stamped visa from our office or by courier.' },
  ];
  const stepsToShow = stepsArr.length > 0 ? stepsArr : defaultSteps;

  return (
    <div className="min-h-screen bg-canvas pb-20" dir={direction}>
      <SEO
        title={countryTitle}
        description={countryDesc}
        path={`/country/${country.code}`}
        jsonLd={[serviceLd, breadcrumbLd, faqLd]}
      />
      {/* Hero — editorial split */}
      <section className="relative bg-navy text-white overflow-hidden pt-24 pb-20">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 end-0 w-1/2 h-full bg-brand skew-x-12 transform translate-x-24" />
        </div>
        <div className="absolute -top-32 -end-32 w-80 h-80 bg-white/5 rounded-full blur-3xl pointer-events-none" />
        <div className="container-section relative z-10">
          <Link
            to="/destinations"
            className="inline-flex items-center gap-2 text-white/75 hover:text-white mb-8 font-jakarta text-sm font-bold transition-colors"
          >
            <ArrowIcon className="h-4 w-4 rotate-180 rtl:rotate-0" />
            {isRTL ? 'عودة للدول' : 'Back to Countries'}
          </Link>

          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 text-center lg:text-start">
              <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full mb-6 border border-white/20">
                <Sparkles className="h-3 w-3 text-brand" />
                <span className="font-jakarta text-[10px] font-bold tracking-wider uppercase opacity-80">
                  {isRTL ? 'وجهات مميزة' : 'Featured destination'}
                </span>
                <div className="w-1 h-1 bg-brand rounded-full" />
                <span className="text-xs font-body-ar">{country.code}</span>
              </div>
              <h1 className="font-heading-ar text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-[1.05]">
                {isRTL ? `تأشيرة ${country.name}` : `${country.name} Visas`}
              </h1>
              <p className="font-body-ar text-lg md:text-xl text-white/70 max-w-2xl mb-8 leading-relaxed">
                {isRTL
                  ? `استكشف خيارات تأشيرة ${country.name} مع إجراءات مبسطة ودعم كامل على مدار الساعة. نوفر لك أنواعًا متعددة من التأشيرات تناسب احتياجاتك.`
                  : `Explore ${country.name} visa options with simplified procedures and 24/7 support. Multiple visa types tailored to your needs.`}
              </p>
              <div className="flex flex-wrap gap-8 justify-center lg:justify-start border-t border-white/10 pt-8">
                {minDays && (
                  <div className="text-start">
                    <span className="block font-display text-3xl font-extrabold">{minDays}</span>
                    <span className="font-body-ar text-sm text-white/50">
                      {isRTL ? 'أيام عمل للمعالجة' : 'business days'}
                    </span>
                  </div>
                )}
                {minDays && minPrice && <div className="w-px h-12 bg-white/10" />}
                {minPrice && (
                  <div className="text-start">
                    <span className="block font-display text-3xl font-extrabold">
                      {minPrice} <span className="text-base font-bold text-white/60">{isRTL ? 'ر.س' : 'SAR'}</span>
                    </span>
                    <span className="font-body-ar text-sm text-white/50">
                      {isRTL ? 'السعر يبدأ من' : 'starting price'}
                    </span>
                  </div>
                )}
                {(minDays || minPrice) && visaTypes.length > 0 && <div className="w-px h-12 bg-white/10" />}
                {visaTypes.length > 0 && (
                  <div className="text-start">
                    <span className="block font-display text-3xl font-extrabold">{visaTypes.length}</span>
                    <span className="font-body-ar text-sm text-white/50">
                      {isRTL ? 'نوع تأشيرة متاح' : 'visa types'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Flag tile */}
            <div className="relative w-64 h-64 md:w-80 md:h-80 flex-shrink-0">
              <div className="absolute inset-0 bg-brand rounded-3xl rotate-6" />
              <div className="absolute inset-0 bg-white p-4 shadow-2xl rounded-3xl -rotate-2 overflow-hidden">
                <img
                  src={getSharpFlagUrl(country)}
                  alt={country.name}
                  className="w-full h-full object-cover rounded-xl shadow-inner image-render-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visa Navigator: Tabs + Cards */}
      <div className="container-section -mt-10 relative z-20">
        {showTabs && (
          <div className="bg-card shadow-xl rounded-2xl p-2 mb-10 sticky top-4 border border-border overflow-x-auto z-30">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-transparent h-auto p-0 flex gap-2 w-full">
                <TabsTrigger
                  value="all"
                  className={cn(
                    'flex-1 py-3 px-4 rounded-xl font-jakarta font-bold text-sm whitespace-nowrap',
                    'data-[state=active]:bg-navy data-[state=active]:text-white data-[state=active]:shadow-lg',
                    'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-cream/60'
                  )}
                >
                  {isRTL ? `الكل (${visaTypes.length})` : `All (${visaTypes.length})`}
                </TabsTrigger>
                {entryTypes.map((et) => (
                  <TabsTrigger
                    key={et}
                    value={et}
                    className={cn(
                      'flex-1 py-3 px-4 rounded-xl font-jakarta font-bold text-sm whitespace-nowrap',
                      'data-[state=active]:bg-navy data-[state=active]:text-white data-[state=active]:shadow-lg',
                      'data-[state=inactive]:text-muted-foreground data-[state=inactive]:hover:bg-cream/60'
                    )}
                  >
                    {entryTypeLabel(et)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {filteredVisas.length === 0 ? (
          <Card className="rounded-3xl border-border">
            <CardContent className="py-12 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="font-body-ar text-muted-foreground">
                {isRTL
                  ? 'لا توجد تأشيرات متاحة حالياً ضمن هذا التصنيف'
                  : 'No visas available in this category'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {filteredVisas.map((visa, i) => (
              <VisaCard
                key={visa.id}
                visa={visa}
                country={country}
                variant={i === 0 ? 'primary' : 'alternative'}
              />
            ))}
          </div>
        )}
      </div>

      {/* Long description / Overview */}
      {country.long_description && (
        <section className="py-16 mt-16 bg-cream/40">
          <div className="container-section">
            <div className="max-w-4xl">
              <h2 className="font-heading-ar text-3xl md:text-4xl font-extrabold text-navy mb-6">
                {isRTL ? `نظرة عامة عن تأشيرة ${country.name}` : `About ${country.name} visa`}
              </h2>
              <div className="font-body-ar whitespace-pre-wrap text-muted-foreground leading-relaxed text-base">
                {country.long_description}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Processing Steps — roadmap */}
      <section className="py-20">
        <div className="container-section">
          <div className="text-center mb-14">
            <h2 className="font-heading-ar text-3xl md:text-4xl font-extrabold text-navy mb-3 flex items-center justify-center gap-3">
              <ListChecks className="h-7 w-7 text-brand" />
              {isRTL ? 'خطوات تجهيز ومراجعة الطلب' : 'Application Preparation Roadmap'}
            </h2>
            <p className="font-body-ar text-muted-foreground">
              {isRTL ? 'رحلة بسيطة وميسرة من الطلب حتى الاستلام' : 'A simple journey from application to delivery'}
            </p>
          </div>
          <div className={cn(
            'grid gap-8',
            stepsToShow.length >= 4 ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2'
          )}>
            {stepsToShow.map((step, i) => {
              const isLast = i === stepsToShow.length - 1;
              return (
                <div key={i} className="relative">
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center font-display font-extrabold text-xl mb-5 relative z-10',
                      isLast ? 'bg-navy text-white' : 'bg-brand/10 text-brand'
                    )}
                  >
                    {i + 1}
                  </div>
                  {i < stepsToShow.length - 1 && (
                    <div className="absolute top-6 start-12 end-0 h-px bg-brand/20 hidden lg:block" />
                  )}
                  <h4 className="font-heading-ar font-extrabold text-navy text-lg mb-2">{step.title}</h4>
                  {step.description && (
                    <p className="font-body-ar text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tips */}
      {tipsArr.length > 0 && (
        <section className="py-16 bg-cream/40">
          <div className="container-section">
            <h2 className="font-heading-ar text-3xl md:text-4xl font-extrabold text-navy mb-8 flex items-center gap-3">
              <Lightbulb className="h-7 w-7 text-brand" />
              {isRTL ? 'نصائح مهمة' : 'Helpful Tips'}
            </h2>
            <Card className="rounded-3xl border-border bg-card">
              <CardContent className="p-8">
                <ul className="space-y-4">
                  {tipsArr.map((tip, i) => (
                    <li key={i} className="flex items-start gap-3 font-body-ar">
                      <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{typeof tip === 'string' ? tip : tip?.title || ''}{typeof tip === 'object' && tip?.description ? ` — ${tip.description}` : ''}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* FAQ */}
      {dynamicFaqs.length > 0 && (
        <section className="py-20">
          <div className="container-section">
            <h2 className="font-heading-ar text-3xl md:text-4xl font-extrabold text-navy mb-8">
              {isRTL ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
            </h2>
            <Card className="rounded-3xl border-border bg-card">
              <CardContent className="p-4 sm:p-6">
                <Accordion type="single" collapsible className="w-full">
                  {dynamicFaqs.map((f, i) => (
                    <AccordionItem key={i} value={`faq-${i}`} className="border-border">
                      <AccordionTrigger className="text-start font-heading-ar font-bold text-navy hover:no-underline">{f.question}</AccordionTrigger>
                      <AccordionContent className="text-muted-foreground whitespace-pre-wrap font-body-ar leading-relaxed">{f.answer}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* General Requirements */}
      <section className="py-20 bg-cream/40">
        <div className="container-section">
          <h2 className="font-heading-ar text-3xl md:text-4xl font-extrabold text-navy mb-8">
            {isRTL ? 'المتطلبات العامة' : 'General Requirements'}
          </h2>
          <Card className="rounded-3xl border-border bg-card">
            <CardContent className="p-8">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {generalRequirements.map((req, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 font-body-ar text-sm bg-cream/40 p-3 rounded-xl border border-border"
                  >
                    <CheckCircle2 className="h-4 w-4 text-brand flex-shrink-0" />
                    <span className="text-foreground">{req}</span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs text-muted-foreground font-body-ar">
                {isRTL
                  ? '* قد تختلف المتطلبات حسب نوع التأشيرة والجنسية. سيتم عرض المتطلبات الكاملة أثناء عملية التقديم.'
                  : '* Requirements may vary based on visa type and nationality. Full requirements will be shown during the application process.'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
