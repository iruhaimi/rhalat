import { useState, useEffect } from 'react';
import SEO from '@/components/seo/SEO';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Clock, 
  CheckCircle2, 
  Info,
  ArrowLeft,
  Calendar,
  Shield,
  Sparkles,
  Tag,
  Wallet
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import SARSymbol from '@/components/ui/SARSymbol';

interface Country {
  id: string;
  name: string;
  code: string;
  flag_url: string | null;
}

interface VisaType {
  id: string;
  name: string;
  description: string | null;
  price: number;
  child_price: number | null;
  infant_price: number | null;
  government_fees: number | null;
  processing_days: number;
  validity_days: number | null;
  max_stay_days: number | null;
  entry_type: string | null;
  fee_type: string | null;
  price_notes: string | null;
  price_notes_en: string | null;
  requirements: string[];
  country: Country;
  country_id: string;
}

// Default multipliers for age-based pricing (used when custom prices not set)
const DEFAULT_CHILD_MULTIPLIER = 0.75;
const DEFAULT_INFANT_MULTIPLIER = 0.5;

// Pricing tiers labels
const TRAVELER_LABELS = {
  adult: { label: 'بالغ (12+ سنة)', labelEn: 'Adult (12+)' },
  child: { label: 'طفل (6-12 سنة)', labelEn: 'Child (6-12)' },
  infant: { label: 'رضيع (أقل من 6)', labelEn: 'Infant (<6)' },
};

