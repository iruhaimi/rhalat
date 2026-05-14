import { useState, useCallback } from 'react';
import SEO from '@/components/seo/SEO';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import CountryCodePicker from '@/components/ui/CountryCodePicker';
import { filterArabicChars, filterNonNumeric } from '@/lib/inputFilters';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  MessageCircle,
  Send,
  Loader2,
  CheckCircle2,
  Headphones,
  Globe
} from 'lucide-react';

export default function Contact() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isRTL = language === 'ar';
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    countryCode: '+966',
    phone: '',
    subject: '',
    message: ''
  });

  const contactInfo = [
    {
      icon: MapPin,
      titleAr: 'العنوان',
      titleEn: 'Address',
      valueAr: 'الرياض - حي الربيع - شارع أبي بن معاذ الأنصاري',
      valueEn: 'Riyadh - Al-Rabi\' neighborhood - Ubay Bin Moaath Alansari Rd'
    },
    {
      icon: Phone,
      titleAr: 'الهاتف',
      titleEn: 'Phone',
      valueAr: '562525665',
      valueEn: '562525665',
      link: 'tel:562525665'
    },
    {
      icon: Mail,
      titleAr: 'البريد الإلكتروني',
      titleEn: 'Email',
      valueAr: 'info@rhalat.com',
      valueEn: 'info@rhalat.com',
      link: 'mailto:info@rhalat.com'
    },
    {
      icon: Clock,
      titleAr: 'ساعات العمل',
      titleEn: 'Working Hours',
      valueAr: 'يومياً: ١٠ صباحاً - ١٠ مساءً',
      valueEn: 'Daily: 10 AM - 10 PM'
    },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
    
    toast({
      title: isRTL ? 'تم إرسال رسالتك بنجاح' : 'Message Sent Successfully',
      description: isRTL 
        ? 'سنتواصل معك في أقرب وقت ممكن'
        : 'We will get back to you as soon as possible',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    // Filter phone field to only allow numbers
    const processedValue = name === 'phone' ? filterNonNumeric(value) : value;
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  // Handle email input - filter Arabic characters in real-time
  const handleEmailInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    const filtered = filterArabicChars(input.value);
    if (filtered !== input.value) {
      input.value = filtered;
      setFormData(prev => ({ ...prev, email: filtered }));
    }
  }, []);

  // Handle phone input - allow only digits and limit to 9 characters
  const handlePhoneInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    let filtered = filterNonNumeric(input.value);
    // Limit to 9 digits
    if (filtered.length > 9) {
      filtered = filtered.slice(0, 9);
    }
    if (filtered !== input.value) {
      input.value = filtered;
      setFormData(prev => ({ ...prev, phone: filtered }));
    }
  }, []);

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
      <SEO title="اتصل بنا — عطلات رحلاتكم" description="تواصل مع فريق دعم عطلات رحلاتكم عبر الهاتف 562525665 أو واتساب لأي استفسار حول التأشيرات." path="/contact" />
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
              <Headphones className="w-10 h-10 text-white" />
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {isRTL ? 'تواصل معنا' : 'Contact Us'}
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              {isRTL 
                ? 'نحن هنا لمساعدتك. تواصل معنا في أي وقت وسنرد عليك في أسرع وقت ممكن'
                : 'We are here to help. Reach out anytime and we will respond as soon as possible'
              }
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quick Contact Cards */}
      <section className="py-8 -mt-8 relative z-10">
        <div className="container-section">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {contactInfo.map((info, index) => {
              const Icon = info.icon;
              return (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="border-0 shadow-xl hover:shadow-2xl transition-all duration-300 group cursor-pointer h-full">
                    <CardContent className="p-5 text-center">
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/20 transition-colors"
                      >
                        <Icon className="w-6 h-6 text-primary" />
                      </motion.div>
                      <h3 className="font-semibold mb-1 text-sm">
                        {isRTL ? info.titleAr : info.titleEn}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {isRTL ? info.valueAr : info.valueEn}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <div className="container-section py-12">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Contact Methods */}
          <motion.div 
            className="lg:col-span-2 space-y-4"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            {/* WhatsApp Card */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/30 dark:to-green-900/20 border-green-200/50 dark:border-green-800/50 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    className="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center shadow-lg"
                  >
                    <MessageCircle className="w-7 h-7 text-white" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">
                      {isRTL ? 'واتساب' : 'WhatsApp'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {isRTL ? 'تحدث معنا مباشرة وسنرد فوراً' : 'Chat with us directly'}
                    </p>
                    <Button className="bg-green-500 hover:bg-green-600 rounded-xl w-full" asChild>
                      <a href="https://wa.me/966562525665?text=السلام%20عليكم،%20أريد%20الاستفسار%20عن%20خدمات%20التأشيرات" target="_blank" rel="noopener noreferrer">
                        <MessageCircle className="w-4 h-4 ml-2" />
                        {isRTL ? 'ابدأ المحادثة' : 'Start Chat'}
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Phone Card */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center shadow-lg"
                  >
                    <Phone className="w-7 h-7 text-primary-foreground" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">
                      {isRTL ? 'اتصل بنا' : 'Call Us'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {isRTL ? 'متاحون من ١٠ ص - ١٠ م' : 'Available 10 AM - 10 PM'}
                    </p>
                    <Button variant="outline" className="rounded-xl w-full" asChild>
                      <a href="tel:562525665">
                        <Phone className="w-4 h-4 ml-2" />
                        562525665
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Email Card */}
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.1 }}
                    className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center"
                  >
                    <Mail className="w-7 h-7 text-muted-foreground" />
                  </motion.div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">
                      {isRTL ? 'البريد الإلكتروني' : 'Email Us'}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      {isRTL ? 'نرد خلال 24 ساعة' : 'We reply within 24 hours'}
                    </p>
                    <Button variant="outline" className="rounded-xl w-full" asChild>
                      <a href="mailto:info@rhalat.com">
                        <Mail className="w-4 h-4 ml-2" />
                        info@rhalat.com
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

          </motion.div>

          {/* Contact Form */}
          <motion.div 
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="shadow-2xl border-0">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Send className="w-5 h-5 text-primary" />
                  </div>
                  {isRTL ? 'أرسل لنا رسالة' : 'Send Us a Message'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {isSubmitted ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200 }}
                      className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6"
                    >
                      <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-2">
                      {isRTL ? 'شكراً لتواصلك معنا!' : 'Thank You for Contacting Us!'}
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      {isRTL 
                        ? 'تم استلام رسالتك وسنتواصل معك قريباً'
                        : 'Your message has been received and we will contact you soon'
                      }
                    </p>
                    <Button onClick={() => setIsSubmitted(false)} className="rounded-xl">
                      {isRTL ? 'إرسال رسالة أخرى' : 'Send Another Message'}
                    </Button>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">
                          {isRTL ? 'الاسم الكامل' : 'Full Name'} *
                        </Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder={isRTL ? 'أدخل اسمك' : 'Enter your name'}
                          className="rounded-xl"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">
                          {isRTL ? 'البريد الإلكتروني' : 'Email'} *
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          inputMode="email"
                          value={formData.email}
                          onChange={handleChange}
                          onInput={handleEmailInput}
                          placeholder="example@email.com"
                          className="rounded-xl text-left"
                          dir="ltr"
                          style={{ textAlign: 'left' }}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone">
                          {isRTL ? 'رقم الجوال' : 'Phone Number'}
                        </Label>
                        <div className="flex flex-row-reverse gap-2">
                          <CountryCodePicker
                            value={formData.countryCode}
                            onChange={(value) => setFormData(prev => ({ ...prev, countryCode: value }))}
                            isRTL={isRTL}
                          />
                          <Input
                            id="phone"
                            name="phone"
                            type="tel"
                            inputMode="numeric"
                            maxLength={9}
                            value={formData.phone}
                            onChange={handleChange}
                            onInput={handlePhoneInput}
                            placeholder="5XXXXXXXX"
                            className="rounded-xl flex-1 text-left"
                            dir="ltr"
                            style={{ textAlign: 'left' }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject">
                          {isRTL ? 'الموضوع' : 'Subject'} *
                        </Label>
                        <Input
                          id="subject"
                          name="subject"
                          value={formData.subject}
                          onChange={handleChange}
                          placeholder={isRTL ? 'موضوع الرسالة' : 'Message subject'}
                          className="rounded-xl"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">
                        {isRTL ? 'الرسالة' : 'Message'} *
                      </Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder={isRTL ? 'اكتب رسالتك هنا...' : 'Write your message here...'}
                        rows={5}
                        className="rounded-xl resize-none"
                        required
                      />
                    </div>

                    <Button type="submit" size="lg" className="w-full rounded-xl" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin ml-2" />
                          {isRTL ? 'جاري الإرسال...' : 'Sending...'}
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5 ml-2" />
                          {isRTL ? 'إرسال الرسالة' : 'Send Message'}
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Map Section */}
        <motion.div 
          className="mt-12"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <Card className="overflow-hidden shadow-xl border-0">
            <div className="aspect-[21/9] bg-muted relative group">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3624.6837453874037!2d46.6854!3d24.7114!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjTCsDQyJzQxLjAiTiA0NsKwNDEnMDcuNCJF!5e0!3m2!1sar!2ssa!4v1234567890"
                width="100%"
                height="100%"
                style={{ border: 0, position: 'absolute', inset: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a
                href="https://maps.app.goo.gl/hym4suBsGkWe3jLKA"
                target="_blank"
                rel="noopener noreferrer"
                className="absolute bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 opacity-90 hover:opacity-100 transition-opacity"
              >
                <MapPin className="w-4 h-4" />
                {isRTL ? 'فتح في خرائط جوجل' : 'Open in Google Maps'}
              </a>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
