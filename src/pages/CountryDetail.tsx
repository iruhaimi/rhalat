import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  ArrowRight,
  CheckCircle2, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
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
  const countryTitle = `تأشيرة ${country.name} — الشروط والأسعار | عطلات رحلاتكم`;
  const countryDesc = `استخرج تأشيرة ${country.name} بسهولة من السعودية: ${visaTypes.length} نوع تأشيرة${minPrice ? `، تبدأ من ${minPrice} ر.س` : ''}${minDays ? `، معالجة خلال ${minDays} أيام` : ''}. متطلبات واضحة ودعم متواصل.`;
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
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `كم تستغرق تأشيرة ${country.name}؟`,
        acceptedAnswer: { "@type": "Answer", text: minDays ? `مدة المعالجة تبدأ من ${minDays} أيام عمل حسب نوع التأشيرة وحالة الطلب.` : "تختلف مدة المعالجة حسب نوع التأشيرة." },
      },
      {
        "@type": "Question",
        name: `كم سعر تأشيرة ${country.name}؟`,
        acceptedAnswer: { "@type": "Answer", text: minPrice ? `الأسعار تبدأ من ${minPrice} ر.س حسب نوع التأشيرة المختار.` : "تختلف الأسعار حسب نوع التأشيرة." },
      },
      {
        "@type": "Question",
        name: `ما المستندات المطلوبة لتأشيرة ${country.name}؟`,
        acceptedAnswer: { "@type": "Answer", text: generalRequirements.join('، ') + '.' },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={countryTitle}
        description={countryDesc}
        path={`/country/${country.code}`}
        jsonLd={[serviceLd, breadcrumbLd, faqLd]}
      />
      {/* Hero */}
      <section className="gradient-hero py-12">
        <div className="container-section">
          <Link 
            to="/destinations" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6"
          >
            <ArrowIcon className="h-4 w-4 rotate-180 rtl:rotate-0" />
            {direction === 'rtl' ? 'عودة للدول' : 'Back to Countries'}
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <img
              src={country.flag_url || `https://flagcdn.com/w160/${country.code.toLowerCase()}.png`}
              alt={country.name}
              className="h-20 w-28 rounded-lg object-cover shadow-lg"
            />
            <div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">
                {direction === 'rtl' ? `تأشيرات ${country.name}` : `${country.name} Visas`}
              </h1>
              <p className="text-lg text-white/80 mt-1">
                {direction === 'rtl' 
                  ? `${visaTypes.length} نوع تأشيرة متاح`
                  : `${visaTypes.length} visa types available`
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visa Types */}
      <section className="py-12">
        <div className="container-section">
          <h2 className="text-2xl font-bold mb-6">
            {direction === 'rtl' ? 'أنواع التأشيرات المتاحة' : 'Available Visa Types'}
          </h2>

          {visaTypes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
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

      {/* General Requirements */}
      <section className="py-12 bg-muted/50">
        <div className="container-section">
          <h2 className="text-2xl font-bold mb-6">
            {direction === 'rtl' ? 'المتطلبات العامة' : 'General Requirements'}
          </h2>
          <Card>
            <CardContent className="py-6">
              <ul className="grid gap-3 sm:grid-cols-2">
                {generalRequirements.map((req, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0" />
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm text-muted-foreground">
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
