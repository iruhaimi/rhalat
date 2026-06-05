import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  FileText,
  Shield,
  Users,
  Star,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import SEO from '@/components/seo/SEO';
import { getSharpFlagUrl } from '@/lib/flagUtils';
import type { Country, VisaType } from '@/types/database';

const faqs = [
  {
    question: 'How long does the application process take?',
    answer: 'The processing time varies by visa type. You can see the estimated processing time on the visa details. We recommend applying at least 2 weeks before your travel date.',
  },
  {
    question: 'What documents do I need?',
    answer: 'Required documents are listed in the requirements section. Make sure all documents are clear, legible, and meet the specified requirements.',
  },
  {
    question: 'Can I track my application status?',
    answer: 'Yes! Once you submit your application, you can track its status in real-time through your dashboard.',
  },
  {
    question: 'What if my application is rejected?',
    answer: 'If your application is rejected, we will explain the reasons and guide you on how to reapply. Partial refunds may be available depending on the circumstances.',
  },
  {
    question: 'Is my payment secure?',
    answer: 'Absolutely. We use industry-standard encryption and partner with trusted payment providers to ensure your financial information is protected.',
  },
];

export default function VisaDetail() {
  const { visaId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [visa, setVisa] = useState<VisaType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVisa() {
      if (!visaId) {
        setError('Visa ID not provided');
        setIsLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from('visa_types')
        .select('*, country:countries(*)')
        .eq('id', visaId)
        .eq('is_active', true)
        .maybeSingle();

      if (fetchError) {
        setError('Failed to load visa details');
        console.error('Error fetching visa:', fetchError);
      } else if (!data) {
        setError('Visa not found');
      } else {
        setVisa(data as VisaType);
      }

      setIsLoading(false);
    }

    fetchVisa();
  }, [visaId]);

  const handleApply = () => {
    if (user) {
      navigate(`/dashboard/apply/${visaId}`);
    } else {
      navigate(`/auth?mode=signup&redirect=/dashboard/apply/${visaId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-section py-8">
          <Skeleton className="h-8 w-32 mb-8" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full rounded-lg" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
            <div>
              <Skeleton className="h-80 w-full rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !visa) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-section py-16 text-center">
          <div className="mx-auto h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">{error || 'Visa Not Found'}</h1>
          <p className="text-muted-foreground mb-6">
            The visa you're looking for doesn't exist or is no longer available.
          </p>
          <Button asChild>
            <Link to="/visa-services">Browse Visa Services</Link>
          </Button>
        </div>
      </div>
    );
  }

  const country = visa.country as Country;
  const requirements = Array.isArray(visa.requirements) ? visa.requirements : [];
  const reqDetailed = (visa.requirements_detailed && typeof visa.requirements_detailed === 'object') ? visa.requirements_detailed as any : null;
  const rejectionReasons: string[] = Array.isArray(visa.common_rejection_reasons) ? visa.common_rejection_reasons : [];
  const timeline: Array<{ stage: string; days?: string; description?: string }> = Array.isArray(visa.processing_timeline) ? visa.processing_timeline : [];

  const visaTitle = `${visa.name} — ${country?.name} | عطلات رحلاتكم`;
  const visaDesc = visa.seo_description || `قدّم على ${visa.name} لـ${country?.name}: السعر يبدأ من ${visa.price} ر.س، مدة المعالجة ${visa.processing_days} يوماً. متطلبات واضحة ودعم متواصل.`;
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${visa.name} — ${country?.name}`,
    serviceType: "Visa Application Service",
    provider: { "@type": "Organization", name: "عطلات رحلاتكم", url: "https://visafaster.com/" },
    areaServed: country?.name,
    offers: {
      "@type": "Offer",
      price: String(visa.price),
      priceCurrency: "SAR",
      availability: "https://schema.org/InStock",
      url: `https://visafaster.com/visa/${visa.id}`,
    },
  };
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "الرئيسية", item: "https://visafaster.com/" },
      { "@type": "ListItem", position: 2, name: "الوجهات", item: "https://visafaster.com/destinations" },
      { "@type": "ListItem", position: 3, name: country?.name, item: `https://visafaster.com/country/${country?.code}` },
      { "@type": "ListItem", position: 4, name: visa.name, item: `https://visafaster.com/visa/${visa.id}` },
    ],
  };
  const dynamicFaqs = [
    { q: `كم تستغرق ${visa.name} لـ${country?.name}؟`, a: `مدة المعالجة المعتادة ${visa.processing_days} يوم عمل.` },
    { q: `كم سعر ${visa.name}؟`, a: `السعر يبدأ من ${visa.price} ر.س للطلب الواحد.` },
    ...(rejectionReasons.length > 0 ? [{ q: `ما أبرز أسباب رفض ${visa.name}؟`, a: rejectionReasons.join('، ') + '.' }] : []),
  ];
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: dynamicFaqs.map(f => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div className="min-h-screen bg-canvas">
      <SEO
        title={visaTitle}
        description={visaDesc}
        path={`/visa/${visa.id}`}
        jsonLd={[serviceLd, breadcrumbLd, faqLd]}
      />
      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy/95 to-brand py-16">
        <div className="absolute -top-32 -end-32 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        <div className="container-section relative">
          <Link 
            to="/visa-services" 
            className="inline-flex items-center gap-2 text-white/75 hover:text-white mb-8 transition-colors font-jakarta text-sm font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Visa Services
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="relative h-24 w-32 rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-white/5 flex-shrink-0">
              <img
                src={getSharpFlagUrl(country)}
                alt={country?.name}
                className="w-full h-full object-cover image-render-auto"
              />
            </div>
            <div>
              <span className="font-jakarta text-xs font-bold tracking-[0.25em] uppercase text-white/60 mb-2 block">
                {country?.name}
              </span>
              <h1 className="font-heading-ar text-4xl md:text-5xl font-extrabold text-white leading-tight">
                {visa.name}
              </h1>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-16">
        <div className="container-section">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overview */}
              <Card className="rounded-4xl border-border bg-card">
                <CardHeader className="pb-4">
                  <CardTitle className="font-heading-ar text-2xl font-extrabold text-navy">Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground font-body-ar leading-relaxed">
                    {visa.description || `Apply for a ${visa.name} to ${country?.name}. Our expert team will guide you through the entire application process, ensuring a smooth and hassle-free experience.`}
                  </p>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-2xl bg-cream/60 p-4 text-center">
                      <Clock className="h-6 w-6 mx-auto text-brand mb-2" />
                      <p className="font-jakarta text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Processing</p>
                      <p className="font-display font-bold text-navy text-lg mt-1">{visa.processing_days} Days</p>
                    </div>
                    <div className="rounded-2xl bg-cream/60 p-4 text-center">
                      <Calendar className="h-6 w-6 mx-auto text-brand mb-2" />
                      <p className="font-jakarta text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Validity</p>
                      <p className="font-display font-bold text-navy text-lg mt-1">{visa.validity_days || 'Varies'} Days</p>
                    </div>
                    <div className="rounded-2xl bg-cream/60 p-4 text-center">
                      <Users className="h-6 w-6 mx-auto text-brand mb-2" />
                      <p className="font-jakarta text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Max Stay</p>
                      <p className="font-display font-bold text-navy text-lg mt-1">{visa.max_stay_days || 'Varies'} Days</p>
                    </div>
                    <div className="rounded-2xl bg-cream/60 p-4 text-center">
                      <FileText className="h-6 w-6 mx-auto text-brand mb-2" />
                      <p className="font-jakarta text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Entry</p>
                      <p className="font-display font-bold text-navy text-lg mt-1 capitalize">{visa.entry_type}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Requirements */}
              <Card className="rounded-4xl border-border bg-card">
                <CardHeader>
                  <CardTitle className="font-heading-ar text-2xl font-extrabold text-navy">Requirements</CardTitle>
                  <CardDescription className="font-body-ar">
                    Make sure you have all the required documents before applying
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {requirements.length > 0 ? (
                    <ul className="space-y-3">
                      {requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-3 font-body-ar">
                          <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                          <span className="text-foreground">{req}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground font-body-ar">
                      Requirements will be displayed during the application process.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Requirements by nationality */}
              {reqDetailed && (reqDetailed.citizen?.length || reqDetailed.resident?.length) && (
                <Card className="rounded-4xl border-border bg-card">
                  <CardHeader>
                    <CardTitle className="font-heading-ar text-2xl font-extrabold text-navy">الشروط حسب الجنسية</CardTitle>
                    <CardDescription className="font-body-ar">قائمة المستندات تختلف بحسب صفة المتقدم</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {reqDetailed.citizen?.length > 0 && (
                      <div>
                        <h3 className="font-heading-ar font-bold mb-3 text-brand">للمواطنين السعوديين</h3>
                        <ul className="space-y-2">
                          {reqDetailed.citizen.map((r: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 font-body-ar">
                              <CheckCircle2 className="h-4 w-4 text-brand mt-1 flex-shrink-0" />
                              <span className="text-sm">{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {reqDetailed.resident?.length > 0 && (
                      <div>
                        <h3 className="font-heading-ar font-bold mb-3 text-brand">للمقيمين في السعودية</h3>
                        <ul className="space-y-2">
                          {reqDetailed.resident.map((r: string, i: number) => (
                            <li key={i} className="flex items-start gap-2 font-body-ar">
                              <CheckCircle2 className="h-4 w-4 text-brand mt-1 flex-shrink-0" />
                              <span className="text-sm">{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Processing timeline */}
              {timeline.length > 0 && (
                <Card className="rounded-4xl border-border bg-card">
                  <CardHeader>
                    <CardTitle className="font-heading-ar text-2xl font-extrabold text-navy">الجدول الزمني للمعالجة</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ol className="space-y-3">
                      {timeline.map((t, i) => (
                        <li key={i} className="flex gap-3">
                          <div className="h-9 w-9 rounded-xl bg-navy text-white flex items-center justify-center text-sm font-display font-bold flex-shrink-0">
                            {i + 1}
                          </div>
                          <div>
                            <p className="font-heading-ar font-bold text-navy">{t.stage}{t.days ? ` — ${t.days}` : ''}</p>
                            {t.description && <p className="text-sm text-muted-foreground font-body-ar mt-1">{t.description}</p>}
                          </div>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
              )}

              {/* Common rejection reasons */}
              {rejectionReasons.length > 0 && (
                <Card className="rounded-4xl border-border bg-card">
                  <CardHeader>
                    <CardTitle className="font-heading-ar text-2xl font-extrabold text-navy flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      أسباب الرفض الشائعة
                    </CardTitle>
                    <CardDescription className="font-body-ar">تجنّب هذه الأخطاء لزيادة فرص القبول</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {rejectionReasons.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm font-body-ar">
                          <span className="text-destructive mt-1">•</span>
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* FAQs */}
              <Card className="rounded-4xl border-border bg-card">
                <CardHeader>
                  <CardTitle className="font-heading-ar text-2xl font-extrabold text-navy">Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`faq-${index}`} className="border-border">
                        <AccordionTrigger className="text-left font-heading-ar font-bold text-navy hover:no-underline">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground font-body-ar leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Pricing Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-24">
                <Card className="rounded-4xl border-border bg-card shadow-2xl shadow-navy/10 overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-navy to-brand" />
                  <CardHeader>
                    <p className="font-jakarta text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">السعر يبدأ من</p>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display text-5xl font-bold text-navy">{visa.price}</span>
                      <span className="text-muted-foreground font-body-ar">ر.س</span>
                    </div>
                    <CardDescription className="font-body-ar">لكل طلب</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button size="lg" className="w-full rounded-2xl h-12 bg-navy hover:bg-navy/90 text-navy-foreground font-bold" onClick={handleApply}>
                      Apply Now
                    </Button>

                    <Separator />

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground font-body-ar">
                        <Shield className="h-4 w-4 text-brand" />
                        <span>Secure payment processing</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground font-body-ar">
                        <Clock className="h-4 w-4 text-brand" />
                        <span>Fast {visa.processing_days}-day processing</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground font-body-ar">
                        <Star className="h-4 w-4 text-brand" />
                        <span>98% approval rate</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground font-body-ar">
                        <Users className="h-4 w-4 text-brand" />
                        <span>Expert assistance included</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="text-xs text-muted-foreground font-body-ar">
                      <p>
                        Price includes all processing fees. Additional embassy fees may apply 
                        and will be communicated during the application process.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Trust Badges */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-2xl border border-border bg-card p-3 text-center">
                    <Shield className="h-6 w-6 mx-auto text-brand mb-1" />
                    <p className="text-xs font-jakarta font-bold text-navy">SSL Secure</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-card p-3 text-center">
                    <Star className="h-6 w-6 mx-auto text-brand mb-1" />
                    <p className="text-xs font-jakarta font-bold text-navy">Trusted Service</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
