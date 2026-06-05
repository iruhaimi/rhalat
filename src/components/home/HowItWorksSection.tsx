import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

interface HowItWorksSectionProps {
  t: (key: string) => string;
}

export default function HowItWorksSection({ t }: HowItWorksSectionProps) {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';

  const steps = [
    {
      num: '01',
      title: t('howItWorks.step1.title') || (isRTL ? 'اختر وجهتك' : 'Choose destination'),
      desc: t('howItWorks.step1.desc') || (isRTL ? 'تصفح الدول والخدمات المتاحة واختر ما يناسب خطة سفرك.' : 'Browse destinations and pick the visa that fits your plan.'),
    },
    {
      num: '02',
      title: t('howItWorks.step2.title') || (isRTL ? 'ارفع مستنداتك' : 'Upload documents'),
      desc: t('howItWorks.step2.desc') || (isRTL ? 'ارفع الوثائق المطلوبة عبر لوحة تحكم آمنة ومشفرة بالكامل.' : 'Upload required documents securely through our encrypted dashboard.'),
    },
    {
      num: '03',
      title: t('howItWorks.step3.title') || (isRTL ? 'استلم تأشيرتك' : 'Receive your visa'),
      desc: t('howItWorks.step3.desc') || (isRTL ? 'سنعالج طلبك ونرسل التأشيرة إلكترونياً، خطوة بخطوة معك.' : 'We process and deliver — we’ll keep you posted at every step.'),
    },
  ];

  return (
    <section className="py-28 bg-cream/60 relative overflow-hidden">
      <div className="pointer-events-none absolute top-0 end-0 w-1/3 h-full bg-brand/5 blur-[120px] -translate-y-1/3" />
      <div className="container-section relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-2xl mx-auto mb-20"
        >
          <span className="font-jakarta text-xs font-bold tracking-[0.25em] uppercase text-brand mb-3 block">
            {isRTL ? 'كيف نعمل' : 'How it works'}
          </span>
          <h2 className="font-heading-ar text-4xl md:text-5xl font-extrabold text-navy mb-4">
            {t('howItWorks.title')}
          </h2>
          <p className="font-body-ar text-base text-muted-foreground leading-relaxed">
            {t('howItWorks.subtitle')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-10">
          {steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              className="relative group"
            >
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center font-display text-3xl font-bold mb-8 shadow-xl transition-transform group-hover:-rotate-6 ${
                i === 0
                  ? 'bg-brand text-brand-foreground shadow-brand/30'
                  : 'bg-card text-navy shadow-navy/5 border border-border'
              }`}>
                {step.num}
              </div>
              <h3 className="font-heading-ar text-2xl font-extrabold text-navy mb-3">{step.title}</h3>
              <p className="font-body-ar text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}