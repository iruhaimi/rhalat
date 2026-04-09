import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, Shield, Clock, CheckCircle2, Plane, Loader2, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

import heroBgFallback from '@/assets/hero-bg.jpg';

// English country names by code
const countryNamesEn: Record<string, string> = {
  US: 'United States', AU: 'Australia', DE: 'Germany', AE: 'UAE',
  SA: 'Saudi Arabia', GB: 'United Kingdom', JP: 'Japan', SG: 'Singapore',
  FR: 'France', CA: 'Canada', IT: 'Italy', ES: 'Spain', NL: 'Netherlands',
  TR: 'Turkey', IN: 'India', CN: 'China', BR: 'Brazil', ZA: 'South Africa',
};

interface HeroDestination {
  id: string;
  name: string;
  name_en: string | null;
  country: string;
  country_en: string | null;
  image_url: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface HeroSetting {
  key: string;
  value: string;
  value_en: string | null;
}

// Fallback destinations
const fallbackDestinations: HeroDestination[] = [
  { id: '1', name: 'الولايات المتحدة', name_en: 'United States', country: 'US', country_en: 'United States', image_url: 'https://flagcdn.com/w160/us.png', link_url: null, display_order: 1, is_active: true, created_at: '', updated_at: '' },
  { id: '2', name: 'أستراليا', name_en: 'Australia', country: 'AU', country_en: 'Australia', image_url: 'https://flagcdn.com/w160/au.png', link_url: null, display_order: 2, is_active: true, created_at: '', updated_at: '' },
  { id: '3', name: 'ألمانيا', name_en: 'Germany', country: 'DE', country_en: 'Germany', image_url: 'https://flagcdn.com/w160/de.png', link_url: null, display_order: 3, is_active: true, created_at: '', updated_at: '' },
  { id: '4', name: 'الإمارات', name_en: 'UAE', country: 'AE', country_en: 'UAE', image_url: 'https://flagcdn.com/w160/ae.png', link_url: null, display_order: 4, is_active: true, created_at: '', updated_at: '' },
  { id: '5', name: 'المملكة المتحدة', name_en: 'United Kingdom', country: 'GB', country_en: 'United Kingdom', image_url: 'https://flagcdn.com/w160/gb.png', link_url: null, display_order: 5, is_active: true, created_at: '', updated_at: '' },
  { id: '6', name: 'اليابان', name_en: 'Japan', country: 'JP', country_en: 'Japan', image_url: 'https://flagcdn.com/w160/jp.png', link_url: null, display_order: 6, is_active: true, created_at: '', updated_at: '' },
];

export default function HeroSection() {
  const { direction } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleStart, setVisibleStart] = useState(0);
  const isRTL = direction === 'rtl';

