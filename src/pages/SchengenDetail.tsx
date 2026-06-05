import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft,
  ArrowRight,
  CheckCircle2, 
  Globe,
  Shield,
  Clock,
  MapPin
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import SARSymbol from '@/components/ui/SARSymbol';
import { SCHENGEN_INFO, SCHENGEN_COUNTRY_CODES } from '@/lib/schengenCountries';
import SEO from '@/components/seo/SEO';
import type { Country, VisaType } from '@/types/database';

export default function SchengenDetail() {
  const { direction } = useLanguage();
  const [schengenCountries, setSchengenCountries] = useState<Country[]>([]);
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    async function fetchData() {
      // Fetch all Schengen countries
      const { data: countriesData } = await supabase
        .from('countries')
        .select('*')
        .in('code', [...SCHENGEN_COUNTRY_CODES])
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('name');

      if (countriesData) {
        setSchengenCountries(countriesData as Country[]);
        
        // Fetch visa types from first available Schengen country (they share same requirements)
        if (countriesData.length > 0) {
          const { data: visaData } = await supabase
            .from('visa_types')
            .select('*')
            .eq('country_id', countriesData[0].id)
            .eq('is_active', true)
            .order('price');

          if (visaData) {
            setVisaTypes(visaData as VisaType[]);
          }
        }
      }

      setIsLoading(false);
    }

    fetchData();
  }, []);

  const schengenRequirements = direction === 'rtl' ? [
    'جواز سفر ساري المفعول (6 أشهر على الأقل بعد تاريخ العودة)',
    'صورتان شخصيتان حديثتان بخلفية بيضاء (35×45 مم)',
    'نموذج طلب التأشيرة مكتمل وموقع',
    'كشف حساب بنكي آخر 3-6 أشهر',
    'حجز فندقي مؤكد لكامل فترة الإقامة',
    'حجز طيران ذهاب وعودة',
    'تأمين سفر شامل (تغطية 30,000 يورو كحد أدنى)',
    'خطاب من جهة العمل أو إثبات الدخل',
    'جدول رحلة مفصل',
    'إثبات الارتباط بالوطن (عقار، عمل، عائلة)',
  ] : [
    'Valid passport (6+ months validity after return date)',
    'Two recent passport photos with white background (35×45mm)',
    'Completed and signed visa application form',
    'Bank statement for last 3-6 months',
    'Confirmed hotel booking for entire stay',
    'Round-trip flight booking',
    'Comprehensive travel insurance (minimum €30,000 coverage)',
    'Employment letter or proof of income',
    'Detailed travel itinerary',
    'Proof of ties to home country (property, job, family)',
  ];

  const schengenBenefits = direction === 'rtl' ? [
    { icon: Globe, title: '27 دولة', desc: 'تنقل حر بين جميع دول شنغن' },
    { icon: Clock, title: '90 يوم', desc: 'إقامة حتى 90 يوم خلال 180 يوم' },
    { icon: Shield, title: 'تأشيرة موحدة', desc: 'تقديم واحد لجميع الدول' },
  ] : [
    { icon: Globe, title: '27 Countries', desc: 'Free movement between all Schengen states' },
    { icon: Clock, title: '90 Days', desc: 'Stay up to 90 days within 180 days' },
    { icon: Shield, title: 'Unified Visa', desc: 'One application for all countries' },
  ];

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

  return (
    <div className="min-h-screen bg-canvas">
      <SEO
        title="تأشيرة الشنغن للسعوديين والمقيمين — الشروط والأسعار | عطلات رحلاتكم"
        description="استخرج تأشيرة شنغن واحدة تتيح لك دخول 27 دولة أوروبية. متطلبات واضحة، أسعار منافسة، ومعالجة سريعة من السعودية."
        path="/country/SCHENGEN"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: "خدمات تأشيرة الشنغن",
            serviceType: "Schengen Visa Application Service",
            areaServed: { "@type": "Place", name: "Schengen Area" },
            provider: { "@type": "Organization", name: "عطلات رحلاتكم", url: "https://visafaster.com/" },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "الرئيسية", item: "https://visafaster.com/" },
              { "@type": "ListItem", position: 2, name: "الوجهات", item: "https://visafaster.com/destinations" },
              { "@type": "ListItem", position: 3, name: "تأشيرة الشنغن", item: "https://visafaster.com/country/SCHENGEN" },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "كم دولة تشمل تأشيرة الشنغن؟",
                acceptedAnswer: { "@type": "Answer", text: "تتيح لك تأشيرة الشنغن دخول 27 دولة أوروبية بتأشيرة واحدة." },
              },
              {
                "@type": "Question",
                name: "ما مدة الإقامة المسموح بها بتأشيرة الشنغن؟",
                acceptedAnswer: { "@type": "Answer", text: "حتى 90 يوماً خلال أي فترة 180 يوماً في منطقة الشنغن." },
              },
              {
                "@type": "Question",
                name: "ما المستندات المطلوبة لتأشيرة الشنغن من السعودية؟",
                acceptedAnswer: { "@type": "Answer", text: "جواز سفر ساري، صور شخصية، نموذج طلب مكتمل، كشف حساب بنكي 3-6 أشهر، حجز فندق وطيران، تأمين سفر بتغطية 30,000 يورو على الأقل." },
              },
            ],
          },
        ]}
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
            {direction === 'rtl' ? 'عودة للوجهات' : 'Back to Destinations'}
          </Link>

          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <span className="font-jakarta text-xs font-bold tracking-[0.25em] uppercase text-white/60 mb-3 block">
                EU / SCHENGEN
              </span>
              <h1 className="font-heading-ar text-5xl md:text-6xl font-extrabold tracking-tight text-white leading-[1.05]">
                {direction === 'rtl' ? 'تأشيرة شنغن' : 'Schengen Visa'}
              </h1>
              <p className="font-body-ar text-lg text-white/75 mt-4 max-w-lg">
                {direction === 'rtl' 
                  ? `${schengenCountries.length} دولة مشمولة بتأشيرة واحدة`
                  : `${schengenCountries.length} countries covered with one visa`
                }
              </p>
            </div>
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/3] rounded-4xl overflow-hidden border border-white/10 shadow-2xl bg-white/5">
                <img
                  src={SCHENGEN_INFO.flag_url}
                  alt="Schengen"
                  className="w-full h-full object-cover saturate-[1.8] contrast-125 brightness-105"
                />
                <div className="absolute inset-0 " />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="container-section">
          <div className="grid gap-6 md:grid-cols-3">
            {schengenBenefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="text-center h-full rounded-4xl border-border bg-card hover:shadow-2xl hover:shadow-navy/5 hover:-translate-y-1 transition-all">
                  <CardContent className="p-8">
                    <div className="inline-flex h-14 w-14 rounded-2xl bg-cream items-center justify-center mb-4">
                      <benefit.icon className="h-7 w-7 text-brand" />
                    </div>
                    <h3 className="font-heading-ar font-extrabold text-2xl text-navy mb-2">{benefit.title}</h3>
                    <p className="font-body-ar text-sm text-muted-foreground">{benefit.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Member Countries */}
      <section className="py-16 bg-cream/40">
        <div className="container-section">
          <h2 className="font-heading-ar text-3xl md:text-4xl font-extrabold text-navy mb-8 flex items-center gap-3">
            <MapPin className="h-7 w-7 text-brand" />
            {direction === 'rtl' ? 'الدول المشمولة' : 'Member Countries'}
          </h2>

          <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {schengenCountries.map((country, i) => (
              <motion.div
                key={country.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="rounded-2xl border-border bg-card hover:shadow-lg hover:border-brand/30 transition-all cursor-default">
                  <CardContent className="p-3 flex items-center gap-3">
                    <img
                      src={country.flag_url || `https://flagcdn.com/w160/${country.code.toLowerCase()}.png`}
                      alt={country.name}
                      className="w-9 h-7 rounded-md object-cover saturate-[1.8] contrast-125 brightness-105 shadow-sm"
                    />
                    <span className="font-heading-ar font-bold text-sm truncate text-navy">{country.name}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {schengenCountries.length === 0 && (
            <Card className="rounded-4xl border-border">
              <CardContent className="py-8 text-center text-muted-foreground font-body-ar">
                {direction === 'rtl' 
                  ? 'لم يتم إضافة دول شنغن بعد في النظام'
                  : 'Schengen countries have not been added to the system yet'
                }
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      {/* Visa Types */}
      {visaTypes.length > 0 && (
        <section className="py-16">
          <div className="container-section">
            <h2 className="font-heading-ar text-3xl md:text-4xl font-extrabold text-navy mb-8">
              {direction === 'rtl' ? 'أنواع التأشيرات المتاحة' : 'Available Visa Types'}
            </h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visaTypes.map((visa, i) => (
                <motion.div
                  key={visa.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full rounded-3xl border-border bg-card hover:shadow-2xl hover:shadow-navy/5 hover:-translate-y-1 transition-all">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-heading-ar font-extrabold text-xl text-navy">{visa.name}</h3>
                        <Badge className="bg-cream text-navy hover:bg-cream border-0 rounded-xl font-jakarta text-[10px] font-bold px-3">
                          {visa.processing_days} {direction === 'rtl' ? 'يوم' : 'days'}
                        </Badge>
                      </div>
                      {visa.description && (
                        <p className="text-sm text-muted-foreground mb-4 font-body-ar">{visa.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-border">
                        <div className="flex items-baseline gap-1 font-display text-2xl font-bold text-brand">
                          {Number(visa.price).toLocaleString()}
                          <SARSymbol size="sm" className="text-brand" />
                        </div>
                        <Button size="sm" asChild className="rounded-2xl h-10 bg-navy hover:bg-navy/90 text-navy-foreground">
                          <Link to="/apply?country=SCHENGEN">
                            {direction === 'rtl' ? 'قدّم الآن' : 'Apply Now'}
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Requirements */}
      <section className="py-16 bg-cream/40">
        <div className="container-section">
          <h2 className="font-heading-ar text-3xl md:text-4xl font-extrabold text-navy mb-8 flex items-center gap-3">
            <CheckCircle2 className="h-7 w-7 text-brand" />
            {direction === 'rtl' ? 'متطلبات تأشيرة شنغن' : 'Schengen Visa Requirements'}
          </h2>
          <Card className="rounded-4xl border-border bg-card">
            <CardContent className="p-8" dir={direction === 'rtl' ? 'rtl' : 'ltr'}>
              <ul className="grid gap-4 sm:grid-cols-2" style={{ textAlign: direction === 'rtl' ? 'right' : 'left' }}>
                {schengenRequirements.map((req, i) => (
                  <motion.li 
                    key={i} 
                    className="flex items-start gap-3 font-body-ar"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <CheckCircle2 className="h-5 w-5 text-brand flex-shrink-0 mt-0.5" />
                    <span className="text-foreground">{req}</span>
                  </motion.li>
                ))}
              </ul>
              <p className="mt-6 text-xs text-muted-foreground font-body-ar" style={{ textAlign: direction === 'rtl' ? 'right' : 'left' }}>
                {direction === 'rtl' 
                  ? '* قد تختلف المتطلبات حسب سفارة الدولة المختارة. تأكد من مراجعة المتطلبات الخاصة بالسفارة قبل التقديم.'
                  : '* Requirements may vary by embassy. Please verify specific embassy requirements before applying.'
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container-section">
          <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-navy via-navy/95 to-brand p-12 md:p-16 text-center">
            <div className="absolute -top-20 -end-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
            <h2 className="font-heading-ar text-4xl md:text-5xl font-extrabold text-white mb-4 relative">
              {direction === 'rtl' ? 'جاهز للتقديم؟' : 'Ready to Apply?'}
            </h2>
            <p className="font-body-ar text-white/75 mb-8 max-w-xl mx-auto relative">
              {direction === 'rtl' 
                ? 'ابدأ طلب تأشيرة شنغن الآن واستمتع بالسفر لأكثر من 27 دولة أوروبية بتأشيرة واحدة'
                : 'Start your Schengen visa application now and enjoy traveling to over 27 European countries with one visa'
              }
            </p>
            <Button size="lg" asChild className="rounded-2xl h-14 px-8 bg-white text-navy hover:bg-white/90 font-bold relative">
              <Link to="/apply?country=SCHENGEN" className="gap-2">
                {direction === 'rtl' ? 'ابدأ التقديم' : 'Start Application'}
                <ArrowIcon className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
