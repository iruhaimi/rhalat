import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const testimonials = [
  {
    name: { ar: 'محمد القحطاني', en: 'Mohammed Al-Qahtani' },
    role: { ar: 'رجل أعمال', en: 'Businessman' },
    avatar: 'M',
    content: {
      ar: 'تجربة احترافية للغاية. جهزوا لي ملف طلب تأشيرة شنغن وراجعوا المستندات خلال 4 أيام عمل فقط. الوضوح والشفافية في التعامل كانت رائعة.',
      en: 'A very professional experience. They prepared my Schengen visa application file and reviewed the documents in just 4 business days. The clarity and transparency were excellent.',
    },
  },
  {
    name: { ar: 'سارة الأحمد', en: 'Sarah Al-Ahmad' },
    role: { ar: 'صانعة محتوى', en: 'Content Creator' },
    avatar: 'S',
    content: {
      ar: 'أفضل خدمة عملاء تعاملت معها. كانوا معي لحظة بلحظة في تجهيز طلب تأشيرة تركيا ومتابعته حتى صدور قرار الجهة الرسمية. شكراً عطلات رحلاتكم!',
      en: 'The best customer service I have dealt with. They were with me every step of the way preparing my Turkey visa application and following up until the official decision. Thank you Otolat Rahlatcom!',
    },
  },
];

export default function TestimonialsSection() {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';

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
            {isRTL ? 'آراء المسافرين' : 'Testimonials'}
          </span>
          <h2 className="font-heading-ar text-4xl md:text-5xl font-extrabold text-navy">
            {isRTL ? 'تجارب المسافرين معنا' : 'What travelers say about us'}
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative bg-card p-10 rounded-5xl border border-border hover:shadow-2xl hover:shadow-navy/5 hover:border-brand/20 transition-all overflow-hidden"
            >
              <Quote className="absolute top-8 end-8 h-20 w-20 text-brand/5" strokeWidth={1} />
              <div className="flex gap-1 mb-6 relative">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="h-5 w-5 fill-warning text-warning" />
                ))}
              </div>
              <p className="font-body-ar text-lg text-navy leading-relaxed mb-8 relative">
                "{isRTL ? t.content.ar : t.content.en}"
              </p>
              <div className="flex items-center gap-4 relative">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-brand to-navy flex items-center justify-center font-display text-2xl font-bold text-white">
                  {t.avatar}
                </div>
                <div>
                  <h5 className="font-heading-ar font-extrabold text-navy">{isRTL ? t.name.ar : t.name.en}</h5>
                  <p className="font-jakarta text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{isRTL ? t.role.ar : t.role.en}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}