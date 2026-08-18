import { useLanguage } from '@/contexts/LanguageContext';
import SEO from '@/components/seo/SEO';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Building2, 
  Users, 
  Award, 
  Globe, 
  Shield, 
  Clock, 
  CheckCircle2,
  Target,
  Heart,
  Zap,
  ArrowLeft,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export default function About() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const stats = [
    { 
      value: '4', 
      labelAr: 'خطوات لتجهيز الملف', 
      labelEn: 'Steps to prepare a file',
      icon: Award
    },
    { 
      value: '5', 
      labelAr: 'أيام متوسط التجهيز', 
      labelEn: 'Days avg. preparation',
      icon: CheckCircle2
    },
    { 
      value: '50+', 
      labelAr: 'دولة معلوماتها متاحة', 
      labelEn: 'Countries covered',
      icon: Globe
    },
    { 
      value: '24/7', 
      labelAr: 'دعم متواصل', 
      labelEn: 'Support Available',
      icon: Clock
    },
  ];

  const values = [
    {
      icon: Shield,
      titleAr: 'الموثوقية',
      titleEn: 'Reliability',
      descAr: 'نلتزم بأعلى معايير الأمان والشفافية في جميع تعاملاتنا',
      descEn: 'We adhere to the highest standards of security and transparency'
    },
    {
      icon: Zap,
      titleAr: 'السرعة',
      titleEn: 'Speed',
      descAr: 'نسعى لإنجاز طلباتكم في أسرع وقت ممكن دون التضحية بالجودة',
      descEn: 'We strive to complete your applications as quickly as possible'
    },
    {
      icon: Heart,
      titleAr: 'خدمة العملاء',
      titleEn: 'Customer Service',
      descAr: 'فريقنا متاح على مدار الساعة لمساعدتكم والإجابة على استفساراتكم',
      descEn: 'Our team is available 24/7 to help and answer your questions'
    },
    {
      icon: Target,
      titleAr: 'الدقة',
      titleEn: 'Accuracy',
      descAr: 'نحرص على دقة المعلومات والمستندات وفق ما تطلبه الجهة الرسمية',
      descEn: 'We ensure accuracy of information and documents per the official authority requirements'
    },
  ];

  const team = [
    {
      nameAr: 'أحمد الرشيد',
      nameEn: 'Ahmed Al-Rashid',
      roleAr: 'المدير التنفيذي',
      roleEn: 'CEO',
      image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face'
    },
    {
      nameAr: 'سارة المحمود',
      nameEn: 'Sara Al-Mahmoud',
      roleAr: 'مديرة العمليات',
      roleEn: 'Operations Manager',
      image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face'
    },
    {
      nameAr: 'خالد العتيبي',
      nameEn: 'Khaled Al-Otaibi',
      roleAr: 'مدير خدمات تجهيز الملفات',
      roleEn: 'File Preparation Services Manager',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face'
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen bg-canvas">
      <SEO title="من نحن — عطلات رحلاتكم" description="عطلات رحلاتكم وكالة سفر خاصة تقدم خدمات تجهيز ومراجعة ملفات طلبات التأشيرة والمساعدة في المواعيد وخدمات السفر. لسنا جهة حكومية ولا نصدر التأشيرات." path="/about" />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-navy via-navy/95 to-brand py-24 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-3xl blur-xl"
          />
          <motion.div
            animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
            className="absolute bottom-20 left-20 w-40 h-40 bg-white/10 rounded-full blur-xl"
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
            >
              <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
                <Sparkles className="w-4 h-4 ml-1" />
                {isRTL ? 'منذ 2015' : 'Since 2015'}
              </Badge>
            </motion.div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {isRTL ? 'من نحن' : 'About Us'}
            </h1>
            <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              {isRTL 
                ? 'عطلات رحلاتكم وكالة سفر وسياحة تقدم خدمات المساعدة في تجهيز طلبات التأشيرات وحجوزات السفر. نساعد المسافرين في تجهيز طلبات التأشيرة واستكمال متطلباتها وفق المعلومات الرسمية.'
                : 'Otolat Rahlatcom is a travel and tourism agency providing visa application preparation assistance and travel bookings, helping travelers complete their application requirements based on official information.'
              }
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 -mt-12 relative z-10">
        <div className="container-section">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="text-center border-0 shadow-xl bg-card hover:shadow-2xl transition-shadow">
                    <CardContent className="pt-8 pb-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1, type: "spring" }}
                        className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      >
                        <Icon className="w-7 h-7 text-primary" />
                      </motion.div>
                      <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
                      <div className="text-muted-foreground">
                        {isRTL ? stat.labelAr : stat.labelEn}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20">
        <div className="container-section">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Badge className="mb-4">
                {isRTL ? 'قصتنا' : 'Our Story'}
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                {isRTL ? 'قصتنا' : 'Our Story'}
              </h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  {isRTL 
                    ? 'بدأت عطلات رحلاتكم رحلتها في عام 2015 كمكتب سفر وسياحة في الرياض، ونقدم اليوم خدمات تجهيز ومراجعة ملفات طلبات التأشيرة والمساعدة في المواعيد وخدمات السفر.'
                    : 'Otolat Rahlatcom started in 2015 as a travel and tourism office in Riyadh, and today provides visa application file preparation and review, appointment assistance and travel services.'
                  }
                </p>
                <p>
                  {isRTL
                    ? 'نفخر بفريقنا المتخصص في تجهيز ومراجعة ملفات طلبات التأشيرة والمساعدة في المواعيد وخدمات السفر.'
                    : 'We are proud of our team specialized in preparing and reviewing visa application files, appointment assistance and travel services.'
                  }
                </p>
                <p>
                  {isRTL
                    ? 'هدفنا هو تسهيل تجهيز طلب التأشيرة ومراجعة مستنداته، حتى تتمكن من التركيز على الاستمتاع برحلتك. قرار المنح يعود حصرياً للجهات الحكومية المختصة.'
                    : 'Our goal is to simplify preparing and reviewing your visa application, so you can focus on enjoying your trip. Issuance decisions rest solely with the competent government authorities.'
                  }
                </p>
              </div>
            </motion.div>
            
            <motion.div 
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <img 
                  src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop"
                  alt={isRTL ? 'فريق العمل' : 'Our team'}
                  width={600}
                  height={400}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-primary/50 to-transparent" />
              </div>
              <motion.div 
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, type: "spring" }}
                className="absolute -bottom-6 -right-6 bg-primary text-primary-foreground p-6 rounded-2xl shadow-xl"
              >
                <div className="text-4xl font-bold">10+</div>
                <div className="text-sm opacity-90">
                  {isRTL ? 'سنوات خبرة' : 'Years Experience'}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-muted/30">
        <div className="container-section">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4">
              {isRTL ? 'قيمنا' : 'Our Values'}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {isRTL ? 'ما يميزنا عن الآخرين' : 'What Sets Us Apart'}
            </h2>
          </motion.div>
          
          <motion.div 
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.div key={index} variants={itemVariants}>
                  <Card className="text-center h-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                    <CardContent className="pt-8 pb-6">
                      <motion.div 
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:from-primary/30 group-hover:to-primary/10 transition-colors"
                      >
                        <Icon className="w-8 h-8 text-primary" />
                      </motion.div>
                      <h3 className="font-bold text-lg mb-2">
                        {isRTL ? value.titleAr : value.titleEn}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? value.descAr : value.descEn}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-20">
        <div className="container-section">
          <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge className="mb-4">
              {isRTL ? 'فريقنا' : 'Our Team'}
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {isRTL ? 'تعرف على قيادتنا' : 'Meet Our Leadership'}
            </h2>
          </motion.div>
          
          <motion.div 
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-4xl mx-auto"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {team.map((member, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="text-center overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <div className="aspect-square overflow-hidden relative">
                    <img 
                      src={member.image} 
                      alt={isRTL ? member.nameAr : member.nameEn}
                      width={200}
                      height={200}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/placeholder.svg'; }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <CardContent className="pt-4 pb-6 relative">
                    <h3 className="font-bold text-lg">
                      {isRTL ? member.nameAr : member.nameEn}
                    </h3>
                    <p className="text-sm text-primary">
                      {isRTL ? member.roleAr : member.roleEn}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-navy via-navy/95 to-brand text-primary-foreground relative overflow-hidden">
        {/* Decorative */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-10 left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"
          />
        </div>

        <div className="container-section relative">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {isRTL ? 'جاهز لبدء رحلتك؟' : 'Ready to Start Your Journey?'}
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              {isRTL 
                ? 'تواصل معنا اليوم ودعنا نساعدك في تجهيز طلب التأشيرة واستكمال متطلباته'
                : 'Contact us today and let us help you prepare your visa application'
              }
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button size="lg" variant="secondary" className="rounded-xl" asChild>
                <Link to="/apply">
                  {isRTL ? 'ابدأ طلبك الآن' : 'Start Your Application'}
                  <ArrowIcon className="w-4 h-4 mr-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl border-white text-white hover:bg-white/10" asChild>
                <Link to="/contact">
                  {isRTL ? 'تواصل معنا' : 'Contact Us'}
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
