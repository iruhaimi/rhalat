import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import SARSymbol from '@/components/ui/SARSymbol';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  SCHENGEN_INFO,
  filterOutSchengenCountries,
  getSchengenCountries,
} from '@/lib/schengenCountries';
import { getSharpFlagUrl } from '@/lib/flagUtils';
import type { Country, VisaType } from '@/types/database';

interface CountriesSectionProps {
  countries: Country[];
  visaTypes: VisaType[];
  t: (key: string) => string;
}

interface DisplayItem {
  id: string;
  name: string;
  code: string;
  flagUrl: string;
  minPrice: number | null;
  processingDays: number | null;
  href: string;
  applyHref: string;
  visaCount: number;
  isSchengen?: boolean;
}

export default function CountriesSection({ countries, visaTypes, t }: CountriesSectionProps) {
  const { direction } = useLanguage();
  const ArrowIcon = direction === 'rtl' ? ArrowLeft : ArrowRight;
  const getCountryMinPrice = (countryId: string) => {
    const v = visaTypes.filter(x => x.country_id === countryId);
    return v.length ? Math.min(...v.map(x => x.price)) : null;
  };
  const getCountryProcessingDays = (countryId: string) => {
    const v = visaTypes.filter(x => x.country_id === countryId);
    return v.length ? Math.min(...v.map(x => x.processing_days)) : null;
  };
  const getVisaTypesCount = (countryId: string) =>
    visaTypes.filter(x => x.country_id === countryId).length;

  const schengenCountries = useMemo(() => getSchengenCountries(countries), [countries]);
  const nonSchengenCountries = useMemo(() => filterOutSchengenCountries(countries), [countries]);

  const schengenMinPrice = useMemo(() => {
    const prices = schengenCountries.map(c => getCountryMinPrice(c.id)).filter((p): p is number => p !== null);
    return prices.length ? Math.min(...prices) : null;
  }, [schengenCountries, visaTypes]);

  const schengenProcessingDays = useMemo(() => {
    const days = schengenCountries.map(c => getCountryProcessingDays(c.id)).filter((d): d is number => d !== null);
    return days.length ? Math.min(...days) : null;
  }, [schengenCountries, visaTypes]);

  const items: DisplayItem[] = [];
  if (schengenCountries.length > 0) {
    items.push({
      id: 'schengen',
      name: SCHENGEN_INFO.name,
      code: 'SCHENGEN',
      flagUrl: SCHENGEN_INFO.flag_url,
      minPrice: schengenMinPrice,
      processingDays: schengenProcessingDays,
      href: '/country/SCHENGEN',
      applyHref: '/apply?country=SCHENGEN',
      visaCount: schengenCountries.reduce((s, c) => s + getVisaTypesCount(c.id), 0),
      isSchengen: true,
    });
  }
  nonSchengenCountries.slice(0, schengenCountries.length > 0 ? 9 : 10).forEach(c => {
    items.push({
      id: c.id,
      name: c.name,
      code: c.code,
      flagUrl: getSharpFlagUrl(c),
      minPrice: getCountryMinPrice(c.id),
      processingDays: getCountryProcessingDays(c.id),
      href: `/country/${c.code}`,
      applyHref: `/apply?country=${c.code}`,
      visaCount: getVisaTypesCount(c.id),
    });
  });

  return (
    <section className="py-24 bg-canvas">
      <div className="container-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-14"
        >
          <div className="max-w-xl">
            <span className="font-jakarta text-xs font-bold tracking-[0.25em] uppercase text-brand mb-3 block">
              {t('countries.title') || 'وجهاتنا المميزة'}
            </span>
            <h2 className="font-heading-ar text-4xl md:text-5xl font-extrabold text-navy mb-4 leading-tight">
              {t('countries.title')}
            </h2>
            <p className="font-body-ar text-base text-muted-foreground leading-relaxed">
              {t('countries.subtitle')}
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-2xl h-12 px-6 border-border hover:bg-brand hover:text-brand-foreground hover:border-brand">
            <Link to="/destinations" className="font-jakarta font-bold">
              {direction === 'rtl' ? 'عرض كافة الدول' : 'View all countries'}
              <ArrowLeft className="h-4 w-4 ms-1 rtl-flip" />
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
        >
          {items.map(item => (
            <motion.div
              key={item.id}
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              whileHover={{ y: -4, transition: { duration: 0.3 } }}
              className="group relative overflow-hidden rounded-2xl bg-card border border-border hover:shadow-xl hover:shadow-navy/5 hover:border-brand/30 transition-all duration-300"
            >
              <div className="relative h-28 overflow-hidden bg-gradient-to-br from-navy/5 to-brand/10">
                <img
                  src={item.flagUrl}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover image-render-auto transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 " />
                <div className="absolute top-2 end-2 flex items-center gap-2">
                  {item.processingDays && (
                    <Badge className="bg-navy/90 backdrop-blur-md text-white border-0 rounded-lg px-2 py-0.5 font-jakarta text-[10px] font-bold gap-1">
                      <Clock className="h-3 w-3" />
                      {item.processingDays} {direction === 'rtl' ? 'أيام' : 'days'}
                    </Badge>
                  )}
                </div>
                {!item.isSchengen && item.visaCount > 0 && (
                  <Badge className="absolute top-2 start-2 bg-white/95 text-navy backdrop-blur-md rounded-lg px-2 py-0.5 font-jakarta text-[10px] font-bold">
                    {item.visaCount} {direction === 'rtl' ? 'تأشيرة' : 'visas'}
                  </Badge>
                )}
              </div>
              <div className="p-3">
                <h3 className="font-heading-ar text-base font-extrabold text-navy mb-1.5 truncate">{item.name}</h3>

                {item.minPrice ? (
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="font-jakarta text-[10px] font-bold tracking-wider uppercase text-muted-foreground">{direction === 'rtl' ? 'يبدأ من' : 'From'}</span>
                    <span className="font-numeric text-lg font-extrabold tabular-nums text-brand flex items-center gap-1">
                      {item.minPrice}
                      <SARSymbol size="xs" className="text-brand" />
                    </span>
                  </div>
                ) : (
                  <div className="mb-2 text-xs text-muted-foreground">{direction === 'rtl' ? 'حسب الطلب' : 'On request'}</div>
                )}

                <div className="flex gap-1.5">
                  <Button variant="outline" size="sm" className="flex-1 rounded-xl h-8 text-xs border-border" asChild>
                    <Link to={item.href}>{direction === 'rtl' ? 'التفاصيل' : 'Details'}</Link>
                  </Button>
                  <Button size="sm" className="flex-1 rounded-xl h-8 text-xs gap-1 bg-navy hover:bg-navy/90 text-navy-foreground" asChild>
                    <Link to={item.applyHref}>
                      {direction === 'rtl' ? 'ابدأ الطلب' : 'Apply now'}
                      <ArrowIcon className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}