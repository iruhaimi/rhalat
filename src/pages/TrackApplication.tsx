import { useState, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { filterArabicChars, filterNonNumeric } from '@/lib/inputFilters';
import { 
  Search, 
  FileText, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Loader2,
  MapPin,
  Calendar,
  CreditCard,
  Send,
  Eye,
  Ban,
  Package,
  Sparkles,
  Timer
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import type { ApplicationStatus } from '@/types/database';

interface ApplicationResult {
  id: string;
  display_number: string | null;
  status: ApplicationStatus;
  travel_date: string | null;
  created_at: string;
  submitted_at: string | null;
  approved_at: string | null;
  visa_type: {
    name: string;
    processing_days: number;
    country: {
      name: string;
      flag_url: string | null;
    };
  };
  status_history: {
    id: string;
    old_status: ApplicationStatus | null;
    new_status: ApplicationStatus;
    created_at: string;
    notes: string | null;
  }[];
}

const STATUS_CONFIG: Record<ApplicationStatus, { 
  icon: React.ComponentType<{ className?: string }>; 
  color: string; 
  bgColor: string;
  labelAr: string;
  labelEn: string;
}> = {
  draft: { 
    icon: FileText, 
    color: 'text-muted-foreground', 
    bgColor: 'bg-muted',
    labelAr: 'مسودة',
    labelEn: 'Draft'
  },
  pending_payment: { 
    icon: CreditCard, 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    labelAr: 'بانتظار الدفع',
    labelEn: 'Pending Payment'
  },
  submitted: { 
    icon: Send, 
    color: 'text-blue-600', 
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    labelAr: 'تم الإرسال',
    labelEn: 'Submitted'
  },
  under_review: { 
    icon: Eye, 
    color: 'text-purple-600', 
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    labelAr: 'قيد المراجعة',
    labelEn: 'Under Review'
  },
  documents_required: { 
    icon: AlertCircle, 
    color: 'text-orange-600', 
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    labelAr: 'مطلوب مستندات',
    labelEn: 'Documents Required'
  },
  processing: { 
    icon: Clock, 
    color: 'text-cyan-600', 
    bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    labelAr: 'قيد المعالجة',
    labelEn: 'Processing'
  },
  approved: { 
    icon: CheckCircle2, 
    color: 'text-green-600', 
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    labelAr: 'تمت الموافقة',
    labelEn: 'Approved'
  },
  rejected: { 
    icon: XCircle, 
    color: 'text-red-600', 
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    labelAr: 'مرفوض',
    labelEn: 'Rejected'
  },
  cancelled: { 
    icon: Ban, 
    color: 'text-gray-600', 
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    labelAr: 'ملغي',
    labelEn: 'Cancelled'
  },
  whatsapp_pending: { 
    icon: Clock, 
    color: 'text-amber-600', 
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    labelAr: 'بانتظار واتساب',
    labelEn: 'WhatsApp Pending'
  },
};

// Timeline step order for progress visualization
const STATUS_ORDER: ApplicationStatus[] = [
  'draft',
  'pending_payment',
  'submitted',
  'under_review',
  'processing',
  'approved'
];

export default function TrackApplication() {
  const { language } = useLanguage();
  const isRTL = language === 'ar';
  
  const [applicationNumber, setApplicationNumber] = useState('');
  const [searchType, setSearchType] = useState<'phone' | 'email'>('phone');
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApplicationResult | null>(null);
  const [searched, setSearched] = useState(false);

  // Handle email/phone input based on search type
  const handleSearchValueInput = useCallback((e: React.FormEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    if (searchType === 'email') {
      const filtered = filterArabicChars(input.value);
      if (filtered !== input.value) {
        input.value = filtered;
        setSearchValue(filtered);
      }
    } else {
      let filtered = filterNonNumeric(input.value);
      // Limit to 9 digits for phone
      if (filtered.length > 9) {
        filtered = filtered.slice(0, 9);
      }
      if (filtered !== input.value) {
        input.value = filtered;
        setSearchValue(filtered);
      }
    }
  }, [searchType]);

  // Normalize input like "vf 2026 0120", "2026-0120", "20260120" to "VF-2026-0120"
  const normalizeAppNumber = (raw: string): string => {
    const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const withoutPrefix = cleaned.startsWith('VF') ? cleaned.slice(2) : cleaned;
    if (withoutPrefix.length >= 8) {
      const year = withoutPrefix.slice(0, 4);
      const seq = withoutPrefix.slice(4);
      return `VF-${year}-${seq}`;
    }
    return raw.toUpperCase().trim();
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSearched(true);
    
    if (!applicationNumber.trim()) {
      setError(isRTL ? 'يرجى إدخال رقم الطلب' : 'Please enter application number');
      return;
    }
    
    if (!searchValue.trim()) {
      setError(isRTL 
        ? `يرجى إدخال ${searchType === 'phone' ? 'رقم الجوال' : 'البريد الإلكتروني'}`
        : `Please enter ${searchType === 'phone' ? 'phone number' : 'email address'}`
      );
      return;
    }

    setIsLoading(true);

    try {
      const normalized = normalizeAppNumber(applicationNumber);
      const { data: application, error: appError } = await supabase
        .from('applications')
        .select(`
          id,
          display_number,
          status,
          travel_date,
          created_at,
          submitted_at,
          approved_at,
          visa_type:visa_types(
            name,
            processing_days,
            country:countries(name, flag_url)
          )
        `)
        .eq('display_number', normalized)
        .maybeSingle();

      if (appError) throw appError;

      if (!application) {
        setError(isRTL 
          ? 'لم يتم العثور على الطلب. يرجى التحقق من رقم الطلب والبيانات المدخلة.'
          : 'Application not found. Please verify the application number and entered details.'
        );
        setIsLoading(false);
        return;
      }

      // Fetch status history
      const { data: history, error: historyError } = await supabase
        .from('application_status_history')
        .select('id, old_status, new_status, created_at, notes')
        .eq('application_id', application.id)
        .order('created_at', { ascending: true });

      if (historyError) throw historyError;

      setResult({
        ...application,
        visa_type: application.visa_type as any,
        status_history: history || []
      });

    } catch (err: any) {
      console.error('Search error:', err);
      setError(isRTL 
        ? 'حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.'
        : 'An error occurred while searching. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd MMM yyyy - HH:mm', {
      locale: isRTL ? ar : enUS
    });
  };

  const getStatusIndex = (status: ApplicationStatus): number => {
    const index = STATUS_ORDER.indexOf(status);
    return index >= 0 ? index : -1;
  };

  const currentStatusIndex = result ? getStatusIndex(result.status) : -1;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/95 to-primary/85 py-20 overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-20 right-20 w-32 h-32 bg-white/10 rounded-3xl blur-xl"
          />
          <motion.div
            animate={{ y: [0, 20, 0] }}
            transition={{ duration: 8, repeat: Infinity, delay: 1 }}
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
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm mb-6"
            >
              <Package className="w-10 h-10 text-white" />
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {isRTL ? 'تتبع طلبك' : 'Track Your Application'}
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              {isRTL 
                ? 'أدخل رقم الطلب وبيانات التحقق لمعرفة حالة طلبك ومراحل المعالجة'
                : 'Enter your application number and verification details to check your application status'
              }
            </p>
          </motion.div>
        </div>
      </section>

      <div className="container-section py-12">
        <div className="max-w-3xl mx-auto">
          {/* Search Form */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="mb-8 shadow-2xl border-0 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Search className="w-5 h-5 text-primary" />
                  </div>
                  {isRTL ? 'بحث عن الطلب' : 'Search Application'}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSearch} className="space-y-6">
                  {/* Application Number */}
                  <div className="space-y-2">
                    <Label htmlFor="applicationNumber">
                      {isRTL ? 'رقم الطلب' : 'Application Number'}
                    </Label>
                    <Input
                      id="applicationNumber"
                      type="text"
                      placeholder={isRTL ? 'أدخل رقم الطلب (مثال: VF-2026-0120)' : 'Enter application number (e.g. VF-2026-0120)'}
                      value={applicationNumber}
                      onChange={(e) => setApplicationNumber(e.target.value.toUpperCase())}
                      className="text-base rounded-xl font-mono uppercase tracking-wider"
                      dir="ltr"
                    />
                  </div>

                  {/* Search Type Selection */}
                  <div className="space-y-3">
                    <Label>
                      {isRTL ? 'التحقق عبر' : 'Verify using'}
                    </Label>
                    <RadioGroup
                      value={searchType}
                      onValueChange={(v) => setSearchType(v as 'phone' | 'email')}
                      className="flex gap-6"
                    >
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="phone" id="phone" />
                        <Label htmlFor="phone" className="cursor-pointer">
                          {isRTL ? 'رقم الجوال' : 'Phone Number'}
                        </Label>
                      </div>
                      <div className="flex items-center gap-2">
                        <RadioGroupItem value="email" id="email" />
                        <Label htmlFor="email" className="cursor-pointer">
                          {isRTL ? 'البريد الإلكتروني' : 'Email Address'}
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Search Value Input */}
                  <div className="space-y-2">
                    <Label htmlFor="searchValue">
                      {searchType === 'phone' 
                        ? (isRTL ? 'رقم الجوال' : 'Phone Number')
                        : (isRTL ? 'البريد الإلكتروني' : 'Email Address')
                      }
                    </Label>
                    <Input
                      id="searchValue"
                      type={searchType === 'email' ? 'email' : 'tel'}
                      inputMode={searchType === 'email' ? 'email' : 'numeric'}
                      maxLength={searchType === 'phone' ? 9 : undefined}
                      placeholder={searchType === 'phone' 
                        ? '5XXXXXXXX'
                        : 'example@email.com'
                      }
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      onInput={handleSearchValueInput}
                      className="text-base rounded-xl text-left"
                      dir="ltr"
                      style={{ textAlign: 'left' }}
                    />
                  </div>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-3 text-destructive bg-destructive/10 p-4 rounded-xl"
                      >
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <span className="text-sm">{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full rounded-xl" 
                    size="lg"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin ml-2" />
                        {isRTL ? 'جاري البحث...' : 'Searching...'}
                      </>
                    ) : (
                      <>
                        <Search className="w-5 h-5 ml-2" />
                        {isRTL ? 'بحث' : 'Search'}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Section */}
          <AnimatePresence>
            {searched && !isLoading && result && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="space-y-6"
              >
                {/* Application Summary Card */}
                <Card className="shadow-xl border-0 overflow-hidden">
                  <div className="h-2 bg-gradient-to-r from-primary to-primary/50" />
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4">
                        {result.visa_type?.country?.flag_url && (
                          <motion.img 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            src={result.visa_type.country.flag_url} 
                            alt="" 
                            className="w-14 h-10 object-cover rounded-lg shadow-lg"
                          />
                        )}
                        <div>
                          <CardTitle className="text-xl">
                            {result.visa_type?.country?.name || 'Unknown'}
                          </CardTitle>
                          <p className="text-muted-foreground">
                            {result.visa_type?.name}
                          </p>
                        </div>
                      </div>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <Badge 
                          className={`${STATUS_CONFIG[result.status].bgColor} ${STATUS_CONFIG[result.status].color} border-0 px-4 py-2 text-sm`}
                        >
                          {(() => {
                            const IconComponent = STATUS_CONFIG[result.status].icon;
                            return <IconComponent className="w-4 h-4 ml-2" />;
                          })()}
                          {isRTL 
                            ? STATUS_CONFIG[result.status].labelAr 
                            : STATUS_CONFIG[result.status].labelEn
                          }
                        </Badge>
                      </motion.div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                        <Calendar className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">{isRTL ? 'تاريخ الإنشاء' : 'Created'}</p>
                          <p className="font-medium text-sm">
                            {formatDate(result.created_at)}
                          </p>
                        </div>
                      </div>
                      {result.travel_date && (
                        <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                          <MapPin className="w-5 h-5 text-primary" />
                          <div>
                            <p className="text-xs text-muted-foreground">{isRTL ? 'تاريخ السفر' : 'Travel Date'}</p>
                            <p className="font-medium text-sm">
                              {format(new Date(result.travel_date), 'dd MMM yyyy', {
                                locale: isRTL ? ar : enUS
                              })}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
                        <FileText className="w-5 h-5 text-primary" />
                        <div>
                          <p className="text-xs text-muted-foreground">{isRTL ? 'رقم الطلب' : 'App ID'}</p>
                          <p className="font-medium text-sm font-mono">
                            {result.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Estimated Time Card */}
                {result.submitted_at && !['approved', 'rejected', 'cancelled', 'draft'].includes(result.status) && (
                  <Card className="shadow-xl border-0 bg-gradient-to-r from-primary/5 to-transparent">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                            <Timer className="w-7 h-7 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-bold text-lg">
                              {isRTL ? 'الوقت المتبقي المتوقع' : 'Estimated Time Remaining'}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {isRTL ? 'بناءً على وقت المعالجة المعتاد' : 'Based on standard processing time'}
                            </p>
                          </div>
                        </div>
                        <div className="text-center">
                          {(() => {
                            const processingDays = result.visa_type?.processing_days || 7;
                            const daysElapsed = differenceInDays(new Date(), new Date(result.submitted_at!));
                            const daysRemaining = Math.max(0, processingDays - daysElapsed);
                            const progressPercent = Math.min(100, (daysElapsed / processingDays) * 100);
                            
                            return (
                              <div className="flex flex-col items-center">
                                <div className="text-4xl font-bold text-primary">{daysRemaining}</div>
                                <div className="text-sm text-muted-foreground">
                                  {isRTL ? 'أيام عمل' : 'business days'}
                                </div>
                                <Progress value={progressPercent} className="w-24 h-2 mt-2" />
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Progress Timeline */}
                <Card className="shadow-xl border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      {isRTL ? 'مراحل معالجة الطلب' : 'Application Progress'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* Visual Progress Steps */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between relative">
                        {/* Progress Line */}
                        <div className="absolute top-5 left-0 right-0 h-1 bg-muted rounded-full" />
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.max(0, (currentStatusIndex / (STATUS_ORDER.length - 1)) * 100)}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className="absolute top-5 h-1 bg-primary rounded-full"
                          style={{ [isRTL ? 'right' : 'left']: 0 }}
                        />
                        
                        {/* Steps */}
                        {STATUS_ORDER.map((status, index) => {
                          const config = STATUS_CONFIG[status];
                          const Icon = config.icon;
                          const isCompleted = currentStatusIndex >= index;
                          const isCurrent = result.status === status;
                          
                          return (
                            <motion.div 
                              key={status}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: index * 0.1 }}
                              className="relative z-10 flex flex-col items-center"
                            >
                              <div 
                                className={`
                                  w-10 h-10 rounded-full flex items-center justify-center transition-all
                                  ${isCompleted 
                                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30' 
                                    : 'bg-muted text-muted-foreground'
                                  }
                                  ${isCurrent ? 'ring-4 ring-primary/20' : ''}
                                `}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <span className={`
                                mt-2 text-xs text-center max-w-[60px] hidden sm:block
                                ${isCompleted ? 'text-foreground font-medium' : 'text-muted-foreground'}
                              `}>
                                {isRTL ? config.labelAr : config.labelEn}
                              </span>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Status History */}
                    {result.status_history.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-semibold mb-4">
                          {isRTL ? 'سجل التحديثات' : 'Update History'}
                        </h4>
                        {result.status_history.map((entry, index) => {
                          const config = STATUS_CONFIG[entry.new_status];
                          const Icon = config.icon;
                          
                          return (
                            <motion.div
                              key={entry.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-start gap-3 bg-muted/30 rounded-xl p-4"
                            >
                              <div className={`w-8 h-8 rounded-lg ${config.bgColor} flex items-center justify-center flex-shrink-0`}>
                                <Icon className={`w-4 h-4 ${config.color}`} />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <span className={`font-medium ${config.color}`}>
                                    {isRTL ? config.labelAr : config.labelEn}
                                  </span>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(entry.created_at)}
                                  </span>
                                </div>
                                {entry.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {entry.notes}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* No Results */}
          <AnimatePresence>
            {searched && !isLoading && !result && !error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-16"
              >
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {isRTL ? 'لم يتم العثور على نتائج' : 'No Results Found'}
                </h3>
                <p className="text-muted-foreground">
                  {isRTL ? 'تأكد من صحة رقم الطلب والبيانات المدخلة' : 'Please verify the application number and details'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
