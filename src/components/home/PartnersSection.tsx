import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import { Building2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePartners, usePartnersSectionSettings } from '@/hooks/usePartners';

export default function PartnersSection() {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';
  const { data: partners = [] } = usePartners(false);
  const { data: settings } = usePartnersSectionSettings();

  if (settings && settings.enabled === false) return null;
  if (!partners.length) return null;

  return (
    <section className="py-20 bg-cream/40 border-y border-border/50">
      <div className="container-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <p className="font-jakarta text-xs font-bold tracking-[0.25em] uppercase text-brand mb-3">
            {isRTL ? (settings?.eyebrow_ar ?? 'شركاؤنا في النجاح') : (settings?.eyebrow_en ?? 'Our partners')}
          </p>
          <h3 className="font-heading-ar text-2xl md:text-3xl font-extrabold text-navy">
            {isRTL ? (settings?.title_ar ?? 'موثوق من قبل أفضل الشركات') : (settings?.title_en ?? 'Trusted by leading companies')}
          </h3>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {partners.map((p, i) => {
            const Icon = (p.icon_name && (LucideIcons as any)[p.icon_name]) || Building2;
            const label = isRTL ? p.name : (p.name_en || p.name);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4 }}
                className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center justify-center gap-3 hover:border-brand/30 hover:shadow-xl hover:shadow-navy/5 transition-all group"
              >
                <div className="w-12 h-12 rounded-2xl bg-cream group-hover:bg-brand/10 flex items-center justify-center text-navy group-hover:text-brand transition-colors overflow-hidden">
                  {p.logo_url ? (
                    <img src={p.logo_url} alt={label} className="w-full h-full object-contain" loading="lazy" />
                  ) : (
                    <Icon className="h-6 w-6" strokeWidth={1.5} />
                  )}
                </div>
                <span className="font-heading-ar font-bold text-sm text-navy text-center">{label}</span>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}