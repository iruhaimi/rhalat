import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, Globe, Sparkles, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface HeroDestination {
  id: string;
  name: string;
  name_en: string | null;
  country: string;
  country_en: string | null;
  image_url: string;
  link_url: string | null;
  display_order: number;
}

interface HeroSetting {
  key: string;
  value: string;
  value_en: string | null;
}

const fallbackDestinations: HeroDestination[] = [
  { id: '1', name: 'فرنسا', name_en: 'France', country: 'FR', country_en: 'France', image_url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80', link_url: null, display_order: 1 },
  { id: '2', name: 'تركيا', name_en: 'Turkey', country: 'TR', country_en: 'Turkey', image_url: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800&q=80', link_url: null, display_order: 2 },
  { id: '3', name: 'اليابان', name_en: 'Japan', country: 'JP', country_en: 'Japan', image_url: 'https://images.unsplash.com/photo-1492571350019-22de08371fd3?w=800&q=80', link_url: null, display_order: 3 },
];

export default function HeroSection() {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';
  const [searchQuery, setSearchQuery] = useState('');

  const { data: dbDestinations } = useQuery({
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

  const settings: Record<string, { ar: string; en: string }> = {};
  dbSettings?.forEach(s => {
    settings[s.key] = { ar: s.value, en: s.value_en || s.value };
  });

  const getSetting = (key: string, fallbackAr: string, fallbackEn?: string) => {
    const s = settings[key];
    if (!s) return isRTL ? fallbackAr : (fallbackEn || fallbackAr);
    return isRTL ? s.ar : s.en;
  };

  const destinations = (dbDestinations && dbDestinations.length > 0)
    ? dbDestinations.slice(0, 3)
    : fallbackDestinations;

  const featuredDestination = destinations[0] ?? fallbackDestinations[0];

  return (
    <section className="relative bg-canvas pt-10 pb-16 md:pt-14 md:pb-24 overflow-hidden">
      {/* Soft brand glow */}
      <div className="pointer-events-none absolute -top-40 -start-40 h-[480px] w-[480px] rounded-full bg-brand/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 -end-40 h-[420px] w-[420px] rounded-full bg-navy/5 blur-[100px]" />

      <div className="container-section relative">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5"
        >
          {/* Main Brand Tile */}
          <div className="md:col-span-8 bg-card border border-border rounded-5xl p-8 md:p-12 relative overflow-hidden flex flex-col justify-center min-h-[460px]">
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand/10 text-brand text-xs font-bold mb-8 font-jakarta">
                <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
                {getSetting('badge_text', 'خبير التأشيرات الأول في المملكة', 'Saudi Arabia’s leading visa expert')}
              </span>

              <h1 className="font-heading-ar text-5xl sm:text-6xl md:text-7xl font-extrabold leading-[1.1] tracking-tight text-navy mb-8">
                {getSetting('main_title_line1', 'رحلتك تبدأ', 'Your journey starts')}
                <span className="block text-brand mt-2">
                  {getSetting('main_title_line2', 'بلمسة واحدة', 'with one tap')}
                </span>
              </h1>

              <p className="font-body-ar text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed mb-10">
                {getSetting('description',
                  'نقدم لك خدمات التأشيرات والسفر بأعلى جودة وأفضل الأسعار. احصل على تأشيرتك بكل سهولة ويسر مع فريقنا المتخصص.',
                  'We offer visa and travel services with the highest quality and best prices. Get your visa with ease.'
                )}
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute start-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={getSetting('search_placeholder', 'أين وجهتك القادمة؟', 'Where to next?')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-14 ps-12 bg-canvas border-border rounded-2xl text-base focus-visible:ring-4 focus-visible:ring-brand/15"
                  />
                </div>
                <Button asChild size="lg" className="h-14 px-8 rounded-2xl bg-navy hover:bg-navy/90 text-navy-foreground font-bold text-base shadow-lg shadow-navy/10">
                  <Link to="/destinations">
                    {getSetting('search_button', 'ابحث الآن', 'Search now')}
                    <ArrowLeft className="h-4 w-4 ms-1 rtl-flip" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="absolute -bottom-24 -end-24 w-96 h-96 bg-brand/5 rounded-full blur-[100px]" />
          </div>

          {/* Processing Speed Tile */}
          <div className="md:col-span-4 bg-navy text-navy-foreground rounded-5xl p-8 md:p-10 flex flex-col justify-between relative overflow-hidden min-h-[280px] md:min-h-[460px]">
            <div className="relative z-10">
              <p className="font-jakarta text-xs uppercase tracking-[0.2em] opacity-60 mb-3">
                {isRTL ? 'متوسط سرعة المعالجة' : 'Average processing'}
              </p>
              <div className="flex items-baseline gap-3 mb-6">
                <span className="font-display text-7xl md:text-8xl font-bold tracking-tighter leading-none">
                  {getSetting('card_processing_time_value', '05', '05')}
                </span>
                <span className="font-heading-ar text-xl md:text-2xl font-bold opacity-80">
                  {isRTL ? 'أيام' : 'days'}
                </span>
              </div>
              <p className="font-body-ar text-sm opacity-75 leading-relaxed max-w-[260px]">
                {isRTL
                  ? 'نلتزم بتقديم أسرع خدمة إصدار تأشيرات في المنطقة بضمان كامل.'
                  : 'The fastest visa processing in the region — guaranteed.'}
              </p>
            </div>

            <div className="relative z-10 pt-6 border-t border-white/10">
              <div className="flex -space-x-3 rtl:space-x-reverse mb-3">
                <div className="w-10 h-10 rounded-full border-2 border-navy bg-brand flex items-center justify-center text-[10px] font-display font-bold">+10k</div>
                <div className="w-10 h-10 rounded-full border-2 border-navy bg-cream" />
                <div className="w-10 h-10 rounded-full border-2 border-navy bg-cream/70" />
                <div className="w-10 h-10 rounded-full border-2 border-navy bg-cream/50" />
              </div>
              <p className="font-jakarta text-xs font-bold opacity-90">
                {isRTL ? 'أكثر من 10,000 عميل سعيد' : '10,000+ happy travelers'}
              </p>
            </div>

            <div className="absolute -top-8 -end-8 w-40 h-40 bg-brand/20 rounded-full blur-3xl" />
          </div>

          {/* Success rate tile */}
          <div className="md:col-span-3 bg-cream rounded-5xl p-8 flex flex-col justify-center items-center text-center min-h-[200px]">
            <ShieldCheck className="h-7 w-7 text-brand mb-3" strokeWidth={1.75} />
            <div className="font-display text-5xl md:text-6xl font-bold text-brand leading-none mb-2">
              {getSetting('stat_success_rate', '98%', '98%')}
            </div>
            <h4 className="font-heading-ar font-extrabold text-navy">
              {isRTL ? 'نسبة النجاح' : 'Success rate'}
            </h4>
            <p className="font-body-ar text-xs text-navy/60 mt-2 max-w-[180px]">
              {isRTL ? 'أعلى معدل قبول للتأشيرات في السوق' : 'Highest approval rate in the market'}
            </p>
          </div>

          {/* Featured destination tile */}
          <div className="md:col-span-6 rounded-5xl relative overflow-hidden group min-h-[220px] md:min-h-[260px]">
            <img
              src={featuredDestination.image_url}
              alt={isRTL ? featuredDestination.name : (featuredDestination.name_en || featuredDestination.name)}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://flagcdn.com/w2560/${featuredDestination.country.toLowerCase()}.jpg`;
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy via-navy/40 to-transparent" />
            <div className="absolute bottom-8 start-8 end-8 text-white">
              <p className="font-jakarta text-[10px] font-bold tracking-[0.3em] uppercase opacity-80 mb-2">
                <Sparkles className="inline h-3 w-3 me-1" />
                {isRTL ? 'الوجهة الأكثر طلباً' : 'Most requested destination'}
              </p>
              <h3 className="font-heading-ar text-2xl md:text-3xl font-bold">
                {isRTL ? featuredDestination.name : (featuredDestination.name_en || featuredDestination.name)}
              </h3>
            </div>
            <Link to="/destinations" className="absolute inset-0" aria-label="View destinations" />
          </div>

          {/* Countries counter tile */}
          <div className="md:col-span-3 bg-card border border-border rounded-5xl p-8 flex flex-col justify-center items-center text-center min-h-[200px]">
            <div className="w-14 h-14 rounded-2xl bg-brand/10 flex items-center justify-center mb-4">
              <Globe className="h-7 w-7 text-brand" strokeWidth={1.5} />
            </div>
            <div className="font-display text-4xl md:text-5xl font-bold text-navy leading-none">
              {getSetting('stat_countries', '+50', '+50')}
            </div>
            <p className="font-heading-ar font-bold text-navy mt-2">
              {isRTL ? 'دولة حول العالم' : 'Countries worldwide'}
            </p>
            <p className="font-body-ar text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {isRTL ? 'دعم متواصل 24/7' : '24/7 support'}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}