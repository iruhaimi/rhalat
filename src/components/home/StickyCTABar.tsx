import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

export default function StickyCTABar() {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const onScroll = () => {
      const scrolled = window.scrollY > 600;
      const finalCta = document.getElementById('final-cta');
      let nearFinal = false;
      if (finalCta) {
        const rect = finalCta.getBoundingClientRect();
        nearFinal = rect.top < window.innerHeight - 100;
      }
      setVisible(scrolled && !nearFinal);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, [dismissed]);

  return (
    <AnimatePresence>
      {visible && !dismissed && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-4 inset-x-4 md:inset-x-auto md:end-6 md:max-w-md z-40"
        >
          <div className="flex items-center gap-3 rounded-2xl bg-brand text-white shadow-2xl shadow-brand/30 px-4 py-3 border border-white/10">
            <div className="flex-1 min-w-0">
              <p className="font-heading-ar text-sm font-extrabold truncate">
                {isRTL ? 'جاهز للسفر؟ ابدأ طلبك الآن' : 'Ready to travel? Start now'}
              </p>
              <p className="font-body-ar text-xs opacity-80 truncate">
                {isRTL ? 'تقديم سريع وآمن خلال 60 ثانية' : 'Fast & secure in 60 seconds'}
              </p>
            </div>
            <Button asChild size="sm" className="h-9 px-4 rounded-xl bg-white text-brand hover:bg-white/95 font-jakarta font-extrabold shrink-0">
              <Link to="/apply">
                {isRTL ? 'ابدأ' : 'Start'}
                <ArrowLeft className="h-4 w-4 ms-1 rtl-flip" />
              </Link>
            </Button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label={isRTL ? 'إغلاق' : 'Dismiss'}
              className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}