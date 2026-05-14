import { useState, useEffect } from 'react';
import SEO from '@/components/seo/SEO';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Percent, 
  Gift, 
  Sparkles, 
  ArrowLeft, 
  Calendar,
  Star,
  Zap,
  Loader2,
  CheckCircle2,
  ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SARSymbol from '@/components/ui/SARSymbol';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSpecialOffers, SpecialOffer } from '@/hooks/useSpecialOffers';

// Reusable Countdown Timer Component with gradient boxes
function CountdownTimer({ endDate, size = 'sm' }: { endDate: Date; size?: 'sm' | 'lg' }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = endDate.getTime() - new Date().getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        });
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endDate]);

  // Display order from left to right: ثانية - دقيقة - ساعة - يوم
  const timeUnits = [
    { value: timeLeft.seconds, label: 'ثانية' },
    { value: timeLeft.minutes, label: 'دقيقة' },
    { value: timeLeft.hours, label: 'ساعة' },
    { value: timeLeft.days, label: 'يوم' },
  ];

  const isLarge = size === 'lg';

  return (
    <div className="flex items-center justify-center gap-2 sm:gap-3">
      <SEO title="العروض الخاصة — عطلات رحلاتكم" description="أحدث العروض والخصومات على خدمات التأشيرات لفترة محدودة." path="/offers" />
      {timeUnits.map((unit, index) => (
        <div key={index} className="text-center">
          <motion.div
            key={unit.value}
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
            className={`
              bg-gradient-to-b from-[#5b8bd4] to-[#3a6db8] text-white font-bold 
              flex items-center justify-center shadow-lg
              ${isLarge 
                ? 'text-3xl sm:text-4xl md:text-5xl w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 rounded-2xl' 
                : 'text-lg sm:text-xl w-11 sm:w-14 h-11 sm:h-14 rounded-xl'
              }
            `}
          >
            {unit.value.toString().padStart(2, '0')}
          </motion.div>
          <span className={`text-muted-foreground mt-2 block font-medium ${isLarge ? 'text-sm sm:text-base' : 'text-[10px] sm:text-xs'}`}>
            {unit.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function OfferCard({ offer, index }: { offer: SpecialOffer; index: number }) {
  const savings = offer.original_price - offer.sale_price;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className="group relative overflow-hidden bg-card hover:shadow-2xl transition-all duration-500 border-0 shadow-lg rounded-2xl">
        {/* Gradient Top Border */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-accent to-primary" />
        
        <CardContent className="p-0">
          {/* Header with Badges Row */}
          <div className="p-5 sm:p-6 pb-4">
            {/* Top Row: Hot Badge + Regular Badge */}
            <div className="flex items-center justify-between mb-4">
              {/* Hot Badge */}
              {offer.is_hot ? (
                <motion.div 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                >
                  <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold px-3 py-1.5 flex items-center gap-1.5 shadow-md border-0">
                    <Zap className="h-3 w-3" />
                    عرض حار 🔥
                  </Badge>
                </motion.div>
              ) : (
                <div />
              )}
              
              {/* Regular Badge */}
              <Badge variant="outline" className="text-xs border-primary/40 text-primary bg-primary/5">
                {offer.badge}
              </Badge>
            </div>

            {/* Country Flag & Name Row */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl drop-shadow-sm">{offer.flag_emoji}</span>
              <span className="text-sm font-medium text-muted-foreground">{offer.country_name}</span>
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-colors mb-2 leading-tight">
              {offer.title}
            </h3>

            {/* Description */}
            <p className="text-muted-foreground text-sm leading-relaxed line-clamp-2">
              {offer.description}
            </p>
          </div>

          {/* Pricing Section */}
          <div className="px-5 sm:px-6 py-5 bg-muted/30 border-y border-border/30">
            <div className="flex items-center justify-between flex-wrap gap-3">
              {/* Price */}
              <div className="flex items-baseline gap-3">
                <div className="flex items-center gap-1">
                  <span className="text-3xl sm:text-4xl font-bold text-primary">{offer.sale_price}</span>
                  <SARSymbol size="lg" className="text-primary" />
                </div>
                <div className="flex items-center gap-0.5 line-through text-muted-foreground/60">
                  <span className="text-base">{offer.original_price}</span>
                  <SARSymbol size="xs" className="text-muted-foreground/60" />
                </div>
              </div>
              
              {/* Discount & Savings */}
              <div className="flex flex-col items-end gap-1.5">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", delay: index * 0.1 + 0.2 }}
                >
                  <Badge className="bg-gradient-to-br from-primary to-accent text-white text-base font-bold px-3 py-1 border-0 shadow-md">
                    {offer.discount_percentage}% خصم
                  </Badge>
                </motion.div>
                <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 text-xs font-medium">
                  وفر {savings} <SARSymbol size="xs" className="inline mr-0.5" />
                </Badge>
              </div>
            </div>
          </div>

          {/* Countdown Section */}
          <div className="px-5 sm:px-6 py-5">
            <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">ينتهي العرض خلال</span>
            </div>
            <CountdownTimer endDate={new Date(offer.end_date)} size="sm" />
          </div>

          {/* Features & CTA */}
          <div className="px-5 sm:px-6 pb-5 sm:pb-6">
            {/* Quick Features */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                معالجة سريعة
              </span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                ضمان الموافقة
              </span>
            </div>

            {/* CTA Button */}
            <Button asChild className="w-full h-12 text-base font-semibold group/btn shadow-md hover:shadow-lg transition-all rounded-xl">
              <Link to="/apply">
                احجز الآن
                <ArrowLeft className="h-5 w-5 mr-2 transition-transform group-hover/btn:-translate-x-1" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function SpecialOffers() {
  const { t } = useLanguage();
  const { data: offers, isLoading, error } = useSpecialOffers();

  // Main countdown for the biggest sale (use first offer's end date or 7 days from now)
  const mainSaleEnd = offers && offers.length > 0 
    ? new Date(offers[0].end_date) 
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Floating Elements */}
        <motion.div
          className="absolute top-32 left-10 text-4xl hidden sm:block"
          animate={{ y: [-10, 10, -10], rotate: [0, 10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          🎁
        </motion.div>
        <motion.div
          className="absolute top-20 right-32 text-3xl hidden sm:block"
          animate={{ y: [10, -10, 10], rotate: [0, -10, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          ✨
        </motion.div>
        <motion.div
          className="absolute bottom-32 right-20 text-4xl hidden sm:block"
          animate={{ y: [-5, 15, -5] }}
          transition={{ duration: 5, repeat: Infinity }}
        >
          🎉
        </motion.div>

        <div className="container-section relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
            >
              <Badge className="mb-6 bg-gradient-to-r from-primary to-accent text-white text-sm px-5 py-2.5 shadow-lg">
                <Sparkles className="h-4 w-4 ml-2" />
                عروض حصرية لفترة محدودة
              </Badge>
            </motion.div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              <span className="text-foreground">عروض</span>{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                استثنائية
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              استمتع بخصومات تصل إلى 40% على خدمات التأشيرات المختارة. العروض محدودة!
            </p>

            {/* Main Countdown */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="inline-block"
            >
              <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl p-6 sm:p-8 shadow-2xl">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-6">
                  <Clock className="h-5 w-5 text-primary" />
                  <span className="font-medium text-base">تنتهي العروض خلال</span>
                </div>
                <CountdownTimer endDate={mainSaleEnd} size="lg" />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-8 border-y border-border/30 bg-muted/20">
        <div className="container-section">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Percent, text: 'خصومات حتى 40%', color: 'text-primary' },
              { icon: Gift, text: 'عروض حصرية', color: 'text-accent' },
              { icon: Calendar, text: 'مواعيد مرنة', color: 'text-green-500' },
              { icon: Star, text: 'خدمة VIP', color: 'text-yellow-500' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center justify-center gap-3 text-center py-2"
              >
                <div className={`p-2.5 bg-background rounded-xl shadow-sm border border-border/50`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <span className="text-sm font-medium text-foreground">{item.text}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Offers Grid */}
      <section className="py-16 sm:py-24">
        <div className="container-section">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">العروض المتاحة</h2>
            <p className="text-muted-foreground text-lg">اختر العرض المناسب لك واحجز الآن قبل انتهاء الوقت</p>
          </motion.div>

          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground">جاري تحميل العروض...</p>
              </div>
            </div>
          ) : offers && offers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {offers.map((offer, index) => (
                <OfferCard key={offer.id} offer={offer} index={index} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="h-10 w-10 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-lg">لا توجد عروض متاحة حالياً</p>
              <p className="text-sm text-muted-foreground mt-2">تابعنا للحصول على أحدث العروض</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-r from-primary via-primary to-accent relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/2 translate-y-1/2" />
        </div>

        <div className="container-section text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              لا تفوت الفرصة! 🎯
            </h2>
            <p className="text-white/80 mb-8 max-w-xl mx-auto text-lg">
              تواصل معنا الآن للحصول على عروض خاصة إضافية للمجموعات والشركات
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild className="text-base px-8 shadow-lg">
                <Link to="/contact">تواصل معنا</Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10 text-base px-8" asChild>
                <Link to="/destinations">تصفح الوجهات</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}