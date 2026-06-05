import { motion } from 'framer-motion';
import { Building2, Plane, Landmark, Factory, Smartphone, Wifi } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const partners = [
  { name: 'الخطوط السعودية', icon: Plane },
  { name: 'بنك الراجحي', icon: Landmark },
  { name: 'أرامكو السعودية', icon: Factory },
  { name: 'سابك', icon: Building2 },
  { name: 'الاتصالات السعودية', icon: Smartphone },
  { name: 'موبايلي', icon: Wifi },
];

export default function PartnersSection() {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';

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
            {isRTL ? 'شركاؤنا في النجاح' : 'Our partners'}
          </p>
          <h3 className="font-heading-ar text-2xl md:text-3xl font-extrabold text-navy">
            {isRTL ? 'موثوق من قبل أفضل الشركات' : 'Trusted by leading companies'}
          </h3>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {partners.map((p, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center justify-center gap-3 hover:border-brand/30 hover:shadow-xl hover:shadow-navy/5 transition-all group"
            >
              <div className="w-12 h-12 rounded-2xl bg-cream group-hover:bg-brand/10 flex items-center justify-center text-navy group-hover:text-brand transition-colors">
                <p.icon className="h-6 w-6" strokeWidth={1.5} />
              </div>
              <span className="font-heading-ar font-bold text-sm text-navy text-center">{p.name}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}