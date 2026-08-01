import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export default function MiniCTA() {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';

  return (
    <section className="py-10 bg-canvas">
      <div className="container-section">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-brand/15 bg-white/80 backdrop-blur-sm p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-3 text-center md:text-start">
            <div className="hidden md:flex h-10 w-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-heading-ar text-base md:text-lg font-extrabold text-ink">
                {isRTL ? 'وجدت الوجهة المناسبة؟ ابدأ طلب خدمة تجهيز التأشيرة' : 'Found your destination? Start your visa preparation request'}
              </p>
              <p className="font-body-ar text-sm text-muted-foreground">
                {isRTL ? 'تقديم سريع خلال 60 ثانية — بدون تعقيد' : 'Fast application in 60 seconds — no hassle'}
              </p>
            </div>
          </div>
          <Button asChild className="h-11 px-6 rounded-xl bg-brand text-white hover:bg-brand/90 font-jakarta font-extrabold shadow-md shrink-0">
            <Link to="/apply">
              {isRTL ? 'ابدأ الطلب' : 'Apply now'}
              <ArrowLeft className="h-4 w-4 ms-1 rtl-flip" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}