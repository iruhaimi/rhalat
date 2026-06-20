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
  MapPin,
  Sparkles,
  ListChecks,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { SCHENGEN_INFO, SCHENGEN_COUNTRY_CODES } from '@/lib/schengenCountries';
import { getSharpFlagUrl } from '@/lib/flagUtils';
import { VisaCard } from '@/components/visa/VisaCard';
import SEO from '@/components/seo/SEO';
import type { Country, VisaType } from '@/types/database';

export default function SchengenDetail() {
  const { direction } = useLanguage();
  const [schengenCountries, setSchengenCountries] = useState<Country[]>([]);
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('all');

  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const isRTL = direction === 'rtl';

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
      {(() => {
        const entryTypes = Array.from(
          new Set(visaTypes.map(v => v.entry_type).filter(Boolean) as string[])
        );
        const showTabs = entryTypes.length > 1;
        const filteredVisas = activeTab === 'all' ? visaTypes : visaTypes.filter(v => v.entry_type === activeTab);
        const entryTypeLabel = (key: string) => {
          if (key === 'single') return isRTL ? 'دخول واحد' : 'Single Entry';
          if (key === 'multiple') return isRTL ? 'دخول متعدد' : 'Multiple Entry';
          if (key === 'transit') return isRTL ? 'عبور / ترانزيت' : 'Transit';
          return key;
        };
        const minPrice = visaTypes.length ? Math.min(...visaTypes.map(v => Number(v.price))) : null;
        const minDays = visaTypes.length ? Math.min(...visaTypes.map(v => v.processing_days)) : null;
        const schengenCountry = {
          id: 'schengen',
          code: 'SCHENGEN',
          name: isRTL ? 'شنغن' : 'Schengen',
          flag_url: SCHENGEN_INFO.flag_url,
        } as unknown as Country;

        const defaultSteps = [
          { title: isRTL ? 'اختر نوع التأشيرة' : 'Choose visa type', description: isRTL ? 'حدد نوع تأشيرة شنغن المناسبة لرحلتك.' : 'Pick the Schengen visa that fits your trip.' },
          { title: isRTL ? 'تعبئة البيانات' : 'Fill the form', description: isRTL ? 'أدخل بياناتك وارفع المستندات عبر نموذجنا الآمن.' : 'Enter your details and upload documents securely.' },
          { title: isRTL ? 'حجز موعد السفارة' : 'Embassy appointment', description: isRTL ? 'نقوم بجدولة موعدك في السفارة المختصة.' : 'We schedule your embassy appointment.' },
          { title: isRTL ? 'استلام التأشيرة' : 'Receive visa', description: isRTL ? 'استلم جواز سفرك مع التأشيرة الموحدة.' : 'Receive your passport with the unified Schengen visa.' },
        ];

        return (
          <>
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
                  {isRTL ? 'عودة للوجهات' : 'Back to Destinations'}
                </Link>

                <div className="flex flex-col lg:flex-row items-center gap-12">
                  <div className="flex-1 text-center lg:text-start">
                    <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full mb-6 border border-white/20">
                      <Sparkles className="h-3 w-3 text-brand" />
                      <span className="font-jakarta text-[10px] font-bold tracking-wider uppercase opacity-80">
                        {isRTL ? `${schengenCountries.length} دولة • تأشيرة واحدة` : `${schengenCountries.length} countries • One visa`}
                      </span>
                      <div className="w-1 h-1 bg-brand rounded-full" />
                      <span className="text-xs font-body-ar">SCHENGEN</span>
                    </div>
                    <h1 className="font-heading-ar text-5xl md:text-7xl font-extrabold mb-6 tracking-tight leading-[1.05]">
                      {isRTL ? 'تأشيرة شنغن الموحّدة' : 'Unified Schengen Visa'}
                    </h1>
                    <p className="font-body-ar text-lg md:text-xl text-white/70 max-w-2xl mb-8 leading-relaxed">
                      {isRTL
                        ? 'تأشيرة واحدة تفتح لك أبواب 27 دولة أوروبية. إجراءات مبسطة، دعم متواصل، ومعالجة سريعة من السعودية.'
                        : 'One visa unlocks 27 European countries. Simplified procedures, ongoing support, and fast processing from Saudi Arabia.'}
                    </p>
                    <div className="flex flex-wrap gap-8 justify-center lg:justify-start border-t border-white/10 pt-8">
                      <div className="text-start">
                        <span className="block font-display text-3xl font-extrabold">{schengenCountries.length || 27}</span>
                        <span className="font-body-ar text-sm text-white/50">
                          {isRTL ? 'دولة أوروبية' : 'European states'}
                        </span>
                      </div>
                      <div className="w-px h-12 bg-white/10" />
                      <div className="text-start">
                        <span className="block font-display text-3xl font-extrabold">90</span>
                        <span className="font-body-ar text-sm text-white/50">
                          {isRTL ? 'يوم إقامة قصوى' : 'days max stay'}
                        </span>
                      </div>
                      {minDays && (
                        <>
                          <div className="w-px h-12 bg-white/10" />
                          <div className="text-start">
                            <span className="block font-display text-3xl font-extrabold">{minDays}</span>
                            <span className="font-body-ar text-sm text-white/50">
                              {isRTL ? 'أيام عمل للمعالجة' : 'business days'}
                            </span>
                          </div>
                        </>
                      )}
                      {minPrice && (
                        <>
                          <div className="w-px h-12 bg-white/10" />
                          <div className="text-start">
                            <span className="block font-display text-3xl font-extrabold">
                              {minPrice} <span className="text-base font-bold text-white/60">{isRTL ? 'ر.س' : 'SAR'}</span>
                            </span>
                            <span className="font-body-ar text-sm text-white/50">
                              {isRTL ? 'السعر يبدأ من' : 'starting price'}
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Flag tile */}
                  <div className="relative w-64 h-64 md:w-80 md:h-80 flex-shrink-0">
                    <div className="absolute inset-0 bg-brand rounded-3xl rotate-6" />
                    <div className="absolute inset-0 bg-white p-4 shadow-2xl rounded-3xl -rotate-2 overflow-hidden">
                      <img
                        src={SCHENGEN_INFO.flag_url}
                        alt="Schengen"
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
                        ? 'لا توجد تأشيرات شنغن مفعّلة حالياً'
                        : 'No Schengen visa types are currently active'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {filteredVisas.map((visa, i) => (
                    <VisaCard
                      key={visa.id}
                      visa={visa}
                      country={schengenCountry}
                      variant={i === 0 ? 'primary' : 'alternative'}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Benefits */}
            <section className="py-20 mt-12 bg-cream/40">
              <div className="container-section">
                <div className="text-center mb-12">
                  <h2 className="font-heading-ar text-3xl md:text-4xl font-extrabold text-navy mb-3">
                    {isRTL ? 'لماذا تأشيرة شنغن؟' : 'Why Schengen?'}
                  </h2>
                  <p className="font-body-ar text-muted-foreground">
                    {isRTL ? 'مزايا فريدة لمسافر واحد ذكي' : 'Unique advantages for the smart traveler'}
                  </p>
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                  {schengenBenefits.map((benefit, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                    >
                      <Card className="text-center h-full rounded-3xl border-border bg-card hover:shadow-2xl hover:shadow-navy/5 hover:-translate-y-1 transition-all">
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

            {/* Member Countries — horizontal scroll strip */}
            <section className="py-20">
              <div className="container-section">
                <div className="flex items-end justify-between mb-8 gap-4 flex-wrap">
                  <div>
                    <h2 className="font-heading-ar text-3xl md:text-4xl font-extrabold text-navy mb-2 flex items-center gap-3">
                      <MapPin className="h-7 w-7 text-brand" />
                      {isRTL ? 'الدول المشمولة' : 'Member Countries'}
                    </h2>
                    <p className="font-body-ar text-muted-foreground text-sm">
                      {isRTL
                        ? `تنقّل بحرية بين ${schengenCountries.length || 27} دولة أوروبية بتأشيرة واحدة`
                        : `Move freely between ${schengenCountries.length || 27} European countries with one visa`}
                    </p>
                  </div>
                  <span className="font-jakarta text-xs font-bold tracking-wider uppercase text-brand bg-cream px-3 py-1.5 rounded-full">
                    {schengenCountries.length || 27} {isRTL ? 'دولة' : 'Countries'}
                  </span>
                </div>

                {schengenCountries.length === 0 ? (
                  <Card className="rounded-3xl border-border">
                    <CardContent className="py-8 text-center text-muted-foreground font-body-ar">
                      {isRTL ? 'لم يتم إضافة دول شنغن بعد' : 'Schengen countries not yet added'}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {schengenCountries.map((c, i) => (
                      <motion.div
                        key={c.id}
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.02 }}
                        className="flex items-center gap-3 bg-card border border-border rounded-2xl p-3 hover:border-brand/40 hover:shadow-md transition-all"
                      >
                        <img
                          src={getSharpFlagUrl(c)}
                          alt={c.name}
                          className="w-9 h-7 rounded-md object-cover image-render-auto shadow-sm flex-shrink-0"
                        />
                        <span className="font-heading-ar font-bold text-sm truncate text-navy">{c.name}</span>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Application Roadmap */}
            <section className="py-20 bg-cream/40">
              <div className="container-section">
                <div className="text-center mb-14">
                  <h2 className="font-heading-ar text-3xl md:text-4xl font-extrabold text-navy mb-3 flex items-center justify-center gap-3">
                    <ListChecks className="h-7 w-7 text-brand" />
                    {isRTL ? 'خطوات الحصول على تأشيرة شنغن' : 'Application Roadmap'}
                  </h2>
                  <p className="font-body-ar text-muted-foreground">
                    {isRTL ? 'رحلة بسيطة وميسرة من الطلب حتى الاستلام' : 'A simple journey from application to delivery'}
                  </p>
                </div>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
                  {defaultSteps.map((step, i) => {
                    const isLast = i === defaultSteps.length - 1;
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                        className={cn(
                          'rounded-3xl p-8 border transition-all',
                          isLast
                            ? 'bg-navy text-white border-navy shadow-xl'
                            : 'bg-card border-border hover:shadow-lg'
                        )}
                      >
                        <div
                          className={cn(
                            'inline-flex items-center justify-center w-12 h-12 rounded-2xl font-display text-xl font-extrabold mb-5',
                            isLast ? 'bg-white text-navy' : 'bg-brand/10 text-brand'
                          )}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </div>
                        <h3
                          className={cn(
                            'font-heading-ar font-extrabold text-lg mb-2',
                            isLast ? 'text-white' : 'text-navy'
                          )}
                        >
                          {step.title}
                        </h3>
                        <p
                          className={cn(
                            'font-body-ar text-sm leading-relaxed',
                            isLast ? 'text-white/70' : 'text-muted-foreground'
                          )}
                        >
                          {step.description}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* Requirements */}
            <section className="py-20">
              <div className="container-section">
                <div className="max-w-3xl mx-auto text-center mb-12">
                  <h2 className="font-heading-ar text-3xl md:text-4xl font-extrabold text-navy mb-3 flex items-center justify-center gap-3">
                    <CheckCircle2 className="h-7 w-7 text-brand" />
                    {isRTL ? 'متطلبات تأشيرة شنغن' : 'Schengen Requirements'}
                  </h2>
                  <p className="font-body-ar text-muted-foreground">
                    {isRTL ? 'قائمة شاملة لضمان قبول طلبك من أول مرة' : 'A complete checklist to maximize your approval chances'}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" dir={isRTL ? 'rtl' : 'ltr'}>
                  {schengenRequirements.map((req, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-start gap-3 bg-card border border-border rounded-2xl p-4 hover:border-brand/30 transition-colors"
                    >
                      <CheckCircle2 className="h-5 w-5 text-brand flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-body-ar text-foreground">{req}</span>
                    </motion.div>
                  ))}
                </div>
                <p className="mt-8 text-xs text-muted-foreground font-body-ar text-center max-w-2xl mx-auto">
                  {isRTL
                    ? '* قد تختلف المتطلبات حسب سفارة الدولة المختارة. تأكد من مراجعة المتطلبات الخاصة بالسفارة قبل التقديم.'
                    : '* Requirements may vary by embassy. Please verify specific embassy requirements before applying.'}
                </p>
              </div>
            </section>

            {/* CTA */}
            <section className="py-20">
              <div className="container-section">
                <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-navy via-navy/95 to-brand p-12 md:p-16 text-center">
                  <div className="absolute -top-20 -end-20 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
                  <h2 className="font-heading-ar text-4xl md:text-5xl font-extrabold text-white mb-4 relative">
                    {isRTL ? 'جاهز للتقديم؟' : 'Ready to Apply?'}
                  </h2>
                  <p className="font-body-ar text-white/75 mb-8 max-w-xl mx-auto relative">
                    {isRTL
                      ? 'ابدأ طلب تأشيرة شنغن الآن واستمتع بالسفر لأكثر من 27 دولة أوروبية بتأشيرة واحدة'
                      : 'Start your Schengen visa application now and enjoy traveling to over 27 European countries with one visa'}
                  </p>
                  <Button size="lg" asChild className="rounded-2xl h-14 px-8 bg-white text-navy hover:bg-white/90 font-bold relative">
                    <Link to="/apply?country=SCHENGEN" className="gap-2">
                      {isRTL ? 'ابدأ التقديم' : 'Start Application'}
                      <ArrowIcon className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </section>
          </>
        );
      })()}
    </div>
  );
}
