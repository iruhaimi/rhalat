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

  const visaTitle = `${visa.name} — ${country?.name} | عطلات رحلاتكم`;
  const visaDesc = `قدّم على ${visa.name} لـ${country?.name}: السعر يبدأ من ${visa.price} ر.س، مدة المعالجة ${visa.processing_days} يوماً. متطلبات واضحة ودعم متواصل.`;
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

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={visaTitle}
        description={visaDesc}
        path={`/visa/${visa.id}`}
        jsonLd={[serviceLd, breadcrumbLd]}
      />
      {/* Header */}
      <section className="gradient-hero py-12">
        <div className="container-section">
          <Link 
            to="/visa-services" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Visa Services
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <img
              src={country?.flag_url || `https://flagcdn.com/w80/${country?.code.toLowerCase()}.png`}
              alt={country?.name}
              className="h-16 w-24 rounded-lg object-cover shadow-lg"
            />
            <div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">
                {visa.name}
              </h1>
              <p className="text-lg text-white/80 mt-1">{country?.name}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 sm:py-12">
        <div className="container-section">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left Column - Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">
                    {visa.description || `Apply for a ${visa.name} to ${country?.name}. Our expert team will guide you through the entire application process, ensuring a smooth and hassle-free experience.`}
                  </p>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <Clock className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">Processing</p>
                      <p className="font-semibold">{visa.processing_days} Days</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <Calendar className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">Validity</p>
                      <p className="font-semibold">{visa.validity_days || 'Varies'} Days</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <Users className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">Max Stay</p>
                      <p className="font-semibold">{visa.max_stay_days || 'Varies'} Days</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-4 text-center">
                      <FileText className="h-6 w-6 mx-auto text-primary mb-2" />
                      <p className="text-sm text-muted-foreground">Entry Type</p>
                      <p className="font-semibold capitalize">{visa.entry_type}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Requirements */}
              <Card>
                <CardHeader>
                  <CardTitle>Requirements</CardTitle>
                  <CardDescription>
                    Make sure you have all the required documents before applying
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {requirements.length > 0 ? (
                    <ul className="space-y-3">
                      {requirements.map((req, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-success mt-0.5 flex-shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted-foreground">
                      Requirements will be displayed during the application process.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* FAQs */}
              <Card>
                <CardHeader>
                  <CardTitle>Frequently Asked Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                      <AccordionItem key={index} value={`faq-${index}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
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
                <Card className="shadow-lg">
                  <CardHeader>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-primary">{visa.price}</span>
                      <span className="text-muted-foreground">ر.س</span>
                    </div>
                    <CardDescription>لكل طلب</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button size="lg" className="w-full" onClick={handleApply}>
                      Apply Now
                    </Button>

                    <Separator />

                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Shield className="h-4 w-4 text-success" />
                        <span>Secure payment processing</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4 text-success" />
                        <span>Fast {visa.processing_days}-day processing</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Star className="h-4 w-4 text-success" />
                        <span>98% approval rate</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4 text-success" />
                        <span>Expert assistance included</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="text-xs text-muted-foreground">
                      <p>
                        Price includes all processing fees. Additional embassy fees may apply 
                        and will be communicated during the application process.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Trust Badges */}
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg border border-border bg-card p-3 text-center">
                    <Shield className="h-6 w-6 mx-auto text-primary mb-1" />
                    <p className="text-xs font-medium">SSL Secure</p>
                  </div>
                  <div className="rounded-lg border border-border bg-card p-3 text-center">
                    <Star className="h-6 w-6 mx-auto text-primary mb-1" />
                    <p className="text-xs font-medium">Trusted Service</p>
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
