import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';

const faqs = [
  {
    question: 'كم تستغرق معالجة طلب التأشيرة؟',
    answer: 'تختلف مدة المعالجة حسب نوع التأشيرة والدولة. عادة ما تتراوح بين 3-14 يوم عمل. نوفر أيضاً خدمة المعالجة السريعة لبعض التأشيرات.',
  },
  {
    question: 'ما هي المستندات المطلوبة عادةً؟',
    answer: 'تختلف المستندات حسب نوع التأشيرة. بشكل عام تحتاج: جواز سفر ساري، صور شخصية حديثة، كشف حساب بنكي، وحجوزات الطيران والفندق.',
  },
  {
    question: 'هل الأسعار شاملة لرسوم السفارة؟',
    answer: 'نوضح في كل خدمة ما إذا كانت الرسوم شاملة أو غير شاملة لرسوم التأشيرة الحكومية. يمكنك رؤية التفاصيل الكاملة قبل الدفع.',
  },
  {
    question: 'ماذا لو تم رفض طلب التأشيرة؟',
    answer: 'نقدم استشارة مجانية لفهم أسباب الرفض وكيفية تحسين طلبك. في بعض الحالات، نقدم استرداد جزئي حسب سياسة كل تأشيرة.',
  },
];

interface FAQSectionProps {
  t: (key: string) => string;
}

export default function FAQSection({ t }: FAQSectionProps) {
  const { direction } = useLanguage();
  const isRTL = direction === 'rtl';
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="py-28 bg-canvas">
      <div className="container-section">
        <div className="grid lg:grid-cols-12 gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-4 lg:sticky lg:top-24 self-start"
          >
            <span className="font-jakarta text-xs font-bold tracking-[0.25em] uppercase text-brand mb-3 block">
              {isRTL ? 'الأسئلة الشائعة' : 'FAQ'}
            </span>
            <h2 className="font-heading-ar text-4xl md:text-5xl font-extrabold text-navy mb-6 leading-tight">
              {t('faq.title')}
            </h2>
            <p className="font-body-ar text-base text-muted-foreground mb-8 leading-relaxed">
              {t('faq.subtitle')}
            </p>
            <Button asChild variant="outline" className="rounded-2xl h-12 px-6 border-border hover:bg-brand hover:text-brand-foreground hover:border-brand">
              <Link to="/faq" className="font-jakarta font-bold">
                {isRTL ? 'عرض كل الأسئلة' : 'See all questions'}
                <ArrowLeft className="h-4 w-4 ms-1 rtl-flip" />
              </Link>
            </Button>
          </motion.div>

          <div className="lg:col-span-8 space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className={`bg-card border rounded-3xl overflow-hidden transition-all ${
                  open === i ? 'border-brand/40 shadow-xl shadow-brand/5' : 'border-border hover:border-brand/20'
                }`}
              >
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between p-6 text-start"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className={`font-display text-xl font-bold ${open === i ? 'text-brand' : 'text-navy/40'}`}>
                      0{i + 1}
                    </span>
                    <h3 className={`font-heading-ar font-extrabold text-lg ${open === i ? 'text-brand' : 'text-navy'}`}>
                      {faq.question}
                    </h3>
                  </div>
                  <motion.span
                    animate={{ rotate: open === i ? 45 : 0 }}
                    transition={{ duration: 0.25 }}
                    className={`flex h-9 w-9 items-center justify-center rounded-full flex-shrink-0 ms-3 ${
                      open === i ? 'bg-brand text-brand-foreground' : 'bg-cream text-navy'
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <p className="font-body-ar text-muted-foreground leading-relaxed px-6 pb-6 ps-[4.5rem]">
                        {faq.answer}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}