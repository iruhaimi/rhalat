import { useState } from 'react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import SARSymbol from '@/components/ui/SARSymbol';
import { 
  ArrowLeft, 
  ArrowRight, 
  CreditCard, 
  Wallet, 
  Building2,
  Shield,
  Lock,
  CheckCircle2,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  FileText,
  MessageCircle,
  AlertCircle,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const paymentMethods = [
  { 
    id: 'card', 
    label: { ar: 'بطاقة ائتمانية', en: 'Credit Card' },
    description: { ar: 'Visa, Mastercard, مدى', en: 'Visa, Mastercard, Mada' },
    icon: CreditCard,
  },
  { 
    id: 'apple_pay', 
    label: { ar: 'Apple Pay', en: 'Apple Pay' },
    description: { ar: 'ادفع بسهولة', en: 'Pay easily' },
    icon: Wallet,
  },
  { 
    id: 'bank_transfer', 
    label: { ar: 'تحويل بنكي', en: 'Bank Transfer' },
    description: { ar: 'تحويل مباشر للحساب', en: 'Direct bank transfer' },
    icon: Building2,
  },
];

export default function Step6Payment() {
  const { t, direction, language } = useLanguage();
  const { applicationData, updateApplicationData, calculateTotal, goToPreviousStep, resetApplication, setCurrentStep, draftId } = useApplication();
  const { profile } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmittingWhatsApp, setIsSubmittingWhatsApp] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { serviceTotal, governmentTotal, grandTotal, breakdown } = calculateTotal();
  
  const ArrowPrevIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  // Required documents for online payment
  const REQUIRED_DOC_TYPES = ['passport', 'photo'];
  const uploadedTypes = applicationData.uploadedDocuments.filter(d => d.uploaded).map(d => d.type);
  const missingDocs = REQUIRED_DOC_TYPES.filter(t => !uploadedTypes.includes(t));
  const docsComplete = missingDocs.length === 0;

  const submissionMethod = applicationData.submissionMethod;

  const buildWhatsAppMessage = (appNumber: string) => {
    const travelersStr = [
      `${applicationData.travelers.adults} بالغ`,
      applicationData.travelers.children > 0 ? `${applicationData.travelers.children} طفل` : null,
      applicationData.travelers.infants > 0 ? `${applicationData.travelers.infants} رضيع` : null,
    ].filter(Boolean).join('، ');

    const travelDateStr = applicationData.travelDate
      ? format(applicationData.travelDate, 'PPP', { locale: ar })
      : 'غير محدد';

    return `مرحباً، أرغب بإكمال طلب التأشيرة عبر واتساب

📋 رقم الطلب: ${appNumber}
👤 الاسم: ${applicationData.fullName}
📧 البريد: ${applicationData.email}
📱 الجوال: ${applicationData.countryCode} ${applicationData.phone}

🌍 الدولة: ${applicationData.countryName}
📄 نوع التأشيرة: ${applicationData.visaTypeName}
📅 تاريخ السفر: ${travelDateStr}
👥 المسافرون: ${travelersStr}

💰 المبلغ الإجمالي: ${grandTotal.toLocaleString()} ر.س
✅ موافق على الشروط والأحكام

جاهز لإرسال المستندات وإكمال الدفع.`;
  };

  const handleSubmitViaWhatsApp = async () => {
    if (!profile) {
      toast({
        title: 'خطأ',
        description: 'يجب تسجيل الدخول أولاً',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingWhatsApp(true);

    try {
      const draftPayload = {
        user_id: profile.id,
        visa_type_id: applicationData.visaTypeId,
        travel_date: applicationData.travelDate ? applicationData.travelDate.toISOString().split('T')[0] : null,
        status: 'whatsapp_pending' as const,
        submission_method: 'whatsapp',
        purpose_of_travel: JSON.stringify({
          fullName: applicationData.fullName,
          email: applicationData.email,
          phone: applicationData.phone,
          countryCode: applicationData.countryCode,
          travelers: applicationData.travelers,
          checkedRequirements: applicationData.checkedRequirements,
          totalAmount: grandTotal,
          termsAccepted: applicationData.termsAccepted,
        }),
      };

      let appId = draftId;
      let displayNumber: string | null = null;

      if (draftId) {
        const { data, error } = await supabase
          .from('applications')
          .update({
            status: 'whatsapp_pending',
            submission_method: 'whatsapp',
            purpose_of_travel: draftPayload.purpose_of_travel,
            updated_at: new Date().toISOString(),
          })
          .eq('id', draftId)
          .select('id, display_number')
          .single();
        if (error) throw error;
        displayNumber = data.display_number;
      } else {
        const { data, error } = await supabase
          .from('applications')
          .insert(draftPayload)
          .select('id, display_number')
          .single();
        if (error) throw error;
        appId = data.id;
        displayNumber = data.display_number;
      }

      const appNumber = displayNumber || `VF-${Date.now().toString(36).toUpperCase()}`;
      const message = buildWhatsAppMessage(appNumber);
      const whatsappUrl = `https://wa.me/966562525665?text=${encodeURIComponent(message)}`;

      // Open WhatsApp in top-level window (bypass iframe in preview)
      try {
        if (window.top && window.top !== window.self) {
          window.top.location.href = whatsappUrl;
        } else {
          window.open(whatsappUrl, '_blank');
        }
      } catch {
        window.open(whatsappUrl, '_blank');
      }

      toast({
        title: '✅ تم تسجيل طلبك',
        description: `رقم طلبك: ${appNumber}. سيتواصل معك موظفنا عبر واتساب`,
      });

      setTimeout(() => {
        resetApplication();
        navigate(`/payment-success?app=${appNumber}&via=whatsapp`);
      }, 1500);
    } catch (error: any) {
      console.error('WhatsApp submission error:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشل إرسال الطلب، حاول مرة أخرى',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingWhatsApp(false);
    }
  };

  const handlePayment = async () => {
    if (!docsComplete) {
      toast({
        title: 'مستندات ناقصة',
        description: 'يجب رفع جواز السفر والصورة الشخصية قبل الدفع',
        variant: 'destructive',
      });
      return;
    }
    if (!applicationData.paymentMethod) {
      toast({
        title: direction === 'rtl' ? 'خطأ' : 'Error',
        description: t('payment.selectMethod'),
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Generate application number
    const appNumber = `VISA-${Date.now().toString(36).toUpperCase()}`;
    
    setIsProcessing(false);
    
    // Navigate to success page
    navigate(`/payment-success?app=${appNumber}`);
    
    // Reset application
    setTimeout(() => resetApplication(), 1000);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="text-center mb-4 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold">{t('wizard.step6')}</h2>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          {direction === 'rtl' 
            ? 'راجع طلبك وأكمل عملية الدفع' 
            : 'Review your application and complete payment'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Order Summary */}
        <div className="space-y-3 sm:space-y-4 order-2 lg:order-1">
          <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            {t('payment.summary')}
          </h3>
          
          {/* Application Details */}
          <Card>
            <CardContent className="p-4 space-y-4">
              {/* Customer Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('form.fullName')}:</span>
                  <span className="font-medium">{applicationData.fullName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('form.email')}:</span>
                  <span className="font-medium" dir="ltr">{applicationData.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('form.phone')}:</span>
                  <span className="font-medium" dir="ltr">{applicationData.countryCode} {applicationData.phone}</span>
                </div>
              </div>
              
              <Separator />
              
              {/* Visa Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('form.country')}:</span>
                  <span className="font-medium">{applicationData.countryName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('form.visaType')}:</span>
                  <span className="font-medium">{applicationData.visaTypeName}</span>
                </div>
                {applicationData.travelDate && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('form.travelDate')}:</span>
                    <span className="font-medium">
                      {format(applicationData.travelDate, 'PPP', { locale: language === 'ar' ? ar : enUS })}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('form.travelers')}:</span>
                  <span className="font-medium">
                    {applicationData.travelers.adults} {t('form.adults')}
                    {applicationData.travelers.children > 0 && `, ${applicationData.travelers.children} ${t('form.children')}`}
                    {applicationData.travelers.infants > 0 && `, ${applicationData.travelers.infants} ${t('form.infants')}`}
                  </span>
                </div>
              </div>
              
              <Separator />
              
              {/* Price Breakdown */}
              <div className="space-y-2">
                {applicationData.travelers.adults > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('pricing.adult')} × {applicationData.travelers.adults}
                    </span>
                    <span className="flex items-center gap-1">
                      {breakdown.adults.toLocaleString()}
                      <SARSymbol size="xs" />
                    </span>
                  </div>
                )}
                {applicationData.travelers.children > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('pricing.child')} × {applicationData.travelers.children}
                    </span>
                    <span className="flex items-center gap-1">
                      {breakdown.children.toLocaleString()}
                      <SARSymbol size="xs" />
                    </span>
                  </div>
                )}
                {applicationData.travelers.infants > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t('pricing.infant')} × {applicationData.travelers.infants}
                    </span>
                    <span className="flex items-center gap-1">
                      {breakdown.infants.toLocaleString()}
                      <SARSymbol size="xs" />
                    </span>
                  </div>
                )}
                
                <Separator className="my-2" />
                
                <div className="flex justify-between text-sm">
                  <span>{direction === 'rtl' ? 'رسوم الخدمة' : 'Service Fees'}</span>
                  <span className="flex items-center gap-1">
                    {serviceTotal.toLocaleString()}
                    <SARSymbol size="xs" />
                  </span>
                </div>
                
                {!applicationData.visaFeesIncluded && governmentTotal > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{direction === 'rtl' ? 'رسوم التأشيرة (تُدفع لاحقاً)' : 'Visa Fees (to be paid later)'}</span>
                    <span className="flex items-center gap-1">
                      {governmentTotal.toLocaleString()}
                      <SARSymbol size="xs" />
                    </span>
                  </div>
                )}
                
                <Separator className="my-2" />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>{t('pricing.total')}</span>
                  <span className="text-primary flex items-center gap-1">
                    {grandTotal.toLocaleString()}
                    <SARSymbol size="md" className="text-primary" />
                  </span>
                </div>
              </div>
              
              <Badge 
                variant="secondary" 
                className={cn(
                  "w-full justify-center py-2",
                  applicationData.visaFeesIncluded 
                    ? "bg-accent/20 text-accent-foreground" 
                    : "bg-warning/20 text-warning-foreground"
                )}
              >
                {applicationData.visaFeesIncluded 
                  ? t('pricing.visaFeesIncluded')
                  : t('pricing.visaFeesNotIncluded')
                }
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods */}
        <div className="space-y-3 sm:space-y-4 order-1 lg:order-2">
          <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
            {t('payment.selectMethod')}
          </h3>
          
          <RadioGroup
            value={applicationData.paymentMethod}
            onValueChange={(value) => updateApplicationData({ paymentMethod: value })}
            className="space-y-2 sm:space-y-3"
          >
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={cn(
                  "flex items-center space-x-3 rtl:space-x-reverse p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-colors",
                  applicationData.paymentMethod === method.id 
                    ? "border-primary bg-primary/5" 
                    : "border-muted hover:border-primary/50"
                )}
                onClick={() => updateApplicationData({ paymentMethod: method.id })}
              >
                <RadioGroupItem value={method.id} id={method.id} />
                <method.icon className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground shrink-0" />
                <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                  <div className="font-medium text-sm sm:text-base">{method.label[language]}</div>
                  <div className="text-xs sm:text-sm text-muted-foreground">{method.description[language]}</div>
                </Label>
              </div>
            ))}
          </RadioGroup>

          {/* Security Badges */}
          <div className="p-3 sm:p-4 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              <span className="font-medium text-xs sm:text-sm">
                {direction === 'rtl' ? 'دفع آمن ومشفر' : 'Secure & Encrypted Payment'}
              </span>
            </div>
            <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>PCI Compliant</span>
              </div>
            </div>
          </div>

          {/* WhatsApp Document Submission Guide */}
          <div className="p-3 sm:p-4 bg-green-50 dark:bg-green-950/30 rounded-xl border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2 text-sm sm:text-base">
              <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              {direction === 'rtl' ? 'الإرسال عبر واتساب' : 'Send via WhatsApp'}
            </h4>
            <p className="text-xs sm:text-sm text-green-900 dark:text-green-100 mb-2">
              {direction === 'rtl'
                ? 'يمكنك إكمال الدفع الآن وإرسال المستندات لاحقًا عبر واتساب:'
                : 'You can complete payment now and send documents later via WhatsApp:'}
            </p>
            <a
              href="https://wa.me/966562525665"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 font-bold text-green-700 dark:text-green-300 hover:underline text-sm"
            >
              +966 56 252 5665
            </a>
            <ul className="text-xs sm:text-sm text-green-900 dark:text-green-100 space-y-1 list-disc list-inside mt-2">
              <li>{direction === 'rtl' ? 'اذكر رقم طلبك عند إرسال المستندات' : 'Mention your application number when sending documents'}</li>
              <li>{direction === 'rtl' ? 'تأكد من وضوح الصور وأن تكون مقروءة' : 'Make sure images are clear and readable'}</li>
              <li>{direction === 'rtl' ? 'الصيغ المقبولة: PDF, JPG, PNG (بحد أقصى 10 ميجابايت)' : 'Accepted: PDF, JPG, PNG (max 10MB)'}</li>
            </ul>
          </div>

          {/* Pay Button */}
          <Button
            size="lg"
            className="w-full h-12 sm:h-14 text-base sm:text-lg gap-2"
            onClick={handlePayment}
            disabled={!applicationData.paymentMethod || isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                <span className="text-sm sm:text-base">{direction === 'rtl' ? 'جاري المعالجة...' : 'Processing...'}</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="flex items-center gap-1 text-sm sm:text-base">
                  {t('wizard.pay')} - {grandTotal.toLocaleString()}
                  <SARSymbol size="sm" />
                </span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Back Button */}
      <div className="pt-2 sm:pt-4">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="gap-2 h-10 sm:h-12 text-sm sm:text-base"
          onClick={goToPreviousStep}
          disabled={isProcessing}
        >
          <ArrowPrevIcon className="w-4 h-4" />
          <span className="hidden xs:inline">{t('wizard.previous')}</span>
          <span className="xs:hidden">{direction === 'rtl' ? 'السابق' : 'Back'}</span>
        </Button>
      </div>
    </div>
  );
}
