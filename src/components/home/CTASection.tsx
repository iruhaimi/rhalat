import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Phone } from 'lucide-react';
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
          className="relative bg-brand rounded-7xl p-12 md:p-20 text-center overflow-hidden shadow-2xl shadow-brand/20"
        >
          <div className="absolute -top-20 -end-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -start-20 w-80 h-80 bg-navy/20 rounded-full blur-3xl" />

          <div className="relative z-10 max-w-2xl mx-auto text-white">
            <h2 className="font-heading-ar text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              {isRTL ? 'ابدأ مغامرتك القادمة الآن' : 'Start your next adventure'}
            </h2>
            <p className="font-body-ar text-lg md:text-xl opacity-90 mb-10 leading-relaxed">
              {isRTL
                ? 'فريقنا جاهز لمساعدتك في الحصول على تأشيرتك بأسرع وقت وأقل تكلفة.'
                : 'Our team is ready to help you get your visa quickly and affordably.'}
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
          </div>
        </motion.div>
      </div>
    </section>
  );
}