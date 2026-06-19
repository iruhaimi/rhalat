import { useEffect, useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import SARSymbol from '@/components/ui/SARSymbol';
import { Link } from 'react-router-dom';
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
import { normalizeSaudiPhone, formatSaudiPhoneSpaced } from '@/lib/phone';
import { trackConversion, setEnhancedConversionUserData, markConversionFired, wasConversionFired } from '@/lib/gtagEvents';

const TERMS_VERSION = 'v2026.1';

async function getClientIP(): Promise<string | null> {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
    const json = await res.json();
    return json.ip || null;
  } catch {
    return null;
  }
}

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
  const { profile, user } = useAuth();

  // Resolve customer identity from authenticated account (single source of truth)
  const customerName =
    profile?.full_name ||
    (user?.user_metadata as any)?.full_name ||
    (user?.user_metadata as any)?.name ||
    '';
  const customerEmail = user?.email || '';
  const customerPhone = normalizeSaudiPhone(profile?.phone);
  const customerCountryCode = '+966';
  const customerPhoneDisplay = formatSaudiPhoneSpaced(profile?.phone);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubmittingWhatsApp, setIsSubmittingWhatsApp] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Reaching the payment step always means the electronic path was chosen earlier
  useEffect(() => {
    if (applicationData.submissionMethod !== 'online') {
      updateApplicationData({ submissionMethod: 'online' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fire begin_checkout once when the customer reaches the payment step
  useEffect(() => {
    trackConversion('begin_checkout', {
      value: grandTotal,
      currency: 'SAR',
      items: [
        {
          item_id: applicationData.visaTypeId || 'visa',
          item_name: applicationData.visaTypeName || 'Visa Application',
          item_category: applicationData.countryName || undefined,
          quantity:
            applicationData.travelers.adults +
            applicationData.travelers.children +
            applicationData.travelers.infants,
          price: grandTotal,
        },
      ],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const { serviceTotal, governmentTotal, grandTotal, breakdown } = calculateTotal();
  
  const ArrowPrevIcon = direction === 'rtl' ? ArrowRight : ArrowLeft;

  // Required documents for online payment
  const REQUIRED_DOC_TYPES = ['passport', 'photo'];
  const uploadedTypes = applicationData.uploadedDocuments.filter(d => d.uploaded).map(d => d.type);
  const missingDocs = REQUIRED_DOC_TYPES.filter(t => !uploadedTypes.includes(t));
  const docsComplete = missingDocs.length === 0;

  const submissionMethod = applicationData.submissionMethod;

  const sendConfirmationEmail = async (
    appNumber: string,
    method: 'online' | 'whatsapp',
    paymentMethodLabel?: string,
  ) => {
    if (!customerEmail) return;
    try {
      const travelDateStr = applicationData.travelDate
        ? format(applicationData.travelDate, 'PPP', { locale: ar })
        : '';
      await supabase.functions.invoke('send-transactional-email', {
        body: {
          templateName: 'application-confirmation',
          recipientEmail: customerEmail,
          idempotencyKey: `app-confirm-${appNumber}-${method}`,
          templateData: {
            applicationNumber: appNumber,
            fullName: customerName,
            email: customerEmail,
            phone: customerPhoneDisplay,
            countryName: applicationData.countryName,
            visaTypeName: applicationData.visaTypeName,
            travelDate: travelDateStr,
            travelers: applicationData.travelers,
            breakdown,
            serviceTotal,
            governmentTotal,
            grandTotal,
            visaFeesIncluded: applicationData.visaFeesIncluded,
            submissionMethod: method,
            paymentMethod: paymentMethodLabel || '',
            checkedRequirements: applicationData.checkedRequirements || [],
            termsAcceptedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
          },
        },
      });
    } catch (e) {
      console.error('Failed to send confirmation email:', e);
    }
  };

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
👤 الاسم: ${customerName}
📧 البريد: ${customerEmail}
📱 الجوال: ${customerPhoneDisplay}

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

    if (!applicationData.termsAccepted) {
      toast({
        title: direction === 'rtl' ? 'الموافقة على الشروط مطلوبة' : 'Terms acceptance required',
        description: direction === 'rtl' ? 'يرجى الموافقة على الشروط والأحكام قبل المتابعة' : 'Please accept the Terms & Conditions to continue',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingWhatsApp(true);

    try {
      const consentIp = await getClientIP();
      const consentUA = typeof navigator !== 'undefined' ? navigator.userAgent : null;
      const consentAt = new Date().toISOString();

      const draftPayload = {
        user_id: profile.id,
        visa_type_id: applicationData.visaTypeId,
        travel_date: applicationData.travelDate ? applicationData.travelDate.toISOString().split('T')[0] : null,
        status: 'whatsapp_pending' as const,
        submission_method: 'whatsapp',
        purpose_of_travel: JSON.stringify({
          fullName: customerName,
          email: customerEmail,
          phone: customerPhone,
          countryCode: customerCountryCode,
          travelers: applicationData.travelers,
          checkedRequirements: applicationData.checkedRequirements,
          totalAmount: grandTotal,
          termsAccepted: applicationData.termsAccepted,
        }),
      };

      let appId = draftId;
      let displayNumber: string | null = null;

      if (!appId) {
        // Create draft via SECURITY DEFINER RPC to bypass RLS
        const { data: newId, error: rpcError } = await supabase.rpc('create_application_draft', {
          p_visa_type_id: applicationData.visaTypeId,
          p_travel_date: applicationData.travelDate ? applicationData.travelDate.toISOString().split('T')[0] : null,
          p_draft_data: {},
        });
        if (rpcError) throw rpcError;
        appId = newId as string;
      }

      const { data, error } = await supabase
        .from('applications')
        .update({
          status: 'whatsapp_pending',
          submission_method: 'whatsapp',
          purpose_of_travel: draftPayload.purpose_of_travel,
          terms_accepted_at: consentAt,
          terms_version: TERMS_VERSION,
          terms_ip_address: consentIp,
          terms_user_agent: consentUA,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appId)
        .select('id, display_number')
        .single();
      if (error) throw error;
      displayNumber = data.display_number;

      const appNumber = displayNumber || `VF-${Date.now().toString(36).toUpperCase()}`;

      // Send confirmation email (non-blocking)
      await sendConfirmationEmail(appNumber, 'whatsapp');

      const message = buildWhatsAppMessage(appNumber);
      const whatsappUrl = `https://wa.me/966562525665?text=${encodeURIComponent(message)}`;

      // Persist message so PaymentSuccess can re-open WhatsApp with the full order details
      try {
        sessionStorage.setItem(`wa_message_${appNumber}`, message);
      } catch {}

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

      // Conversion: lead via WhatsApp (no payment captured online).
      // Dedup so the success page (which also fires generate_lead as a
      // safety net) doesn't double-count.
      trackConversion('submit_application', {
        value: grandTotal,
        currency: 'SAR',
        transaction_id: appNumber,
        method: 'whatsapp',
      });
      if (!wasConversionFired(appNumber)) {
        trackConversion('generate_lead', {
          value: grandTotal,
          currency: 'SAR',
          transaction_id: appNumber,
        });
        markConversionFired(appNumber);
      }

      setTimeout(() => {
        resetApplication();
        navigate(
          `/payment-success?app=${encodeURIComponent(appNumber)}` +
            `&via=whatsapp` +
            `&amount=${encodeURIComponent(grandTotal)}` +
            `&currency=SAR`
        );
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
    if (!applicationData.termsAccepted) {
      toast({
        title: direction === 'rtl' ? 'الموافقة على الشروط مطلوبة' : 'Terms acceptance required',
        description: direction === 'rtl' ? 'يرجى الموافقة على الشروط والأحكام قبل الدفع' : 'Please accept the Terms & Conditions before paying',
        variant: 'destructive',
      });
      return;
    }

    setIsProcessing(true);

    try {
      const consentIp = await getClientIP();
      const consentUA = typeof navigator !== 'undefined' ? navigator.userAgent : null;
      const consentAt = new Date().toISOString();

      // Simulate payment gateway processing
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Persist the application so it appears in admin & customer dashboards
      let appId = draftId;
      if (!appId && profile) {
        const { data: newId, error: rpcError } = await supabase.rpc('create_application_draft', {
          p_visa_type_id: applicationData.visaTypeId,
          p_travel_date: applicationData.travelDate ? applicationData.travelDate.toISOString().split('T')[0] : null,
          p_draft_data: {},
        });
        if (rpcError) throw rpcError;
        appId = newId as string;
      }

      let appNumber = `VF-${Date.now().toString(36).toUpperCase()}`;
      if (appId) {
        const { data, error } = await supabase
          .from('applications')
          .update({
            status: 'submitted',
            submission_method: 'online',
            submitted_at: new Date().toISOString(),
            purpose_of_travel: JSON.stringify({
              fullName: customerName,
              email: customerEmail,
              phone: customerPhone,
              countryCode: customerCountryCode,
              travelers: applicationData.travelers,
              checkedRequirements: applicationData.checkedRequirements,
              totalAmount: grandTotal,
              paymentMethod: applicationData.paymentMethod,
              termsAccepted: applicationData.termsAccepted,
            }),
            terms_accepted_at: consentAt,
            terms_version: TERMS_VERSION,
            terms_ip_address: consentIp,
            terms_user_agent: consentUA,
            updated_at: new Date().toISOString(),
          })
          .eq('id', appId)
          .select('id, display_number')
          .single();
        if (!error && data?.display_number) appNumber = data.display_number;
      }

      const methodLabel =
        paymentMethods.find(m => m.id === applicationData.paymentMethod)?.label[language] || '';

      // Send confirmation email (non-blocking)
      await sendConfirmationEmail(appNumber, 'online', methodLabel);

      // Enhanced Conversions: attach hashed identifiers before purchase fires
      setEnhancedConversionUserData({
        email: customerEmail || undefined,
        phone_number: customerPhone
          ? `+966${customerPhone.replace(/^0+/, '')}`
          : undefined,
        address: customerName
          ? {
              first_name: customerName.split(' ')[0],
              last_name: customerName.split(' ').slice(1).join(' ') || undefined,
              country: 'SA',
            }
          : undefined,
      });
      // Primary conversion: paid purchase (with dedupe so a refresh on
      // /payment-success doesn't double-fire — the success page also
      // fires as a safety net)
      if (!wasConversionFired(appNumber)) {
        trackConversion('purchase', {
          value: grandTotal,
          currency: 'SAR',
          transaction_id: appNumber,
          payment_type: applicationData.paymentMethod,
          items: [
            {
              item_id: applicationData.visaTypeId || 'visa',
              item_name: applicationData.visaTypeName || 'Visa Application',
              item_category: applicationData.countryName || undefined,
              quantity:
                applicationData.travelers.adults +
                applicationData.travelers.children +
                applicationData.travelers.infants,
              price: grandTotal,
            },
          ],
        });
        markConversionFired(appNumber);
      }
      trackConversion('submit_application', {
        value: grandTotal,
        currency: 'SAR',
        transaction_id: appNumber,
        method: 'online',
      });

      // Pass the order value to the success page so it can re-assert the
      // purchase event (Google Tag Assistant expects the event on the
      // confirmation page).
      navigate(
        `/payment-success?app=${encodeURIComponent(appNumber)}` +
          `&amount=${encodeURIComponent(grandTotal)}` +
          `&currency=SAR`
      );
      setTimeout(() => resetApplication(), 1000);
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        title: 'خطأ',
        description: error.message || 'فشلت عملية الدفع، حاول مرة أخرى',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-center mb-2">
        <h2 className="text-lg sm:text-xl font-bold">{t('wizard.step5')}</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
          {direction === 'rtl' 
            ? 'راجع طلبك وأكمل عملية الدفع' 
            : 'Review your application and complete payment'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Order Summary */}
        <div className="space-y-2.5 order-2 lg:order-1">
          <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {t('payment.summary')}
          </h3>
          
          {/* Application Details */}
          <Card>
            <CardContent className="p-3 space-y-2.5">
              {/* Customer Info */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('form.fullName')}:</span>
                  <span className="font-medium">{customerName || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('form.email')}:</span>
                  <span className="font-medium" dir="ltr">{customerEmail || '—'}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('form.phone')}:</span>
                  <span className="font-medium" dir="ltr">{customerPhoneDisplay || '—'}</span>
                </div>
              </div>
              
              <Separator />
              
              {/* Visa Info */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('form.country')}:</span>
                  <span className="font-medium">{applicationData.countryName}</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('form.visaType')}:</span>
                  <span className="font-medium">{applicationData.visaTypeName}</span>
                </div>
                {applicationData.travelDate && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{t('form.travelDate')}:</span>
                    <span className="font-medium">
                      {format(applicationData.travelDate, 'PPP', { locale: language === 'ar' ? ar : enUS })}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-xs sm:text-sm">
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
              <div className="space-y-1.5">
                {applicationData.travelers.adults > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm">
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
                  <div className="flex justify-between text-xs sm:text-sm">
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
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-muted-foreground">
                      {t('pricing.infant')} × {applicationData.travelers.infants}
                    </span>
                    <span className="flex items-center gap-1">
                      {breakdown.infants.toLocaleString()}
                      <SARSymbol size="xs" />
                    </span>
                  </div>
                )}
                
                <Separator className="my-1.5" />
                
                <div className="flex justify-between text-xs sm:text-sm">
                  <span>{direction === 'rtl' ? 'رسوم الخدمة' : 'Service Fees'}</span>
                  <span className="flex items-center gap-1">
                    {serviceTotal.toLocaleString()}
                    <SARSymbol size="xs" />
                  </span>
                </div>
                
                {!applicationData.visaFeesIncluded && governmentTotal > 0 && (
                  <div className="flex justify-between text-xs sm:text-sm text-muted-foreground">
                    <span>{direction === 'rtl' ? 'رسوم التأشيرة (تُدفع لاحقاً)' : 'Visa Fees (to be paid later)'}</span>
                    <span className="flex items-center gap-1">
                      {governmentTotal.toLocaleString()}
                      <SARSymbol size="xs" />
                    </span>
                  </div>
                )}
                
                <Separator className="my-1.5" />
                
                <div className="flex justify-between font-bold text-base sm:text-lg">
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
                  "w-full justify-center py-1.5 text-xs",
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

          {/* Fee transparency notice — required by Google Ads "Government Documents" policy */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 dark:bg-amber-950/20 dark:border-amber-900/40 p-2.5 text-xs text-amber-900 dark:text-amber-100 leading-snug">
            <div className="font-bold mb-1 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {direction === 'rtl' ? 'إفصاح الرسوم' : 'Fee transparency'}
            </div>
            {direction === 'rtl' ? (
              <p>
                المبلغ أعلاه يشمل <strong>رسوم خدمة Visafaster</strong> فقط (تنسيق واستشارة وتجهيز الملف).
                {governmentTotal > 0 && !applicationData.visaFeesIncluded && (
                  <> رسوم التأشيرة الحكومية الرسمية تُدفع بشكل منفصل للسفارة وليست إيراداً لنا.</>
                )}
                {' '}يمكنك التقديم على التأشيرة مباشرة عبر{' '}
                <Link to="/official-embassies" className="font-semibold underline">
                  المواقع الحكومية الرسمية
                </Link>{' '}
                بتكلفة أقل أو مجاناً.
              </p>
            ) : (
              <p>
                The amount above covers <strong>Visafaster service fees only</strong> (coordination, consultancy, file preparation).
                {governmentTotal > 0 && !applicationData.visaFeesIncluded && (
                  <> Official government visa fees are paid separately to the embassy and are not revenue to us.</>
                )}
                {' '}You may apply directly through the{' '}
                <Link to="/official-embassies" className="font-semibold underline">
                  official government websites
                </Link>{' '}
                at a lower cost or free.
              </p>
            )}
          </div>
        </div>

        {/* Right column: payment */}
        <div className="space-y-2.5 order-1 lg:order-2">
          {/* Online payment only — WhatsApp path branches off after step 3 */}
          {true && (
            <>
              {!docsComplete && (
                <div className="p-2.5 rounded-xl border-2 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                  <div className="flex items-start gap-2 mb-1.5">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-amber-900 dark:text-amber-100 text-xs sm:text-sm">
                        {direction === 'rtl' ? 'يجب رفع المستندات قبل الدفع' : 'Documents required before payment'}
                      </h4>
                      <p className="text-[11px] text-amber-800 dark:text-amber-200 mt-0.5">
                        {direction === 'rtl'
                          ? 'المستندات الإجبارية: جواز السفر + الصورة الشخصية'
                          : 'Required: Passport + Personal Photo'}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 mt-1.5 h-8 text-xs"
                    onClick={() => { setCurrentStep(4); window.scrollTo({ top: 0, left: 0, behavior: 'smooth' }); }}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {direction === 'rtl' ? 'العودة لرفع المستندات' : 'Go to upload documents'}
                  </Button>
                </div>
              )}

              {docsComplete && (
                <>
                  <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    {t('payment.selectMethod')}
                  </h3>
                  <RadioGroup
            value={applicationData.paymentMethod}
            onValueChange={(value) => updateApplicationData({ paymentMethod: value })}
            className="space-y-1.5"
          >
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={cn(
                  "flex items-center space-x-2.5 rtl:space-x-reverse p-2.5 rounded-xl border-2 cursor-pointer transition-colors",
                  applicationData.paymentMethod === method.id 
                    ? "border-primary bg-primary/5" 
                    : "border-muted hover:border-primary/50"
                )}
                onClick={() => updateApplicationData({ paymentMethod: method.id })}
              >
                <RadioGroupItem value={method.id} id={method.id} />
                <method.icon className="w-5 h-5 text-muted-foreground shrink-0" />
                <Label htmlFor={method.id} className="flex-1 cursor-pointer">
                  <div className="font-medium text-sm">{method.label[language]}</div>
                  <div className="text-[11px] text-muted-foreground">{method.description[language]}</div>
                </Label>
              </div>
            ))}
          </RadioGroup>

                  {/* Security Badges */}
                  <div className="p-2.5 bg-muted/30 rounded-xl">
            <div className="flex items-center gap-2 mb-1.5">
              <Shield className="w-4 h-4 text-accent" />
              <span className="font-medium text-xs">
                {direction === 'rtl' ? 'دفع آمن ومشفر' : 'Secure & Encrypted Payment'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                <span>SSL Secured</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" />
                <span>PCI Compliant</span>
              </div>
            </div>
          </div>

                  {/* Pay Button */}
                  <Button
            size="lg"
            className="w-full h-11 sm:h-12 text-sm sm:text-base gap-2"
            onClick={handlePayment}
            disabled={!applicationData.paymentMethod || isProcessing || !applicationData.termsAccepted}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">{direction === 'rtl' ? 'جاري المعالجة...' : 'Processing...'}</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span className="flex items-center gap-1 text-sm sm:text-base">
                  {t('wizard.pay')} - {grandTotal.toLocaleString()}
                  <SARSymbol size="sm" />
                </span>
              </>
            )}
          </Button>
                </>
              )}
            </>
          )}

          {/* Terms & Conditions consent */}
          {true && (
            <div
              className={cn(
                'p-2.5 rounded-xl border-2 transition-colors cursor-pointer',
                applicationData.termsAccepted
                  ? 'border-primary bg-primary/5'
                  : 'border-muted hover:border-primary/50'
              )}
              onClick={() => updateApplicationData({ termsAccepted: !applicationData.termsAccepted })}
            >
              <div className="flex items-start gap-2">
                <Checkbox
                  id="terms-consent"
                  checked={applicationData.termsAccepted}
                  onCheckedChange={(checked) => updateApplicationData({ termsAccepted: checked as boolean })}
                  className="mt-0.5"
                />
                <Label htmlFor="terms-consent" className="cursor-pointer text-xs leading-snug flex-1">
                  {direction === 'rtl' ? (
                    <>
                      أوافق على{' '}
                      <Link to="/terms" target="_blank" onClick={(e) => e.stopPropagation()} className="text-primary underline font-medium">الشروط والأحكام</Link>
                      {' '}و{' '}
                      <Link to="/privacy" target="_blank" onClick={(e) => e.stopPropagation()} className="text-primary underline font-medium">سياسة الخصوصية</Link>
                      {' '}و{' '}
                      <Link to="/refund" target="_blank" onClick={(e) => e.stopPropagation()} className="text-primary underline font-medium">سياسة الاسترجاع</Link>
                      {'. '}
                      <span className="text-muted-foreground">سيتم تسجيل موافقتك مع الوقت والجهاز كدليل قانوني.</span>
                    </>
                  ) : (
                    <>
                      I agree to the{' '}
                      <Link to="/terms" target="_blank" onClick={(e) => e.stopPropagation()} className="text-primary underline font-medium">Terms & Conditions</Link>
                      {', '}
                      <Link to="/privacy" target="_blank" onClick={(e) => e.stopPropagation()} className="text-primary underline font-medium">Privacy Policy</Link>
                      {', and '}
                      <Link to="/refund" target="_blank" onClick={(e) => e.stopPropagation()} className="text-primary underline font-medium">Refund Policy</Link>
                      {'. '}
                      <span className="text-muted-foreground">Your consent (timestamp + device) will be recorded as a legal record.</span>
                    </>
                  )}
                </Label>
              </div>
            </div>
          )}
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
