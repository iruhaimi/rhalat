import { useState, useCallback } from 'react';
import SEO from '@/components/seo/SEO';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Link } from 'react-router-dom';
import { filterArabicChars, filterNonNumeric } from '@/lib/inputFilters';
import { 
  RotateCcw, 
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Mail,
  HelpCircle,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  MessageCircle,
  Search,
  Send,
  FileText,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

export default function Refund() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const isRTL = language === 'ar';
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);
  const [faqSearch, setFaqSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    applicationNumber: '',
    email: '',
    phone: '',
    reason: '',
    additionalDetails: ''
  });

  const refundScenarios = [
    {
      status: 'full',
      titleAr: 'استرداد كامل',
      titleEn: 'Full Refund',
      descAr: 'إلغاء الطلب خلال 24 ساعة من الدفع وقبل البدء بالمعالجة',
      descEn: 'Cancellation within 24 hours of payment and before processing begins',
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      status: 'partial',
      titleAr: 'استرداد جزئي (75%)',
      titleEn: 'Partial Refund (75%)',
      descAr: 'إلغاء الطلب بعد 24 ساعة وقبل تقديمه للسفارة',
      descEn: 'Cancellation after 24 hours but before embassy submission',
      icon: AlertTriangle,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
    {
      status: 'none',
      titleAr: 'لا استرداد',
      titleEn: 'No Refund',
      descAr: 'بعد تقديم الطلب للسفارة أو في حالة رفض التأشيرة',
      descEn: 'After embassy submission or in case of visa rejection',
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
  ];

  const feeTypes = [
    {
      titleAr: 'رسوم الخدمة',
      titleEn: 'Service Fees',
      descAr: 'رسوم معالجة الطلب ومراجعة المستندات',
      descEn: 'Application processing and document review fees',
      refundableAr: 'قابلة للاسترداد وفق الشروط أعلاه',
      refundableEn: 'Refundable according to conditions above',
      isRefundable: true,
    },
    {
      titleAr: 'رسوم الموعد',
      titleEn: 'Appointment Fees',
      descAr: 'رسوم حجز موعد السفارة أو مركز التأشيرات',
      descEn: 'Embassy or visa center appointment booking fees',
      refundableAr: 'غير قابلة للاسترداد بعد حجز الموعد',
      refundableEn: 'Non-refundable once appointment is booked',
      isRefundable: false,
    },
    {
      titleAr: 'رسوم التأشيرة الحكومية',
      titleEn: 'Government Visa Fees',
      descAr: 'الرسوم المدفوعة للسفارة أو القنصلية',
      descEn: 'Fees paid to embassy or consulate',
      refundableAr: 'غير قابلة للاسترداد بعد دفعها للسفارة',
      refundableEn: 'Non-refundable once paid to embassy',
      isRefundable: false,
    },
    {
      titleAr: 'رسوم البريد السريع',
      titleEn: 'Express Shipping Fees',
      descAr: 'رسوم شحن المستندات',
      descEn: 'Document shipping fees',
      refundableAr: 'غير قابلة للاسترداد بعد الشحن',
      refundableEn: 'Non-refundable once shipped',
      isRefundable: false,
    },
    {
      titleAr: 'رسوم التأمين الصحي',
      titleEn: 'Health Insurance Fees',
      descAr: 'رسوم التأمين الصحي للسفر المطلوب لبعض الدول',
      descEn: 'Travel health insurance required for some countries',
      refundableAr: 'غير قابلة للاسترداد بعد إصدار الوثيقة',
      refundableEn: 'Non-refundable once policy is issued',
      isRefundable: false,
    },
  ];

  const refundFAQs = [
    {
      questionAr: 'كم يستغرق استرداد المبلغ؟',
      questionEn: 'How long does a refund take?',
      answerAr: 'يتم معالجة طلبات الاسترداد خلال 2-3 أيام عمل، ويصل المبلغ إلى حسابك خلال 7-14 يوم عمل حسب البنك.',
      answerEn: 'Refund requests are processed within 2-3 business days, and the amount reaches your account within 7-14 business days depending on your bank.',
    },
    {
      questionAr: 'هل يمكنني استرداد المبلغ إذا رُفضت تأشيرتي؟',
      questionEn: 'Can I get a refund if my visa is rejected?',
      answerAr: 'للأسف لا، رفض التأشيرة من السفارة لا يخولك للاسترداد لأن الرسوم تُدفع مقابل الخدمة المقدمة وليس مقابل نتيجة الطلب.',
      answerEn: 'Unfortunately no, visa rejection by the embassy does not entitle you to a refund as fees are paid for the service provided, not the application outcome.',
    },
    {
      questionAr: 'ماذا يحدث إذا ألغيت موعدي في السفارة؟',
      questionEn: 'What happens if I cancel my embassy appointment?',
      answerAr: 'رسوم الموعد غير قابلة للاسترداد بعد حجز الموعد، لكن قد نتمكن من إعادة جدولة الموعد إذا كان ذلك متاحاً.',
      answerEn: 'Appointment fees are non-refundable once booked, but we may be able to reschedule if available.',
    },
    {
      questionAr: 'كيف أطلب استرداد المبلغ؟',
      questionEn: 'How do I request a refund?',
      answerAr: 'أرسل بريداً إلكترونياً إلى info@rhalat.com يتضمن رقم طلبك، سبب الاسترداد، وتفاصيل الدفع.',
      answerEn: 'Send an email to info@rhalat.com with your application number, refund reason, and payment details.',
    },
    {
      questionAr: 'هل يمكنني الحصول على استرداد جزئي؟',
      questionEn: 'Can I get a partial refund?',
      answerAr: 'نعم، إذا ألغيت بعد 24 ساعة وقبل تقديم الطلب للسفارة، يمكنك الحصول على استرداد 75% من رسوم الخدمة.',
      answerEn: 'Yes, if you cancel after 24 hours but before embassy submission, you can get a 75% refund of service fees.',
    },
  ];

  const refundReasons = [
    { valueAr: 'تغيير خطط السفر', valueEn: 'Change of travel plans' },
    { valueAr: 'مشكلة مالية', valueEn: 'Financial issue' },
    { valueAr: 'وجدت خدمة أفضل', valueEn: 'Found a better service' },
    { valueAr: 'تأخر في معالجة الطلب', valueEn: 'Delay in processing' },
    { valueAr: 'خطأ في الطلب', valueEn: 'Error in application' },
    { valueAr: 'سبب آخر', valueEn: 'Other reason' },
  ];

  const handleFormChange = (field: string, value: string) => {
    // Filter phone field to only allow numbers
    const processedValue = field === 'phone' ? filterNonNumeric(value) : value;
    setFormData(prev => ({ ...prev, [field]: processedValue }));
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

  const handleSubmitRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.applicationNumber || !formData.email || !formData.reason) {
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL ? 'يرجى ملء جميع الحقول المطلوبة' : 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Bind the refund request to the authenticated user. RLS requires
      // user_id = auth.uid() so we can't trust the email field alone.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: isRTL ? 'يجب تسجيل الدخول' : 'Login required',
          description: isRTL
            ? 'يرجى تسجيل الدخول قبل تقديم طلب الاسترداد.'
            : 'Please sign in before submitting a refund request.',
          variant: 'destructive',
        });
        return;
      }

      // Insert refund request into database
      const { error } = await supabase
        .from('refund_requests')
        .insert({
          user_id: user.id,
          application_number: formData.applicationNumber.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone?.trim() || null,
          reason: formData.reason,
          additional_details: formData.additionalDetails?.trim() || null,
          status: 'pending'
        });

      if (error) {
        console.error('Error submitting refund request:', error);
        toast({
          title: isRTL ? 'خطأ' : 'Error',
          description: isRTL 
            ? 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.'
            : 'An error occurred while submitting your request. Please try again.',
          variant: 'destructive',
        });
        return;
      }
      
      toast({
        title: isRTL ? 'تم إرسال الطلب بنجاح' : 'Request Submitted Successfully',
        description: isRTL 
          ? 'سنراجع طلبك ونتواصل معك خلال 2-3 أيام عمل'
          : 'We will review your request and contact you within 2-3 business days',
      });
      
      setFormData({
        applicationNumber: '',
        email: '',
        phone: '',
        reason: '',
        additionalDetails: ''
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      toast({
        title: isRTL ? 'خطأ' : 'Error',
        description: isRTL 
          ? 'حدث خطأ غير متوقع. يرجى المحاولة لاحقاً.'
          : 'An unexpected error occurred. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredFAQs = refundFAQs.filter(faq => {
    if (!faqSearch.trim()) return true;
    const searchLower = faqSearch.toLowerCase();
    return (
      faq.questionAr.toLowerCase().includes(searchLower) ||
      faq.questionEn.toLowerCase().includes(searchLower) ||
      faq.answerAr.toLowerCase().includes(searchLower) ||
      faq.answerEn.toLowerCase().includes(searchLower)
    );
  });

  const processSteps = [
    {
      stepAr: '1',
      titleAr: 'تقديم الطلب',
      titleEn: 'Submit Request',
      descAr: 'أرسل طلب الاسترداد عبر البريد الإلكتروني مع رقم الطلب',
      descEn: 'Send refund request via email with application number',
    },
    {
      stepAr: '2',
      titleAr: 'المراجعة',
      titleEn: 'Review',
      descAr: 'سنراجع طلبك خلال 2-3 أيام عمل',
      descEn: 'We will review your request within 2-3 business days',
    },
    {
      stepAr: '3',
      titleAr: 'الإشعار',
      titleEn: 'Notification',
      descAr: 'ستتلقى إشعاراً بالموافقة أو الرفض مع السبب',
      descEn: 'You will receive approval or rejection notification with reason',
    },
    {
      stepAr: '4',
      titleAr: 'الاسترداد',
      titleEn: 'Refund',
      descAr: 'سيتم إرجاع المبلغ خلال 7-14 يوم عمل',
      descEn: 'Amount will be refunded within 7-14 business days',
    },
  ];

  return (
    <div className="min-h-screen">
      <SEO title="سياسة الاسترداد — عطلات رحلاتكم" description="تفاصيل سياسة الاسترداد ومتى يحق لك استرداد المبالغ المدفوعة لخدمات التأشيرات." path="/refund" />
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground py-16">
        <div className="container-section text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-6">
            <RotateCcw className="w-8 h-8" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {isRTL ? 'سياسة الاسترجاع' : 'Refund Policy'}
          </h1>
          <p className="text-lg opacity-90 max-w-2xl mx-auto">
            {isRTL 
              ? 'نؤمن بالشفافية الكاملة. تعرف على سياسة الاسترجاع وشروطها'
              : 'We believe in complete transparency. Learn about our refund policy and conditions'
            }
          </p>
        </div>
      </section>

      <div className="container-section py-12">
        <div className="max-w-4xl mx-auto">
          {/* Refund Scenarios */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">
              {isRTL ? 'حالات الاسترداد' : 'Refund Scenarios'}
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {refundScenarios.map((scenario, index) => {
                const Icon = scenario.icon;
                return (
                  <Card key={index} className="text-center">
                    <CardContent className="pt-8 pb-6">
                      <div className={`w-16 h-16 ${scenario.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                        <Icon className={`w-8 h-8 ${scenario.color}`} />
                      </div>
                      <h3 className="font-semibold text-lg mb-2">
                        {isRTL ? scenario.titleAr : scenario.titleEn}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {isRTL ? scenario.descAr : scenario.descEn}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Fee Types */}
          <section className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle>
                  {isRTL ? 'أنواع الرسوم وقابلية الاسترداد' : 'Fee Types and Refundability'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feeTypes.map((fee, index) => (
                    <div 
                      key={index} 
                      className="flex items-start gap-4 p-4 rounded-lg bg-muted/50"
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        fee.isRefundable ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {fee.isRefundable ? (
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">
                          {isRTL ? fee.titleAr : fee.titleEn}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-1">
                          {isRTL ? fee.descAr : fee.descEn}
                        </p>
                        <Badge variant={fee.isRefundable ? 'default' : 'secondary'}>
                          {isRTL ? fee.refundableAr : fee.refundableEn}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Refund Process */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">
              {isRTL ? 'خطوات طلب الاسترداد' : 'Refund Request Process'}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {processSteps.map((step, index) => (
                <Card key={index} className="relative">
                  <CardContent className="pt-8 pb-6 text-center">
                    <div className="w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                      {step.stepAr}
                    </div>
                    <h4 className="font-medium mb-2">
                      {isRTL ? step.titleAr : step.titleEn}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? step.descAr : step.descEn}
                    </p>
                  </CardContent>
                  {index < processSteps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -left-4 transform -translate-y-1/2">
                      <ArrowIcon className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          </section>

          {/* Important Notes */}
          <section className="mb-12">
            <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="w-5 h-5" />
                  {isRTL ? 'ملاحظات مهمة' : 'Important Notes'}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-amber-900 dark:text-amber-100">
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    {isRTL 
                      ? 'لا يمكن استرداد أي رسوم بعد تقديم الطلب للسفارة بأي حال من الأحوال'
                      : 'No fees can be refunded after embassy submission under any circumstances'
                    }
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    {isRTL 
                      ? 'في حالة رفض التأشيرة من السفارة، لا يحق للعميل استرداد أي رسوم'
                      : 'In case of visa rejection by the embassy, no fees are refundable'
                    }
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    {isRTL 
                      ? 'يتم خصم رسوم بوابة الدفع من أي مبلغ مسترد'
                      : 'Payment gateway fees are deducted from any refunded amount'
                    }
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-amber-600">•</span>
                    {isRTL 
                      ? 'طلبات الاسترداد يجب تقديمها خلال 30 يوماً من تاريخ الدفع'
                      : 'Refund requests must be submitted within 30 days of payment'
                    }
                  </li>
                </ul>
              </CardContent>
            </Card>
          </section>

          {/* Refund FAQs Section */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6 text-center">
              {isRTL ? 'الأسئلة الشائعة حول الاسترجاع' : 'Refund FAQs'}
            </h2>
            
            {/* Search Box */}
            <div className="relative mb-6">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={isRTL ? 'ابحث في الأسئلة الشائعة...' : 'Search FAQs...'}
                value={faqSearch}
                onChange={(e) => setFaqSearch(e.target.value)}
                className="pr-10"
              />
            </div>

            <div className="space-y-3">
              {filteredFAQs.length === 0 ? (
                <Card className="p-8 text-center">
                  <p className="text-muted-foreground">
                    {isRTL ? 'لا توجد نتائج مطابقة لبحثك' : 'No results match your search'}
                  </p>
                </Card>
              ) : (
                filteredFAQs.map((faq, index) => (
                  <Card 
                    key={index} 
                    className="overflow-hidden cursor-pointer transition-all hover:shadow-md"
                    onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
                  >
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-primary font-semibold text-sm">
                            {index + 1}
                          </div>
                          <h4 className="font-medium">
                            {isRTL ? faq.questionAr : faq.questionEn}
                          </h4>
                        </div>
                        <motion.div
                          animate={{ rotate: openFAQ === index ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        </motion.div>
                      </div>
                      <AnimatePresence>
                        {openFAQ === index && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 pt-0">
                              <div className="p-4 bg-muted/50 rounded-lg text-muted-foreground">
                                {isRTL ? faq.answerAr : faq.answerEn}
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </section>

          {/* Refund Request Form */}
          <section className="mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  {isRTL ? 'نموذج طلب الاسترداد' : 'Refund Request Form'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitRefund} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="applicationNumber">
                        {isRTL ? 'رقم الطلب *' : 'Application Number *'}
                      </Label>
                      <Input
                        id="applicationNumber"
                        placeholder={isRTL ? 'مثال: APP-123456' : 'e.g., APP-123456'}
                        value={formData.applicationNumber}
                        onChange={(e) => handleFormChange('applicationNumber', e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">
                        {isRTL ? 'البريد الإلكتروني *' : 'Email Address *'}
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        inputMode="email"
                        placeholder="example@email.com"
                        value={formData.email}
                        onChange={(e) => handleFormChange('email', e.target.value)}
                        onInput={handleEmailInput}
                        dir="ltr"
                        style={{ textAlign: 'left' }}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">
                        {isRTL ? 'رقم الهاتف' : 'Phone Number'}
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        inputMode="numeric"
                        maxLength={9}
                        placeholder="5XXXXXXXX"
                        value={formData.phone}
                        onChange={(e) => handleFormChange('phone', e.target.value)}
                        onInput={handlePhoneInput}
                        dir="ltr"
                        style={{ textAlign: 'left' }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reason">
                        {isRTL ? 'سبب الاسترداد *' : 'Refund Reason *'}
                      </Label>
                      <select
                        id="reason"
                        className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        value={formData.reason}
                        onChange={(e) => handleFormChange('reason', e.target.value)}
                        required
                      >
                        <option value="">{isRTL ? 'اختر السبب' : 'Select reason'}</option>
                        {refundReasons.map((reason, idx) => (
                          <option key={idx} value={isRTL ? reason.valueAr : reason.valueEn}>
                            {isRTL ? reason.valueAr : reason.valueEn}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="additionalDetails">
                      {isRTL ? 'تفاصيل إضافية' : 'Additional Details'}
                    </Label>
                    <Textarea
                      id="additionalDetails"
                      placeholder={isRTL 
                        ? 'أضف أي معلومات إضافية تساعدنا في معالجة طلبك...'
                        : 'Add any additional information that helps us process your request...'
                      }
                      value={formData.additionalDetails}
                      onChange={(e) => handleFormChange('additionalDetails', e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button type="submit" className="flex-1" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {isRTL ? 'جاري الإرسال...' : 'Submitting...'}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {isRTL ? 'إرسال طلب الاسترداد' : 'Submit Refund Request'}
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" asChild>
                      <a href="mailto:info@rhalat.com">
                        <Mail className="w-4 h-4" />
                        {isRTL ? 'أو أرسل بريداً إلكترونياً' : 'Or Send Email'}
                      </a>
                    </Button>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      {isRTL 
                        ? 'هل قدمت طلب استرداد مسبقاً؟'
                        : 'Already submitted a refund request?'
                      }
                    </p>
                    <Link 
                      to="/track-refund" 
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      {isRTL ? 'تتبع حالة طلبك' : 'Track your request status'}
                    </Link>
                  </div>

                  <p className="text-sm text-muted-foreground text-center">
                    {isRTL 
                      ? 'سنقوم بمراجعة طلبك والرد عليك خلال 2-3 أيام عمل'
                      : 'We will review your request and respond within 2-3 business days'
                    }
                  </p>
                </form>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
