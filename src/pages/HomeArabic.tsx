import { lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import SEO from '@/components/seo/SEO';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Country, VisaType } from '@/types/database';

// Above-the-fold sections (eager)
import HeroSection from '@/components/home/HeroSection';
import CountriesSection from '@/components/home/CountriesSection';
import ComplianceDisclaimer from '@/components/layout/ComplianceDisclaimer';

// Below-the-fold sections (lazy)
const HowItWorksSection = lazy(() => import('@/components/home/HowItWorksSection'));
const FeaturesSection = lazy(() => import('@/components/home/FeaturesSection'));
const StatsSection = lazy(() => import('@/components/home/StatsSection'));
const TestimonialsSection = lazy(() => import('@/components/home/TestimonialsSection'));
const FAQSection = lazy(() => import('@/components/home/FAQSection'));
const CTASection = lazy(() => import('@/components/home/CTASection'));
const MiniCTA = lazy(() => import('@/components/home/MiniCTA'));
const StickyCTABar = lazy(() => import('@/components/home/StickyCTABar'));

export default function HomeArabic() {
  const { t } = useLanguage();

  const { data: countries = [] } = useQuery({
    queryKey: ['active-countries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('countries')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return (data || []) as Country[];
    },
  });

  const { data: visaTypes = [] } = useQuery({
    queryKey: ['active-visa-types-with-country'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visa_types')
        .select('*, country:countries(*)')
        .eq('is_active', true);
      if (error) throw error;
      return (data || []) as VisaType[];
    },
  });

  return (
    <div className="flex flex-col">
      <SEO title="عطلات رحلاتكم — خدمات التأشيرات السياحية والأعمال" description="احصل على تأشيرتك بسرعة وأمان مع عطلات رحلاتكم. تأشيرات سياحية، أعمال، طلابية، وشنغن لجميع الجنسيات." path="/" />
      <HeroSection />
      <CountriesSection countries={countries} visaTypes={visaTypes} t={t} />

      <Suspense fallback={<div className="min-h-[200px]" />}>
        <MiniCTA />
        <HowItWorksSection t={t} />
        <FeaturesSection t={t} />
        <StatsSection />
        <TestimonialsSection />
        <FAQSection t={t} />
        <CTASection t={t} />
        <StickyCTABar />
      </Suspense>
    </div>
  );
}
