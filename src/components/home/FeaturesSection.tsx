import { motion } from 'framer-motion';
import { Headphones, Clock, Users, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface FeaturesSectionProps {
  t: (key: string) => string;
}

export default function FeaturesSection({ t }: FeaturesSectionProps) {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';

  const features = [
    { icon: Headphones, title: t('features.support'), desc: t('features.supportDesc') },
    { icon: Clock, title: t('features.tracking'), desc: t('features.trackingDesc') },
    { icon: Users, title: t('features.experts'), desc: t('features.expertsDesc') },
    { icon: Shield, title: t('features.transparent'), desc: t('features.transparentDesc') },
  ];

  return (
    <section className="py-28 bg-canvas">
      <div className="container-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="font-jakarta text-xs font-bold tracking-[0.25em] uppercase text-brand mb-3 block">
            {isRTL ? 'لماذا نحن' : 'Why us'}
          </span>
          <h2 className="font-heading-ar text-4xl md:text-5xl font-extrabold text-navy mb-4">
            {t('features.title')}
          </h2>
          <p className="font-body-ar text-base text-muted-foreground leading-relaxed">
            {t('features.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -6 }}
              className="bg-card border border-border rounded-4xl p-8 hover:border-brand/30 hover:shadow-2xl hover:shadow-navy/5 transition-all group"
            >
              <div className="w-14 h-14 rounded-2xl bg-brand/10 group-hover:bg-brand group-hover:text-brand-foreground text-brand flex items-center justify-center mb-6 transition-colors">
                <f.icon className="h-7 w-7" strokeWidth={1.5} />
              </div>
              <h3 className="font-heading-ar text-lg font-extrabold text-navy mb-3">{f.title}</h3>
              <p className="font-body-ar text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}