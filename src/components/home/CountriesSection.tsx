import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SARSymbol from '@/components/ui/SARSymbol';
import {
  SCHENGEN_INFO,
  filterOutSchengenCountries,
  getSchengenCountries,
} from '@/lib/schengenCountries';
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
  region?: string;
}

export default function CountriesSection({ countries, visaTypes, t }: CountriesSectionProps) {
  const getCountryMinPrice = (countryId: string) => {
    const v = visaTypes.filter(x => x.country_id === countryId);
    return v.length ? Math.min(...v.map(x => x.price)) : null;
  };
  const getCountryProcessingDays = (countryId: string) => {
    const v = visaTypes.filter(x => x.country_id === countryId);
    return v.length ? Math.min(...v.map(x => x.processing_days)) : null;
  };

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
      region: 'أوروبا',
    });
  }
  nonSchengenCountries.slice(0, schengenCountries.length > 0 ? 7 : 8).forEach(c => {
    items.push({
      id: c.id,
      name: c.name,
      code: c.code,
              flagUrl: c.flag_url || `https://flagcdn.com/w2560/${c.code.toLowerCase()}.png`,
      minPrice: getCountryMinPrice(c.id),
      processingDays: getCountryProcessingDays(c.id),
      href: `/country/${c.code}`,
      applyHref: `/apply?country=${c.code}`,
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
              عرض كافة الدول
              <ArrowLeft className="h-4 w-4 ms-1 rtl-flip" />
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {items.map(item => (
            <motion.div
              key={item.id}
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              whileHover={{ y: -6 }}
              className="group bg-card border border-border rounded-4xl overflow-hidden hover:shadow-2xl hover:shadow-navy/5 hover:border-brand/30 transition-all"
            >
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-navy/5 to-brand/10">
                <img
                  src={item.flagUrl}
                  alt={item.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover saturate-[1.8] contrast-125 brightness-105 group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 " />
                {item.region && (
                  <span className="absolute top-4 end-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl text-[10px] font-jakarta font-bold text-navy uppercase tracking-wider">
                    {item.region}
                  </span>
                )}
                {item.processingDays && (
                  <span className="absolute top-4 start-4 bg-navy/90 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-[10px] font-jakarta font-bold flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {item.processingDays} أيام
                  </span>
                )}
              </div>
              <div className="p-6">
                <h3 className="font-heading-ar font-extrabold text-xl text-navy mb-1">{item.name}</h3>
                <p className="font-body-ar text-xs text-muted-foreground mb-5">تأشيرة سياحية / أعمال</p>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="font-jakarta text-[10px] font-bold tracking-wider uppercase text-muted-foreground mb-1">تبدأ من</p>
                    {item.minPrice ? (
                      <div className="flex items-baseline gap-1">
                        <span className="font-display text-2xl font-bold text-brand">{item.minPrice}</span>
                        <SARSymbol size="sm" className="text-brand" />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">حسب الطلب</span>
                    )}
                  </div>
                  <Button asChild size="sm" className="rounded-xl bg-navy hover:bg-navy/90 text-navy-foreground font-bold h-10 px-4">
                    <Link to={item.applyHref}>
                      قدّم الآن
                    </Link>
                  </Button>
                </div>

                <Link to={item.href} className="block mt-4 text-center font-jakarta text-xs font-bold text-brand hover:underline">
                  عرض التفاصيل ←
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}