import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  ArrowRight,
  CheckCircle2, 
  FileText,
  AlertCircle,
  XCircle,
  Lightbulb,
  ListChecks
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
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { VisaCard } from '@/components/visa/VisaCard';
import SchengenDetail from './SchengenDetail';
import SEO from '@/components/seo/SEO';
import type { Country, VisaType } from '@/types/database';

export default function CountryDetail() {
  const { countryCode } = useParams();
  const { t, direction } = useLanguage();
  const [country, setCountry] = useState<Country | null>(null);
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const isSchengen = countryCode?.toUpperCase() === 'SCHENGEN';

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

  return (
    <div className="min-h-screen bg-canvas">
      <SEO
        title={countryTitle}
        description={countryDesc}
        path={`/country/${country.code}`}
        jsonLd={[serviceLd, breadcrumbLd, faqLd]}
      />
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy/95 to-brand py-16">
        <div className="absolute -top-32 -end-32 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="container-section relative">
          <Link 
            to="/destinations" 
            className="inline-flex items-center gap-2 text-white/75 hover:text-white mb-8 font-jakarta text-sm font-bold transition-colors"
          >
            <ArrowIcon className="h-4 w-4 rotate-180 rtl:rotate-0" />
            {direction === 'rtl' ? 'عودة للدول' : 'Back to Countries'}
          </Link>

          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <span className="font-jakarta text-xs font-bold tracking-[0.25em] uppercase text-white/60 mb-3 block">
                {country.code}
              </span>
              <h1 className="font-heading-ar text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.05]">
                {direction === 'rtl' ? `تأشيرات ${country.name}` : `${country.name} Visas`}
              </h1>
              <p className="font-body-ar text-lg text-white/75 mt-4 max-w-lg">
                {direction === 'rtl'
                  ? `${visaTypes.length} نوع تأشيرة متاح${minDays ? ` • معالجة من ${minDays} أيام` : ''}${minPrice ? ` • تبدأ من ${minPrice} ر.س` : ''}`
                  : `${visaTypes.length} visa types available`
                }
              </p>
            </div>
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/3] rounded-4xl overflow-hidden border border-white/10 shadow-2xl bg-white/5">
                <img
                  src={country.flag_url || `https://flagcdn.com/w1280/${country.code.toLowerCase()}.png`}
                  alt={country.name}
                  className="w-full h-full object-cover saturate-150 contrast-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy/30 via-transparent to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Visa Types */}
      <section className="py-20">
        <div className="container-section">
          <h2 className="font-heading-ar text-3xl md:text-4xl font-extrabold text-navy mb-8">
            {direction === 'rtl' ? 'أنواع التأشيرات المتاحة' : 'Available Visa Types'}
          </h2>

          {visaTypes.length === 0 ? (
            <Card className="rounded-4xl border-border">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="font-body-ar text-muted-foreground">
                  {direction === 'rtl' 
                    ? 'لا توجد تأشيرات متاحة حالياً لهذه الدولة'
                    : 'No visas currently available for this country'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visaTypes.map((visa) => (
                <VisaCard key={visa.id} visa={visa} country={country} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Long description / Overview */}
      {country.long_description && (
        <section className="py-16 bg-cream/40">
          <div className="container-section">
            <div className="max-w-4xl">
              <h2 className="font-heading-ar text-3xl md:text-4xl font-extrabold text-navy mb-6">
                {direction === 'rtl' ? `نظرة عامة عن تأشيرة ${country.name}` : `About ${country.name} visa`}
              </h2>
              <div className="font-body-ar whitespace-pre-wrap text-muted-foreground leading-relaxed text-base">
                {country.long_description}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Processing Steps */}
      {stepsArr.length > 0 && (
        <section className="py-20">
          <div className="container-section">
            <h2 className="font-heading-ar text-3xl md:text-4xl font-extrabold text-navy mb-8 flex items-center gap-3">
              <ListChecks className="h-7 w-7 text-brand" />
              {direction === 'rtl' ? 'خطوات التقديم' : 'Application Steps'}
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {stepsArr.map((step, i) => (
                <Card key={i} className="rounded-3xl border-border bg-card hover:shadow-xl hover:shadow-navy/5 transition-all">
                  <CardContent className="p-6 flex gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-navy text-white flex items-center justify-center font-display font-bold text-lg flex-shrink-0">
                      {String(i + 1).padStart(2, '0')}
                    </div>
                    <div>
                      <h3 className="font-heading-ar font-extrabold text-navy text-lg">{step.title}</h3>
                      {step.description && <p className="font-body-ar text-sm text-muted-foreground mt-1 leading-relaxed">{step.description}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Tips */}
      {tipsArr.length > 0 && (
        <section className="py-16 bg-cream/40">
          <div className="container-section">
            <h2 className="font-heading-ar text-3xl md:text-4xl font-extrabold text-navy mb-8 flex items-center gap-3">
              <Lightbulb className="h-7 w-7 text-brand" />
              {direction === 'rtl' ? 'نصائح مهمة' : 'Helpful Tips'}
            </h2>
            <Card className="rounded-4xl border-border bg-card">
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
              {direction === 'rtl' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
            </h2>
            <Card className="rounded-4xl border-border bg-card">
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
            {direction === 'rtl' ? 'المتطلبات العامة' : 'General Requirements'}
          </h2>
          <Card className="rounded-4xl border-border bg-card">
            <CardContent className="p-8">
              <ul className="grid gap-4 sm:grid-cols-2">
                {generalRequirements.map((req, i) => (
                  <li key={i} className="flex items-center gap-3 font-body-ar">
                    <CheckCircle2 className="h-5 w-5 text-brand flex-shrink-0" />
                    <span className="text-foreground">{req}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-muted-foreground font-body-ar">
                {direction === 'rtl' 
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
