import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function FloatingWhatsApp() {
  const phoneNumber = '966920034158';
  const message = 'مرحباً، أرغب في الاستفسار عن خدمات التأشيرات';
  
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <motion.a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed z-50 flex items-center gap-2 bg-[#25D366] text-white px-4 py-3 rounded-full shadow-lg hover:bg-[#20BD5A] transition-all hover:scale-105 group"
      style={{ bottom: 'calc(1.5rem + var(--safe-area-bottom, 0px))', left: '1.5rem' }}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label="تواصل معنا عبر واتساب"
    >
      {/* Pulse animation */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25" />
      
      <MessageCircle className="h-6 w-6 relative z-10" />
      <span className="hidden sm:inline-block font-medium relative z-10">
        تواصل معنا
      </span>
    </motion.a>
  );
}