export default function Pricing() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  const [visaTypes, setVisaTypes] = useState<VisaType[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<string>('all');

  useEffect(() => {
    async function fetchData() {
      const [visaRes, countryRes] = await Promise.all([
        supabase
          .from('visa_types')
          .select('*, country:countries(*)')
          .eq('is_active', true),
        supabase
          .from('countries')
          .select('*')
          .eq('is_active', true)
          .order('name', { ascending: true })
      ]);

      if (visaRes.data) {
        setVisaTypes(visaRes.data as unknown as VisaType[]);
      }
      if (countryRes.data) {
        setCountries(countryRes.data);
      }
      setIsLoading(false);
    }

    fetchData();
  }, []);

  // Helper function to check if visa fees are included for a group of visas
  const getVisaFeeStatus = (visas: VisaType[]) => {
    // Check if all visas in this country have fees included
    const allIncluded = visas.every(v => v.fee_type === 'included');
    const anyIncluded = visas.some(v => v.fee_type === 'included');
    
    if (allIncluded) {
      return { included: true, mixed: false };
    } else if (anyIncluded) {
      return { included: false, mixed: true };
    } else {
      return { included: false, mixed: false };
    }
  };

  const filteredVisaTypes = selectedCountry === 'all' 
    ? visaTypes 
    : visaTypes.filter(v => v.country?.code === selectedCountry);

  // Group visa types by country
  const visasByCountry = filteredVisaTypes.reduce((acc, visa) => {
    const countryCode = visa.country?.code || 'unknown';
    if (!acc[countryCode]) {
      acc[countryCode] = {
        country: visa.country,
        visas: []
      };
    }
    acc[countryCode].visas.push(visa);
    return acc;
  }, {} as Record<string, { country: Country; visas: VisaType[] }>);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container-section py-8">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <SEO title="الأسعار والباقات — عطلات رحلاتكم" description="اطّلع على أسعار خدمات التأشيرات لمختلف الدول مع تفاصيل واضحة للرسوم الحكومية ورسوم الخدمة." path="/pricing" />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-navy via-navy/95 to-brand py-20 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -right-20 w-64 h-64 bg-white/5 rounded-full"
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute bottom-10 left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"
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
              <Tag className="w-10 h-10 text-white" />
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {isRTL ? 'أسعار التأشيرات' : 'Visa Pricing'}
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              {isRTL 
                ? 'أسعار شفافة وواضحة لجميع أنواع التأشيرات. نوضح لك بالتفصيل ما هو مشمول وما هو غير مشمول.'
                : 'Transparent and clear pricing for all visa types. We detail what is included and what is not.'}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Info Cards */}
      <section className="py-8 -mt-8 relative z-10">
        <div className="container-section">
          <motion.div 
            className="grid gap-4 md:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-xl h-full">
                <CardContent className="p-5 flex items-start gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0"
                  >
                    <Wallet className="h-6 w-6 text-primary" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold mb-1">
                      {isRTL ? 'رسوم الخدمة' : 'Service Fee'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isRTL 
                        ? 'تشمل معالجة الطلب والمتابعة والدعم'
                        : 'Includes application processing, follow-up, and support'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-xl h-full">
                <CardContent className="p-5 flex items-start gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0"
                  >
                    <Info className="h-6 w-6 text-amber-600" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold mb-1">
                      {isRTL ? 'رسوم التأشيرة الحكومية' : 'Government Visa Fee'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isRTL 
                        ? 'قد تكون شاملة أو تُدفع منفصلة حسب الدولة'
                        : 'May be included or paid separately depending on the country'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={itemVariants}>
              <Card className="border-0 shadow-xl h-full">
                <CardContent className="p-5 flex items-start gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-12 h-12 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0"
                  >
                    <Shield className="h-6 w-6 text-green-600" />
                  </motion.div>
                  <div>
                    <h3 className="font-bold mb-1">
                      {isRTL ? 'ضمان الخدمة' : 'Service Guarantee'}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isRTL 
                        ? 'نضمن لك استرداد كامل لرسوم الخدمة المدفوعة لنا فقط، في حال رفض الطلب بسبب خطأ موثّق من مكتبنا ومُثبت من السفارة. لا يشمل ذلك رسوم السفارة أو مركز التأشيرات.'
                        : 'Full refund of our service fees only if your application is rejected due to a documented error from our office, confirmed by the embassy. Embassy and visa center fees are not included.'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Country Filter */}
      <section className="py-6">
        <div className="container-section">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center gap-2"
          >
            <span className="font-medium text-muted-foreground ml-2">
              {isRTL ? 'فلترة حسب الدولة:' : 'Filter by country:'}
            </span>
            <Button
              variant={selectedCountry === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCountry('all')}
              className="rounded-xl"
            >
              {isRTL ? 'جميع الدول' : 'All Countries'}
            </Button>
            {countries.map((country) => (
              <motion.div key={country.id} whileHover={{ scale: 1.05 }}>
                <Button
                  variant={selectedCountry === country.code ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCountry(country.code)}
                  className="gap-2 rounded-xl"
                >
                  <img 
                    src={country.flag_url || `https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
                    alt={country.name}
                    className="h-4 w-6 rounded object-cover"
                  />
                  {country.name}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Tables */}
      <section className="py-12">
        <div className="container-section">
          <motion.div 
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {Object.entries(visasByCountry).map(([countryCode, { country, visas }]) => {
              const feeStatus = getVisaFeeStatus(visas);
              
              return (
                <motion.div key={countryCode} variants={itemVariants}>
                  <Card className="overflow-hidden shadow-xl border-0">
                    <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-transparent">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                          <motion.img 
                            whileHover={{ scale: 1.1 }}
                            src={country?.flag_url || `https://flagcdn.com/w80/${countryCode.toLowerCase()}.png`}
                            alt={country?.name}
                            className="h-12 w-16 rounded-xl object-cover shadow-lg"
                          />
                          <div>
                            <CardTitle className="text-xl">{country?.name}</CardTitle>
                            <CardDescription>
                              {visas.length} {isRTL ? 'أنواع تأشيرات متاحة' : 'visa types available'}
                            </CardDescription>
                          </div>
                        </div>
                        
                        {/* Government Fee Status - Now Dynamic from Database */}
                        <div className="flex items-center gap-2">
                          {feeStatus.included ? (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 gap-1 border-0">
                              <CheckCircle2 className="h-3 w-3" />
                              {isRTL ? 'رسوم التأشيرة شاملة' : 'Visa fee included'}
                            </Badge>
                          ) : feeStatus.mixed ? (
                            <Badge variant="secondary" className="gap-1">
                              <Info className="h-3 w-3" />
                              {isRTL ? 'راجع تفاصيل كل تأشيرة' : 'See visa details'}
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <Info className="h-3 w-3" />
                              {isRTL ? 'رسوم التأشيرة منفصلة' : 'Visa fee separate'}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="p-0">
                      {/* Desktop Table View */}
                      <div className="hidden lg:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead className="min-w-[180px]">
                                {isRTL ? 'نوع التأشيرة' : 'Visa Type'}
                              </TableHead>
                              <TableHead className="text-center">
                                {isRTL ? 'بالغ' : 'Adult'}
                                <span className="block text-xs font-normal text-muted-foreground">
                                  (12+ {isRTL ? 'سنة' : 'years'})
                                </span>
                              </TableHead>
                              <TableHead className="text-center">
                                {isRTL ? 'طفل' : 'Child'}
                                <span className="block text-xs font-normal text-muted-foreground">
                                  (6-12 {isRTL ? 'سنة' : 'years'})
                                </span>
                              </TableHead>
                              <TableHead className="text-center">
                                {isRTL ? 'رضيع' : 'Infant'}
                                <span className="block text-xs font-normal text-muted-foreground">
                                  ({'<'}6 {isRTL ? 'سنوات' : 'years'})
                                </span>
                              </TableHead>
                              <TableHead className="text-center">
                                <SARSymbol size="xs" className="inline-block ml-1" />
                                {isRTL ? 'رسوم التأشيرة' : 'Visa Fee'}
                              </TableHead>
                              <TableHead className="text-center">
                                <Clock className="h-4 w-4 inline-block ml-1" />
                                {isRTL ? 'المعالجة' : 'Processing'}
                              </TableHead>
                              <TableHead className="text-center">
                                <Calendar className="h-4 w-4 inline-block ml-1" />
                                {isRTL ? 'الصلاحية' : 'Validity'}
                              </TableHead>
                              <TableHead className="text-center">
                                {isRTL ? 'نوع الدخول' : 'Entry Type'}
                              </TableHead>
                              <TableHead className="text-center min-w-[130px]">
                                {isRTL ? 'ملاحظات' : 'Notes'}
                              </TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {visas.map((visa) => {
                              const adultPrice = visa.price;
                              const childPrice = visa.child_price ?? Math.round(visa.price * DEFAULT_CHILD_MULTIPLIER);
                              const infantPrice = visa.infant_price ?? Math.round(visa.price * DEFAULT_INFANT_MULTIPLIER);
                              const govFees = visa.government_fees ?? 0;
                              
                              return (
                                <TableRow key={visa.id} className="hover:bg-muted/30">
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">{visa.name}</p>
                                      <p className="text-xs text-muted-foreground line-clamp-1">
                                        {visa.description}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="font-bold text-primary flex items-center justify-center gap-1">
                                      {adultPrice}
                                      <SARSymbol size="sm" className="text-primary" />
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="font-bold text-primary flex items-center justify-center gap-1">
                                      {childPrice}
                                      <SARSymbol size="sm" className="text-primary" />
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="font-bold text-primary flex items-center justify-center gap-1">
                                      {infantPrice}
                                      <SARSymbol size="sm" className="text-primary" />
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    {visa.fee_type === 'included' ? (
                                      <span className="font-bold text-green-600 flex items-center justify-center gap-1">
                                        {govFees > 0 ? govFees : 0}
                                        <SARSymbol size="sm" className="text-green-600" />
                                        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 text-[10px] ms-1">
                                          {isRTL ? 'شامل' : 'Inc.'}
                                        </Badge>
                                      </span>
                                    ) : (
                                      <span className="font-bold text-amber-600 flex items-center justify-center gap-1">
                                        {govFees}
                                        <SARSymbol size="sm" className="text-amber-600" />
                                      </span>
                                    )}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="outline" className="rounded-lg">
                                      {visa.processing_days} {isRTL ? 'أيام' : 'days'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge variant="outline" className="rounded-lg">
                                      {visa.validity_days || '-'} {isRTL ? 'يوم' : 'days'}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge 
                                      variant={visa.entry_type === 'multiple' ? 'default' : 'secondary'}
                                      className="rounded-lg"
                                    >
                                      {visa.entry_type === 'multiple' 
                                        ? (isRTL ? 'متعدد' : 'Multiple')
                                        : (isRTL ? 'مفرد' : 'Single')}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Badge 
                                      variant={visa.fee_type === 'included' ? 'default' : 'secondary'}
                                      className={`rounded-lg text-xs ${visa.fee_type === 'included' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0' : ''}`}
                                    >
                                      {isRTL 
                                        ? (visa.price_notes || (visa.fee_type === 'included' ? 'شامل الرسوم' : 'رسوم منفصلة'))
                                        : (visa.price_notes_en || (visa.fee_type === 'included' ? 'Fees Included' : 'Fees Separate'))}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <Button size="sm" className="rounded-xl" asChild>
                                      <Link to={`/apply?country=${countryCode}&visa=${visa.id}`}>
                                        {isRTL ? 'قدّم الآن' : 'Apply'}
                                        <ArrowLeft className="h-4 w-4 mr-1" />
                                      </Link>
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="lg:hidden p-4 space-y-4">
                        {visas.map((visa) => {
                          const adultPrice = visa.price;
                          const childPrice = visa.child_price ?? Math.round(visa.price * DEFAULT_CHILD_MULTIPLIER);
                          const infantPrice = visa.infant_price ?? Math.round(visa.price * DEFAULT_INFANT_MULTIPLIER);
                          const govFees = visa.government_fees ?? 0;
                          
                          return (
                            <motion.div 
                              key={visa.id}
                              className="bg-card border rounded-xl p-4 space-y-4"
                              whileHover={{ scale: 1.01 }}
                            >
                              {/* Header */}
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <h4 className="font-bold text-base">{visa.name}</h4>
                                  {visa.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {visa.description}
                                    </p>
                                  )}
                                </div>
                                <Badge 
                                  variant={visa.entry_type === 'multiple' ? 'default' : 'secondary'}
                                  className="rounded-lg shrink-0"
                                >
                                  {visa.entry_type === 'multiple' 
                                    ? (isRTL ? 'متعدد' : 'Multiple')
                                    : (isRTL ? 'مفرد' : 'Single')}
                                </Badge>
                              </div>

                              {/* Prices Grid */}
                              <div className="grid grid-cols-3 gap-2 text-center">
                                <div className="bg-primary/5 rounded-lg p-2">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    {isRTL ? 'بالغ' : 'Adult'}
                                  </p>
                                  <span className="font-bold text-primary flex items-center justify-center gap-0.5 text-sm">
                                    {adultPrice}
                                    <SARSymbol size="xs" className="text-primary" />
                                  </span>
                                </div>
                                <div className="bg-primary/5 rounded-lg p-2">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    {isRTL ? 'طفل' : 'Child'}
                                  </p>
                                  <span className="font-bold text-primary flex items-center justify-center gap-0.5 text-sm">
                                    {childPrice}
                                    <SARSymbol size="xs" className="text-primary" />
                                  </span>
                                </div>
                                <div className="bg-primary/5 rounded-lg p-2">
                                  <p className="text-xs text-muted-foreground mb-1">
                                    {isRTL ? 'رضيع' : 'Infant'}
                                  </p>
                                  <span className="font-bold text-primary flex items-center justify-center gap-0.5 text-sm">
                                    {infantPrice}
                                    <SARSymbol size="xs" className="text-primary" />
                                  </span>
                                </div>
                              </div>

                              {/* Gov Fees */}
                              <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
                                <span className="text-sm text-muted-foreground">
                                  {isRTL ? 'رسوم التأشيرة الحكومية' : 'Government Visa Fee'}
                                </span>
                                {visa.fee_type === 'included' ? (
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-green-600 flex items-center gap-1">
                                      {govFees > 0 ? govFees : 0}
                                      <SARSymbol size="sm" className="text-green-600" />
                                    </span>
                                    <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0 text-xs">
                                      {isRTL ? 'شامل' : 'Inc.'}
                                    </Badge>
                                  </div>
                                ) : (
                                  <span className="font-bold text-amber-600 flex items-center gap-1">
                                    {govFees}
                                    <SARSymbol size="sm" className="text-amber-600" />
                                  </span>
                                )}
                              </div>

                              {/* Details */}
                              <div className="flex items-center gap-4 text-sm">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span>{visa.processing_days} {isRTL ? 'أيام' : 'days'}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Calendar className="h-4 w-4 text-muted-foreground" />
                                  <span>{visa.validity_days || '-'} {isRTL ? 'يوم' : 'days'}</span>
                                </div>
                              </div>

                              {/* Notes Badge */}
                              <Badge 
                                variant={visa.fee_type === 'included' ? 'default' : 'secondary'}
                                className={`w-full justify-center py-1.5 text-xs ${visa.fee_type === 'included' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border-0' : ''}`}
                              >
                                {isRTL 
                                  ? (visa.price_notes || (visa.fee_type === 'included' ? 'شامل الرسوم' : 'رسوم منفصلة'))
                                  : (visa.price_notes_en || (visa.fee_type === 'included' ? 'Fees Included' : 'Fees Separate'))}
                              </Badge>

                              {/* Apply Button */}
                              <Button className="w-full rounded-xl" asChild>
                                <Link to={`/apply?country=${countryCode}&visa=${visa.id}`}>
                                  {isRTL ? 'قدّم الآن' : 'Apply Now'}
                                  <ArrowLeft className="h-4 w-4 mr-1" />
                                </Link>
                              </Button>
                            </motion.div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container-section">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Card className="bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border-primary/20 overflow-hidden">
              <CardContent className="py-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6"
                >
                  <Sparkles className="w-8 h-8 text-primary" />
                </motion.div>
                <h3 className="text-2xl md:text-3xl font-bold mb-4">
                  {isRTL ? 'هل لديك أسئلة حول الأسعار؟' : 'Have Questions About Pricing?'}
                </h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  {isRTL 
                    ? 'فريقنا جاهز لمساعدتك وتوضيح أي استفسارات حول الأسعار والخدمات'
                    : 'Our team is ready to help you and clarify any questions about pricing and services'}
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Button size="lg" className="rounded-xl" asChild>
                    <Link to="/contact">
                      {isRTL ? 'تواصل معنا' : 'Contact Us'}
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="rounded-xl" asChild>
                    <Link to="/faq">
                      {isRTL ? 'الأسئلة الشائعة' : 'FAQ'}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
