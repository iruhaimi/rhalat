import { useState, useEffect, useMemo } from 'react';
import SEO from '@/components/seo/SEO';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Clock, 
  ArrowLeft,
  ArrowRight,
  X,
  Globe,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import SARSymbol from '@/components/ui/SARSymbol';
import { 
  SCHENGEN_INFO, 
  filterOutSchengenCountries, 
  getSchengenCountries,
  isSchengenCountry 
} from '@/lib/schengenCountries';
import type { Country, VisaType } from '@/types/database';

export default function Destinations() {
  const { t, direction } = useLanguage();
  const [searchParams] = useSearchParams();
  const [countries, setCountries] = useState<Country[]>([]);
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSchengenCountries, setShowSchengenCountries] = useState(false);

  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;

  useEffect(() => {
    async function fetchData() {
      const [countriesRes, visaTypesRes] = await Promise.all([
        supabase.from('countries').select('*').eq('is_active', true).order('name'),
        supabase.from('visa_types').select('*').eq('is_active', true),
      ]);

      if (!countriesRes.error && countriesRes.data) {
        setCountries(countriesRes.data as Country[]);
      }
      if (!visaTypesRes.error && visaTypesRes.data) {
        setVisaTypes(visaTypesRes.data as VisaType[]);
      }
      setIsLoading(false);
    }

    fetchData();
  }, []);

  const getCountryMinPrice = (countryId: string) => {
    const countryVisas = visaTypes.filter(v => v.country_id === countryId);
    if (countryVisas.length === 0) return null;
    return Math.min(...countryVisas.map(v => v.price));
  };

  const getCountryProcessingDays = (countryId: string) => {
    const countryVisas = visaTypes.filter(v => v.country_id === countryId);
    if (countryVisas.length === 0) return null;
    return Math.min(...countryVisas.map(v => v.processing_days));
  };

  const getVisaTypesCount = (countryId: string) => {
    return visaTypes.filter(v => v.country_id === countryId).length;
  };

  // Get Schengen countries and their aggregated info
  const schengenCountries = useMemo(() => getSchengenCountries(countries), [countries]);
  
  const schengenMinPrice = useMemo(() => {
    const prices = schengenCountries
      .map(c => getCountryMinPrice(c.id))
      .filter((p): p is number => p !== null);
    return prices.length > 0 ? Math.min(...prices) : null;
  }, [schengenCountries, visaTypes]);

  const schengenProcessingDays = useMemo(() => {
    const days = schengenCountries
      .map(c => getCountryProcessingDays(c.id))
      .filter((d): d is number => d !== null);
    return days.length > 0 ? Math.min(...days) : null;
  }, [schengenCountries, visaTypes]);

  const schengenVisaCount = useMemo(() => {
    return schengenCountries.reduce((total, c) => total + getVisaTypesCount(c.id), 0);
  }, [schengenCountries, visaTypes]);

  // Filter out Schengen countries from main list
  const nonSchengenCountries = useMemo(() => filterOutSchengenCountries(countries), [countries]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery) return nonSchengenCountries;
    
    const query = searchQuery.toLowerCase();
    return nonSchengenCountries.filter((country) => {
      return country.name.toLowerCase().includes(query) || 
             country.code.toLowerCase().includes(query);
    });
  }, [nonSchengenCountries, searchQuery]);

  // Check if Schengen should appear in search results
  const showSchengenInSearch = useMemo(() => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return SCHENGEN_INFO.name.toLowerCase().includes(query) || 
           'شنغن'.includes(query) ||
           'schengen'.includes(query) ||
           'eu'.includes(query) ||
           schengenCountries.some(c => 
             c.name.toLowerCase().includes(query) || 
             c.code.toLowerCase().includes(query)
           );
  }, [searchQuery, schengenCountries]);

  const totalDestinations = filteredCountries.length + (showSchengenInSearch && schengenCountries.length > 0 ? 1 : 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO title="الوجهات والدول — عطلات رحلاتكم" description="تصفح جميع الدول وأنواع التأشيرات المتاحة مع رسوم وتفاصيل التقديم لكل وجهة." path="/destinations" />
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/85 py-20 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute -top-32 -right-32 w-64 h-64 bg-white/5 rounded-full"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute -bottom-20 -left-20 w-48 h-48 bg-white/5 rounded-full"
          />
        </div>

        <div className="container-section relative">
          <motion.div 
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-6"
            >
              <Globe className="w-10 h-10 text-white" />
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-4">
              {t('countries.title')}
            </h1>
            <p className="text-lg text-white/80 mb-8">
              {t('countries.subtitle')}
            </p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-lg mx-auto"
            >
              <div className="flex gap-2 bg-white rounded-2xl p-2 shadow-2xl">
                <div className="relative flex-1">
                  <Search className="absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t('hero.searchPlaceholder')}
                    className="border-0 ps-12 py-6 text-base focus-visible:ring-0 rounded-xl"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Button size="lg" className="rounded-xl px-6">
                  <Search className="h-5 w-5" />
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Countries Grid */}
      <section className="py-16">
        <div className="container-section">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <p className="text-muted-foreground">
                <span className="font-semibold text-foreground">{totalDestinations}</span> وجهة متاحة
              </p>
            </div>
            {searchQuery && (
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')} className="gap-2">
                <X className="h-4 w-4" />
                مسح البحث
              </Button>
            )}
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border bg-card">
                  <Skeleton className="h-32 w-full" />
                  <div className="p-4 space-y-3">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : totalDestinations === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                <Search className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">لا توجد نتائج</h3>
              <p className="text-muted-foreground">جرب البحث بكلمة أخرى</p>
            </motion.div>
          ) : (
            <motion.div 
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence mode="popLayout">
                {/* Schengen Card - Same design as regular country cards */}
                {showSchengenInSearch && schengenCountries.length > 0 && (
                  <motion.div
                    key="schengen"
                    variants={itemVariants}
                    layout
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                    className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300"
                  >
                    {/* Flag Background */}
                    <div className="relative h-36 overflow-hidden">
                      <img
                        src={SCHENGEN_INFO.flag_url}
                        alt={SCHENGEN_INFO.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                      
                      {/* Processing Days Badge */}
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        {schengenProcessingDays && (
                          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm gap-1">
                            <Clock className="h-3 w-3" />
                            {schengenProcessingDays} أيام
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-xl font-bold mb-3">{SCHENGEN_INFO.name}</h3>
                      
                      {schengenMinPrice && (
                        <div className="flex items-baseline gap-2 mb-4">
                          <span className="text-xs text-muted-foreground">يبدأ من</span>
                          <span className="text-2xl font-bold text-primary flex items-center gap-1">
                            {schengenMinPrice}
                            <SARSymbol size="sm" className="text-primary" />
                          </span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 rounded-xl" asChild>
                          <Link to="/country/SCHENGEN">
                            التفاصيل
                          </Link>
                        </Button>
                        <Button size="sm" className="flex-1 rounded-xl gap-1" asChild>
                          <Link to="/apply?country=SCHENGEN">
                            قدّم الآن
                            <ArrowIcon className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Regular Countries */}
                {filteredCountries.map((country) => {
                  const minPrice = getCountryMinPrice(country.id);
                  const processingDays = getCountryProcessingDays(country.id);
                  const visaCount = getVisaTypesCount(country.id);
                  
                  return (
                    <motion.div
                      key={country.id}
                      variants={itemVariants}
                      layout
                      whileHover={{ y: -8, transition: { duration: 0.3 } }}
                      className="group relative overflow-hidden rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300"
                    >
                      {/* Flag Background */}
                      <div className="relative h-36 overflow-hidden">
                        <img
                          src={country.flag_url || `https://flagcdn.com/w320/${country.code.toLowerCase()}.png`}
                          alt={country.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                        
                        {/* Badges */}
                        <div className="absolute top-3 right-3 flex items-center gap-2">
                          {processingDays && (
                            <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm gap-1">
                              <Clock className="h-3 w-3" />
                              {processingDays} أيام
                            </Badge>
                          )}
                        </div>
                        
                        {visaCount > 0 && (
                          <Badge className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm">
                            {visaCount} نوع تأشيرة
                          </Badge>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5">
                        <h3 className="text-xl font-bold mb-3">{country.name}</h3>
                        
                        {minPrice && (
                          <div className="flex items-baseline gap-2 mb-4">
                            <span className="text-xs text-muted-foreground">يبدأ من</span>
                            <span className="text-2xl font-bold text-primary flex items-center gap-1">
                              {minPrice}
                              <SARSymbol size="sm" className="text-primary" />
                            </span>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1 rounded-xl" asChild>
                            <Link to={`/country/${country.code}`}>
                              التفاصيل
                            </Link>
                          </Button>
                          <Button size="sm" className="flex-1 rounded-xl gap-1" asChild>
                            <Link to={`/apply?country=${country.code}`}>
                              قدّم الآن
                              <ArrowIcon className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>
    </div>
  );
}
