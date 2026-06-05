import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

function AnimatedCounter({ value, suffix = '', duration = 1.6 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  useEffect(() => {
    if (!inView) return;
    let raf: number;
    let start: number;
    const tick = (t: number) => {
      if (!start) start = t;
      const p = Math.min((t - start) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setCount(Math.floor(eased * value));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, duration]);

  const fmt = (n: number) => (n >= 1000 ? `+${(n / 1000).toFixed(0)}k` : `${n}`);
  return <span ref={ref}>{fmt(count)}{suffix}</span>;
}

export default function StatsSection() {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';

  const stats = [
    { value: 10000, suffix: '', label: isRTL ? 'عميل سنوياً' : 'Clients yearly' },
    { value: 98, suffix: '%', label: isRTL ? 'معدل القبول' : 'Approval rate' },
    { value: 50, suffix: '+', label: isRTL ? 'دولة مدعومة' : 'Countries served' },
    { value: 24, suffix: '/7', label: isRTL ? 'دعم فني' : 'Live support' },
  ];

  return (
    <section className="bg-navy py-20 relative overflow-hidden">
      <div className="pointer-events-none absolute top-0 start-0 w-96 h-96 bg-brand/10 blur-[120px] rounded-full" />
      <div className="pointer-events-none absolute bottom-0 end-0 w-96 h-96 bg-brand/5 blur-[120px] rounded-full" />

      <div className="container-section relative">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          {stats.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`text-center ${i !== 0 ? 'md:border-s md:border-white/10' : ''}`}
            >
              <div className="font-display text-5xl md:text-6xl font-bold text-white mb-2 tracking-tight">
                <AnimatedCounter value={s.value} suffix={s.suffix} />
              </div>
              <p className="font-jakarta text-white/50 text-[11px] md:text-xs font-bold uppercase tracking-[0.2em]">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}