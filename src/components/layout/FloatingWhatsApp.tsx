import { FileCheck2, MessageCircle, Phone } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from '@/lib/router-compat';
import { trackConversion } from '@/lib/gtagEvents';
import { useLanguage } from '@/contexts/LanguageContext';
import { SITE_CONTACT } from '@/config/contact';

const actionClass = 'relative z-10 flex h-12 min-w-12 items-center justify-center gap-2 rounded-full px-3 shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:px-4';

export default function FloatingWhatsApp() {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';
  const phoneNumber = '966562525665';
  const message = isRTL
    ? 'مرحباً، أرغب في الاستفسار عن خدمات التأشيرات'
    : 'Hello, I would like to ask about visa services';
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  const handleWhatsAppClick = () => {
    trackConversion('generate_lead', { source: 'floating_whatsapp' });
  };

  return (
    <motion.div
      dir={direction}
      className="fixed z-40 flex items-center gap-2"
      style={{ bottom: 'calc(1rem + var(--safe-area-bottom, 0px))', left: '1rem' }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
      aria-label={isRTL ? 'إجراءات سريعة' : 'Quick actions'}
    >
      <Link
        to="/apply"
        aria-label={isRTL ? 'قدّم الآن' : 'Apply now'}
        className={`${actionClass} bg-primary text-primary-foreground hover:bg-primary/90`}
      >
        <FileCheck2 className="h-5 w-5" aria-hidden="true" />
        <span className="hidden text-sm font-medium sm:inline-block">{isRTL ? 'قدّم الآن' : 'Apply now'}</span>
      </Link>
      <a
        href={SITE_CONTACT.phoneHref}
        aria-label={isRTL ? `اتصل الآن: ${SITE_CONTACT.phoneDisplay}` : `Call now: ${SITE_CONTACT.phoneDisplay}`}
        className={`${actionClass} border border-primary/20 bg-card text-primary hover:bg-accent`}
      >
        <Phone className="h-5 w-5" aria-hidden="true" />
        <span className="hidden text-sm font-medium sm:inline-block">{isRTL ? 'اتصل الآن' : 'Call now'}</span>
      </a>
      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleWhatsAppClick}
        className={`${actionClass} bg-success text-success-foreground hover:bg-success/90`}
        aria-label={isRTL ? 'تواصل معنا عبر واتساب' : 'Contact us on WhatsApp'}
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        <span className="hidden text-sm font-medium sm:inline-block">{isRTL ? 'واتساب' : 'WhatsApp'}</span>
      </a>
    </motion.div>
  );
}
