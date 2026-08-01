import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone, ShieldCheck, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

interface CTASectionProps {
  t: (key: string) => string;
}

export default function CTASection({ t }: CTASectionProps) {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';

  return (
    <section className="py-20 bg-canvas">
      <div className="container-section">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          id="final-cta"
          className="relative bg-gradient-to-br from-brand via-brand to-navy rounded-3xl p-12 md:p-20 text-center overflow-hidden shadow-[0_30px_80px_-20px] shadow-brand/40"
        >
          <div className="absolute -top-20 -end-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -start-20 w-80 h-80 bg-navy/20 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-2xl mx-auto text-white">
            <h2 className="font-heading-ar text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              {isRTL ? 'احجز موعدك خلال 60 ثانية' : 'Book your appointment in 60 seconds'}
            </h2>
            <p className="font-body-ar text-lg md:text-xl opacity-90 mb-10 leading-relaxed">
              {isRTL
                ? 'خدمة اختيارية مدفوعة لتجهيز ومراجعة ملف طلبك — لا نصدر التأشيرات ولا نضمن قبولها.'
                : 'An optional paid service to prepare and review your application file — we do not issue visas or guarantee approval.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="h-14 px-10 rounded-2xl bg-white text-brand hover:bg-white/95 hover:scale-[1.02] transition-transform font-jakarta font-extrabold text-base shadow-xl">
                <Link to="/apply">
                  {isRTL ? 'ابدأ بتقديم طلبك' : 'Start your application'}
                  <ArrowLeft className="h-5 w-5 ms-1 rtl-flip" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-10 rounded-2xl bg-transparent border-2 border-white/40 text-white hover:bg-white/10 hover:text-white hover:border-white/60 font-jakarta font-extrabold text-base backdrop-blur-sm">
                <a href="tel:+966562525665">
                  <Phone className="h-5 w-5 me-1" />
                  {isRTL ? 'تواصل مع خبير' : 'Talk to an expert'}
                </a>
              </Button>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm font-body-ar text-white/80">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" />{isRTL ? 'بدون وسطاء' : 'No middlemen'}</span>
              <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" />{isRTL ? 'ضمان استرداد' : 'Refund guarantee'}</span>
              <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4" />{isRTL ? 'دعم 24/7' : '24/7 support'}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}