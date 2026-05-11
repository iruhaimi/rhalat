import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  HelpCircle, 
  Search, 
  FileText, 
  CreditCard, 
  Clock, 
  Shield,
  Globe,
  MessageCircle,
  ChevronDown,
  Phone,
  Mail
} from 'lucide-react';

interface FAQItem {
  qAr: string;
  qEn: string;
  aAr: string;
  aEn: string;
}

interface Category {
  icon: React.ComponentType<{ className?: string }>;
  titleAr: string;
  titleEn: string;
  questions: FAQItem[];
}

export default function FAQ() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  const toggleItem = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const categories: Category[] = [
    {
      icon: FileText,
      titleAr: 'التقديم على التأشيرة',
      titleEn: 'Visa Application',
      questions: [
        {
          qAr: 'كيف يمكنني التقديم على تأشيرة؟',
          qEn: 'How can I apply for a visa?',
          aAr: 'يمكنك التقديم على التأشيرة عبر موقعنا الإلكتروني. اختر الدولة المطلوبة، ثم اتبع خطوات التقديم وقم برفع المستندات المطلوبة وأكمل عملية الدفع.',
          aEn: 'You can apply for a visa through our website. Select the desired country, follow the application steps, upload required documents, and complete the payment.'
        },
        {
          qAr: 'ما هي المستندات المطلوبة للتقديم؟',
          qEn: 'What documents are required for the application?',
          aAr: 'تختلف المستندات المطلوبة حسب نوع التأشيرة والدولة. بشكل عام، ستحتاج إلى: جواز سفر ساري، صور شخصية، كشف حساب بنكي، حجز فندقي، وتذاكر سفر.',
          aEn: 'Required documents vary by visa type and country. Generally, you will need: valid passport, personal photos, bank statement, hotel booking, and travel tickets.'
        },
        {
          qAr: 'هل يمكنني التقديم لأكثر من شخص في طلب واحد؟',
          qEn: 'Can I apply for multiple people in one application?',
          aAr: 'نعم، يمكنك التقديم لعدة أشخاص في طلب واحد. أثناء التقديم، حدد عدد المسافرين البالغين والأطفال والرضع.',
          aEn: 'Yes, you can apply for multiple people in one application. During the application, specify the number of adults, children, and infants.'
        },
      ]
    },
    {
      icon: Clock,
      titleAr: 'مدة المعالجة',
      titleEn: 'Processing Time',
      questions: [
        {
          qAr: 'كم تستغرق مدة معالجة التأشيرة؟',
          qEn: 'How long does visa processing take?',
          aAr: 'تختلف مدة المعالجة حسب نوع التأشيرة والدولة. عادةً تتراوح بين 3-15 يوم عمل. يمكنك رؤية المدة المتوقعة في صفحة كل دولة.',
          aEn: 'Processing time varies by visa type and country. Usually ranges from 3-15 business days. You can see expected duration on each country page.'
        },
        {
          qAr: 'هل يمكن تسريع معالجة الطلب؟',
          qEn: 'Can the application processing be expedited?',
          aAr: 'نعم، نوفر خدمة المعالجة السريعة لبعض التأشيرات مقابل رسوم إضافية. تواصل معنا للاستفسار عن التفاصيل.',
          aEn: 'Yes, we offer express processing for some visas for an additional fee. Contact us for details.'
        },
        {
          qAr: 'كيف يمكنني متابعة حالة طلبي؟',
          qEn: 'How can I track my application status?',
          aAr: 'يمكنك متابعة حالة طلبك من خلال صفحة "تتبع الطلب" على موقعنا باستخدام رقم الطلب ورقم جوالك أو بريدك الإلكتروني.',
          aEn: 'You can track your application status through the "Track Application" page on our website using your application number and phone or email.'
        },
      ]
    },
    {
      icon: CreditCard,
      titleAr: 'الدفع والأسعار',
      titleEn: 'Payment & Pricing',
      questions: [
        {
          qAr: 'ما هي طرق الدفع المتاحة؟',
          qEn: 'What payment methods are available?',
          aAr: 'نقبل الدفع عبر: البطاقات الائتمانية (فيزا، ماستركارد)، Apple Pay، مدى، والتحويل البنكي.',
          aEn: 'We accept: credit cards (Visa, Mastercard), Apple Pay, Mada, and bank transfer.'
        },
        {
          qAr: 'هل الأسعار شاملة رسوم التأشيرة الحكومية؟',
          qEn: 'Do prices include government visa fees?',
          aAr: 'يختلف ذلك حسب نوع التأشيرة. بعض الأسعار شاملة للرسوم الحكومية والبعض الآخر غير شامل. يتم توضيح ذلك بوضوح في صفحة كل تأشيرة.',
          aEn: 'This varies by visa type. Some prices include government fees while others do not. This is clearly indicated on each visa page.'
        },
        {
          qAr: 'هل يمكنني استرداد المبلغ إذا تم رفض التأشيرة؟',
          qEn: 'Can I get a refund if my visa is rejected?',
          aAr: 'رسوم الخدمة غير قابلة للاسترداد. أما رسوم التأشيرة الحكومية فتعتمد على سياسة كل سفارة. راجع سياسة الاسترجاع للتفاصيل.',
          aEn: 'Service fees are non-refundable. Government visa fees depend on each embassy policy. See our refund policy for details.'
        },
      ]
    },
    {
      icon: Shield,
      titleAr: 'الأمان والخصوصية',
      titleEn: 'Security & Privacy',
      questions: [
        {
          qAr: 'هل معلوماتي الشخصية آمنة؟',
          qEn: 'Is my personal information secure?',
          aAr: 'نعم، نستخدم أعلى معايير التشفير والأمان لحماية بياناتك. جميع المعلومات مشفرة ولا نشاركها مع أي طرف ثالث.',
          aEn: 'Yes, we use the highest encryption and security standards to protect your data. All information is encrypted and not shared with third parties.'
        },
        {
          qAr: 'كيف يتم التعامل مع مستنداتي؟',
          qEn: 'How are my documents handled?',
          aAr: 'يتم تخزين مستنداتك بشكل آمن ومشفر. نحتفظ بها فقط للمدة اللازمة لمعالجة طلبك ثم يتم حذفها بشكل آمن.',
          aEn: 'Your documents are stored securely and encrypted. We keep them only for the time needed to process your application, then securely delete them.'
        },
      ]
    },
    {
      icon: Globe,
      titleAr: 'عام',
      titleEn: 'General',
      questions: [
        {
          qAr: 'هل أنتم مكتب رسمي معتمد؟',
          qEn: 'Are you an officially licensed office?',
          aAr: 'نعم، نحن مكتب مرخص ومعتمد من الجهات المختصة لتقديم خدمات التأشيرات والسفر.',
          aEn: 'Yes, we are a licensed and authorized office by relevant authorities to provide visa and travel services.'
        },
        {
          qAr: 'هل يمكنني زيارة مكتبكم شخصياً؟',
          qEn: 'Can I visit your office in person?',
          aAr: 'نعم، يمكنك زيارتنا خلال ساعات العمل. موقعنا في الرياض، طريق الملك فهد، برج المملكة.',
          aEn: 'Yes, you can visit us during working hours. We are located in Riyadh, King Fahd Road, Kingdom Tower.'
        },
        {
          qAr: 'كيف يمكنني التواصل معكم؟',
          qEn: 'How can I contact you?',
          aAr: 'يمكنك التواصل معنا عبر الهاتف، البريد الإلكتروني، واتساب، أو زيارة مكتبنا. راجع صفحة "تواصل معنا" للتفاصيل.',
          aEn: 'You can contact us via phone, email, WhatsApp, or visit our office. See the "Contact Us" page for details.'
        },
      ]
    },
  ];

  // Filter FAQs based on search
  const filteredCategories = categories.map(category => ({
    ...category,
    questions: category.questions.filter(q => {
      const query = searchQuery.toLowerCase();
      const question = isRTL ? q.qAr : q.qEn;
      const answer = isRTL ? q.aAr : q.aEn;
      return question.toLowerCase().includes(query) || answer.toLowerCase().includes(query);
    })
  })).filter(category => category.questions.length > 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/85 py-20 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-10 right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"
          />
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.15, 0.1] }}
            transition={{ duration: 10, repeat: Infinity, delay: 2 }}
            className="absolute bottom-10 left-10 w-80 h-80 bg-white/10 rounded-full blur-3xl"
          />
        </div>

        <div className="container-section relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-6"
            >
              <HelpCircle className="w-10 h-10 text-white" />
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {isRTL ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
              {isRTL 
                ? 'ابحث عن إجابات لأسئلتك الأكثر شيوعاً حول خدماتنا'
                : 'Find answers to the most common questions about our services'
              }
            </p>
            
            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="max-w-lg mx-auto"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className="relative">
                <Search className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground`} />
                <Input
                  type="text"
                  placeholder={isRTL ? 'ابحث عن سؤال...' : 'Search for a question...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`${isRTL ? 'pl-4 pr-12' : 'pr-4 pl-12'} py-6 text-base bg-white text-foreground rounded-2xl shadow-2xl border-0`}
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <div className="container-section py-16">
        {filteredCategories.length > 0 ? (
          <motion.div 
            className="space-y-8 max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredCategories.map((category, categoryIndex) => {
              const Icon = category.icon;
              return (
                <motion.div key={categoryIndex} variants={itemVariants}>
                  <Card className="shadow-lg overflow-hidden border-0">
                    <CardContent className="p-0">
                      {/* Category Header */}
                      <div 
                        className={`flex items-center gap-4 p-6 border-b bg-gradient-to-r from-primary/5 to-transparent`}
                        dir={isRTL ? 'rtl' : 'ltr'}
                      >
                        <motion.div 
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center"
                        >
                          <Icon className="w-6 h-6 text-primary" />
                        </motion.div>
                        <h2 className={`text-xl font-bold ${isRTL ? 'text-right' : 'text-left'}`}>
                          {isRTL ? category.titleAr : category.titleEn}
                        </h2>
                        <Badge variant="secondary" className={isRTL ? 'mr-auto' : 'ml-auto'}>
                          {category.questions.length}
                        </Badge>
                      </div>
                      
                      {/* Questions */}
                      <div className="divide-y" dir={isRTL ? 'rtl' : 'ltr'}>
                        {category.questions.map((faq, faqIndex) => {
                          const itemKey = `${categoryIndex}-${faqIndex}`;
                          const isOpen = openItems[itemKey];
                          
                          return (
                            <div key={faqIndex}>
                              <button
                                onClick={() => toggleItem(itemKey)}
                                className="w-full flex items-center justify-between p-5 hover:bg-muted/50 transition-colors"
                                style={{ textAlign: isRTL ? 'right' : 'left' }}
                              >
                                <div className="flex items-center gap-3 flex-1">
                                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                                    isOpen ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                  }`}>
                                    {faqIndex + 1}
                                  </span>
                                  <span className={`font-medium transition-colors ${isOpen ? 'text-primary' : ''}`} style={{ textAlign: isRTL ? 'right' : 'left' }}>
                                    {isRTL ? faq.qAr : faq.qEn}
                                  </span>
                                </div>
                                <motion.div
                                  animate={{ rotate: isOpen ? 180 : 0 }}
                                  transition={{ duration: 0.3 }}
                                  className={`flex-shrink-0 ${isRTL ? 'mr-4' : 'ml-4'} ${isOpen ? 'text-primary' : 'text-muted-foreground'}`}
                                >
                                  <ChevronDown className="h-5 w-5" />
                                </motion.div>
                              </button>
                              
                              <AnimatePresence>
                                {isOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="overflow-hidden"
                                  >
                                    <div className={`px-5 pb-5 ${isRTL ? 'pl-16' : 'pr-16'}`}>
                                      <p className="text-muted-foreground leading-relaxed bg-muted/30 p-4 rounded-xl" style={{ textAlign: isRTL ? 'right' : 'left' }}>
                                        {isRTL ? faq.aAr : faq.aEn}
                                      </p>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {isRTL ? 'لم يتم العثور على نتائج' : 'No Results Found'}
            </h3>
            <p className="text-muted-foreground">
              {isRTL 
                ? 'جرب البحث بكلمات مختلفة'
                : 'Try searching with different keywords'
              }
            </p>
          </motion.div>
        )}

        {/* Still Have Questions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16"
        >
          <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border-primary/20 max-w-4xl mx-auto overflow-hidden">
            <CardContent className="p-0">
              <div className="grid md:grid-cols-2 gap-0">
                <div className="p-8 flex flex-col justify-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
                    <MessageCircle className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">
                    {isRTL ? 'لم تجد إجابة لسؤالك؟' : "Didn't Find Your Answer?"}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {isRTL 
                      ? 'فريق الدعم لدينا جاهز لمساعدتك على مدار الساعة'
                      : 'Our support team is ready to help you around the clock'
                    }
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button asChild className="rounded-xl">
                      <Link to="/contact">
                        {isRTL ? 'تواصل معنا' : 'Contact Us'}
                      </Link>
                    </Button>
                    <Button variant="outline" className="rounded-xl gap-2" asChild>
                      <a href="https://wa.me/966562525665" target="_blank" rel="noopener">
                        <MessageCircle className="w-4 h-4" />
                        {isRTL ? 'واتساب' : 'WhatsApp'}
                      </a>
                    </Button>
                  </div>
                </div>
                
                <div className="bg-primary/5 p-8 flex flex-col justify-center gap-4">
                  <div className="flex items-center gap-4 bg-background rounded-xl p-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{isRTL ? 'اتصل بنا' : 'Call Us'}</p>
                      <p className="font-semibold" dir="ltr">562525665</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 bg-background rounded-xl p-4">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{isRTL ? 'راسلنا' : 'Email Us'}</p>
                      <p className="font-semibold">info@rhalat.com</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
