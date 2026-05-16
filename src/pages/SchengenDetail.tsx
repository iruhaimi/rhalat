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
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="gradient-hero py-12">
        <div className="container-section">
          <Link 
            to="/destinations" 
            className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6"
          >
            <ArrowIcon className="h-4 w-4 rotate-180 rtl:rotate-0" />
            {direction === 'rtl' ? 'عودة للوجهات' : 'Back to Destinations'}
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <img
              src={SCHENGEN_INFO.flag_url}
              alt="Schengen"
              className="h-20 w-28 rounded-lg object-cover shadow-lg"
            />
            <div>
              <h1 className="text-3xl font-bold text-white sm:text-4xl">
                {direction === 'rtl' ? 'تأشيرة شنغن (الاتحاد الأوروبي)' : 'Schengen Visa (EU)'}
              </h1>
              <p className="text-lg text-white/80 mt-1">
                {direction === 'rtl' 
                  ? `${schengenCountries.length} دولة مشمولة بتأشيرة واحدة`
                  : `${schengenCountries.length} countries covered with one visa`
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-8 bg-muted/30">
        <div className="container-section">
          <div className="grid gap-4 md:grid-cols-3">
            {schengenBenefits.map((benefit, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="text-center h-full">
                  <CardContent className="pt-6">
                    <benefit.icon className="h-10 w-10 mx-auto text-primary mb-3" />
                    <h3 className="font-bold text-lg">{benefit.title}</h3>
                    <p className="text-sm text-muted-foreground">{benefit.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Member Countries */}
      <section className="py-12">
        <div className="container-section">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <MapPin className="h-6 w-6 text-primary" />
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
                <Card className="hover:shadow-md transition-shadow cursor-default">
                  <CardContent className="p-3 flex items-center gap-3">
                    <img
                      src={country.flag_url || `https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                      alt={country.name}
                      className="w-8 h-6 rounded object-cover"
                    />
                    <span className="font-medium text-sm truncate">{country.name}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {schengenCountries.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
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
        <section className="py-12 bg-muted/30">
          <div className="container-section">
            <h2 className="text-2xl font-bold mb-6">
              {direction === 'rtl' ? 'أنواع التأشيرات المتاحة' : 'Available Visa Types'}
            </h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {visaTypes.map((visa, i) => (
                <motion.div
                  key={visa.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="h-full">
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg">{visa.name}</h3>
                        <Badge variant="secondary">
                          {visa.processing_days} {direction === 'rtl' ? 'يوم' : 'days'}
                        </Badge>
                      </div>
                      {visa.description && (
                        <p className="text-sm text-muted-foreground mb-4">{visa.description}</p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-3 border-t">
                        <div className="flex items-center gap-1 text-xl font-bold text-primary">
                          {Number(visa.price).toLocaleString()}
                          <SARSymbol size="sm" className="text-primary" />
                        </div>
                        <Button size="sm" asChild>
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
      <section className="py-12">
        <div className="container-section">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-success" />
            {direction === 'rtl' ? 'متطلبات تأشيرة شنغن' : 'Schengen Visa Requirements'}
          </h2>
          <Card>
            <CardContent className="py-6" dir={direction === 'rtl' ? 'rtl' : 'ltr'}>
              <ul className="grid gap-3 sm:grid-cols-2" style={{ textAlign: direction === 'rtl' ? 'right' : 'left' }}>
                {schengenRequirements.map((req, i) => (
                  <motion.li 
                    key={i} 
                    className="flex items-start gap-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <CheckCircle2 className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <span>{req}</span>
                  </motion.li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-muted-foreground" style={{ textAlign: direction === 'rtl' ? 'right' : 'left' }}>
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
      <section className="py-12 bg-primary/5">
        <div className="container-section text-center">
          <h2 className="text-2xl font-bold mb-4">
            {direction === 'rtl' ? 'جاهز للتقديم؟' : 'Ready to Apply?'}
          </h2>
          <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
            {direction === 'rtl' 
              ? 'ابدأ طلب تأشيرة شنغن الآن واستمتع بالسفر لأكثر من 27 دولة أوروبية بتأشيرة واحدة'
              : 'Start your Schengen visa application now and enjoy traveling to over 27 European countries with one visa'
            }
          </p>
          <Button size="lg" asChild>
            <Link to="/apply?country=SCHENGEN" className="gap-2">
              {direction === 'rtl' ? 'ابدأ التقديم' : 'Start Application'}
              <ArrowIcon className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