  // Fetch destinations
  const { data: dbDestinations, isLoading: loadingDestinations } = useQuery({
    queryKey: ['hero-destinations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_destinations')
        .select('*')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return data as HeroDestination[];
    },
  });

  // Fetch settings
  const { data: dbSettings } = useQuery({
    queryKey: ['hero-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('hero_settings')
        .select('key, value, value_en')
        .eq('is_active', true);
      if (error) throw error;
      return data as HeroSetting[];
    },
  });

  // Create settings map
  const settings: Record<string, { ar: string; en: string }> = {};
  dbSettings?.forEach(s => {
    settings[s.key] = { ar: s.value, en: s.value_en || s.value };
  });

  const getSetting = (key: string, fallbackAr: string, fallbackEn?: string) => {
    const s = settings[key];
    if (!s) return isRTL ? fallbackAr : (fallbackEn || fallbackAr);
    return isRTL ? s.ar : s.en;
  };

  const heroBg = settings['background_image']?.ar || heroBgFallback;
  const destinations = (dbDestinations && dbDestinations.length > 0) ? dbDestinations : fallbackDestinations;

  // Auto-cycle visible destinations (show 6 at a time)
  const visibleCount = 6;
  useEffect(() => {
    if (destinations.length <= visibleCount) return;
    const timer = setInterval(() => {
      setVisibleStart(prev => (prev + visibleCount) % destinations.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [destinations.length]);

  const visibleDestinations = destinations.slice(visibleStart, visibleStart + visibleCount);
  // Wrap around if needed
  const remaining = visibleCount - visibleDestinations.length;
  const displayDestinations = remaining > 0
    ? [...visibleDestinations, ...destinations.slice(0, remaining)]
    : visibleDestinations;

  const getDisplayName = (dest: HeroDestination) =>
    isRTL ? dest.name : (dest.name_en || dest.country_en || countryNamesEn[dest.country] || dest.country);

  const getLargeFlagUrl = (flagUrl: string) => flagUrl.replace('/w80/', '/w160/');

  return (
    <section className="relative min-h-[90vh] overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <img src={heroBg} alt="Travel destinations" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
      </div>

      <div className="container-section relative z-10 flex flex-col min-h-[90vh] py-8">
        <div className="flex-1 flex flex-col lg:flex-row items-center gap-8 lg:gap-12 pt-8">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                <Plane className="h-3 w-3 ml-1" />
                {getSetting('badge_text', 'عطلات رحلاتكم للسياحة والسفر', 'Otolat Rahlatcom Travel & Tourism')}
              </Badge>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground leading-tight">
                {getSetting('main_title_line1', 'رحلتك تبدأ', 'Your Journey')}
                <span className="block text-primary mt-2">
                  {getSetting('main_title_line2', 'من هنا', 'Starts Here')}
                </span>
              </h1>

              <p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
                {getSetting('description',
                  'نقدم لك خدمات التأشيرات والسفر بأعلى جودة وأفضل الأسعار. احصل على تأشيرتك بكل سهولة ويسر مع فريقنا المتخصص.',
                  'We offer you visa and travel services with the highest quality and best prices. Get your visa easily with our specialized team.'
                )}
              </p>

              {/* Search Box */}
              <div className="mt-8 max-w-lg mx-auto lg:mx-0">
                <div className="flex gap-2 bg-card rounded-xl p-2 shadow-lg border border-border/50">
                  <div className="relative flex-1">
                    <Search className="absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder={getSetting('search_placeholder', 'ابحث عن وجهتك...', 'Search your destination...')}
                      className="border-0 ps-10 bg-transparent focus-visible:ring-0 h-12"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button asChild size="lg" className="h-12 px-6 rounded-lg">
                    <Link to="/destinations">
                      {getSetting('search_button', 'ابحث الآن', 'Search Now')}
                      <ArrowLeft className="h-4 w-4 mr-2" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Trust Indicators */}
              <div className="mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2 bg-card/50 px-4 py-2 rounded-full border border-border/50">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span>
                    {getSetting('stat_success_rate', '98%', '98%')} {getSetting('stat_success_label', 'نسبة النجاح', 'Success Rate')}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-card/50 px-4 py-2 rounded-full border border-border/50">
                  <Shield className="h-4 w-4 text-primary" />
                  <span>
                    {getSetting('stat_countries', '+50', '+50')} {getSetting('stat_countries_label', 'دولة', 'Countries')}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-card/50 px-4 py-2 rounded-full border border-border/50">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{getSetting('stat_support', 'دعم متواصل', '24/7 Support')}</span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Content - Destinations Showcase */}
          <div className="flex-1 w-full max-w-lg lg:max-w-xl">
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="bg-card/80 backdrop-blur-sm rounded-2xl border border-border/50 shadow-2xl p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">
                      {isRTL ? 'وجهاتنا المميزة' : 'Featured Destinations'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? 'تأشيرات لأكثر من 50 دولة' : 'Visas for 50+ countries'}
                    </p>
                  </div>
                </div>

                {/* Destinations Grid */}
                {loadingDestinations ? (
                  <div className="flex items-center justify-center h-48">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {displayDestinations.map((dest, index) => (
                      <motion.div
                        key={`${dest.id}-${visibleStart}-${index}`}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Link
                          to="/destinations"
                          className="group block bg-background hover:bg-primary/5 border border-border/50 hover:border-primary/30 rounded-xl p-3 text-center transition-all"
                        >
                          <div className="overflow-hidden rounded-lg mb-2 mx-auto w-full aspect-[3/2]">
                            <img
                              src={getLargeFlagUrl(dest.image_url)}
                              alt={getDisplayName(dest)}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                            />
                          </div>
                          <p className="text-xs font-medium text-foreground truncate">
                            {getDisplayName(dest)}
                          </p>
                          <p className="text-xs text-muted-foreground">{dest.country}</p>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Footer stats */}
                <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between">
                  <div className="text-center">
                    <p className="text-lg font-bold text-primary">
                      {getSetting('card_visas_count', '+10,000', '+10,000')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getSetting('card_visas_label', 'تأشيرة مُنجزة', 'Visas Completed')}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-green-600">
                      {getSetting('card_processing_time', '5 أيام', '5 Days')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getSetting('card_processing_label', 'متوسط المعالجة', 'Avg. Processing')}
                    </p>
                  </div>
                  <div className="h-8 w-px bg-border" />
                  <div className="text-center">
                    <p className="text-lg font-bold text-foreground">
                      {destinations.length}+
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isRTL ? 'وجهة' : 'Destinations'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
