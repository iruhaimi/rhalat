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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3">
        {/* Left column (3/5): Payment */}
        <div className="space-y-2.5 lg:col-span-3 order-1">
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
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    {t('payment.selectMethod')}
                  </h3>
                  <RadioGroup
                    value={applicationData.paymentMethod}
                    onValueChange={(value) => updateApplicationData({ paymentMethod: value })}
                    className="grid grid-cols-3 gap-2"
                  >
                    {paymentMethods.map((method) => {
                      const selected = applicationData.paymentMethod === method.id;
                      return (
                        <button
                          type="button"
                          key={method.id}
                          onClick={() => updateApplicationData({ paymentMethod: method.id })}
                          className={cn(
                            "flex flex-col items-center justify-center gap-1 p-2 rounded-xl border-2 transition-colors text-center min-h-[68px]",
                            selected
                              ? "border-primary bg-primary/5"
                              : "border-muted hover:border-primary/50"
                          )}
                        >
                          <RadioGroupItem value={method.id} id={method.id} className="sr-only" />
                          <method.icon className={cn("w-5 h-5", selected ? "text-primary" : "text-muted-foreground")} />
                          <span className="font-medium text-[11px] sm:text-xs leading-tight">{method.label[language]}</span>
                        </button>
                      );
                    })}
                  </RadioGroup>
                  {applicationData.paymentMethod && (
                    <p className="text-[11px] text-muted-foreground text-center -mt-1">
                      {paymentMethods.find(m => m.id === applicationData.paymentMethod)?.description[language]}
                    </p>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Right column (2/5): Compact summary */}
        <div className="space-y-2 lg:col-span-2 order-2">
          <Card>
            <CardContent className="p-3 space-y-2">
              {/* Identity + visa compact lines */}
              <div className="space-y-1 text-[11px] sm:text-xs text-muted-foreground">
                <div className="flex items-center gap-1.5 truncate">
                  <User className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate font-medium text-foreground">{customerName || '—'}</span>
                  <span>·</span>
                  <span dir="ltr" className="truncate">{customerPhoneDisplay || customerEmail}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="font-medium text-foreground truncate">{applicationData.countryName}</span>
                  <span>·</span>
                  <span className="truncate">{applicationData.visaTypeName}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {applicationData.travelers.adults}{t('form.adults').charAt(0)}
                    {applicationData.travelers.children > 0 && ` · ${applicationData.travelers.children}${t('form.children').charAt(0)}`}
                    {applicationData.travelers.infants > 0 && ` · ${applicationData.travelers.infants}${t('form.infants').charAt(0)}`}
                  </span>
                  {applicationData.travelDate && (
                    <>
                      <span>·</span>
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>{format(applicationData.travelDate, 'd MMM yyyy', { locale: language === 'ar' ? ar : enUS })}</span>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Total — primary focus */}
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">{t('pricing.total')}</span>
                <span className="text-primary font-bold text-xl flex items-center gap-1">
                  {grandTotal.toLocaleString()}
                  <SARSymbol size="md" className="text-primary" />
                </span>
              </div>

              {/* Collapsible breakdown */}
              <details className="group">
                <summary className="text-[11px] text-primary cursor-pointer hover:underline list-none flex items-center gap-1">
                  <span>{direction === 'rtl' ? 'تفاصيل السعر' : 'Price details'}</span>
                  <span className="group-open:rotate-180 transition-transform">▾</span>
                </summary>
                <div className="mt-1.5 space-y-1 text-[11px]">
                  {applicationData.travelers.adults > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">{t('pricing.adult')} × {applicationData.travelers.adults}</span><span className="flex items-center gap-0.5">{breakdown.adults.toLocaleString()}<SARSymbol size="xs" /></span></div>
                  )}
                  {applicationData.travelers.children > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">{t('pricing.child')} × {applicationData.travelers.children}</span><span className="flex items-center gap-0.5">{breakdown.children.toLocaleString()}<SARSymbol size="xs" /></span></div>
                  )}
                  {applicationData.travelers.infants > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">{t('pricing.infant')} × {applicationData.travelers.infants}</span><span className="flex items-center gap-0.5">{breakdown.infants.toLocaleString()}<SARSymbol size="xs" /></span></div>
                  )}
                  <div className="flex justify-between pt-1 border-t">
                    <span>{direction === 'rtl' ? 'رسوم الخدمة' : 'Service Fees'}</span>
                    <span className="flex items-center gap-0.5">{serviceTotal.toLocaleString()}<SARSymbol size="xs" /></span>
                  </div>
                  {!applicationData.visaFeesIncluded && governmentTotal > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>{direction === 'rtl' ? 'رسوم التأشيرة (لاحقاً)' : 'Visa Fees (later)'}</span>
                      <span className="flex items-center gap-0.5">{governmentTotal.toLocaleString()}<SARSymbol size="xs" /></span>
                    </div>
                  )}
                </div>
              </details>

              {/* Fee transparency popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button type="button" className="w-full flex items-center justify-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 hover:underline">
                    <AlertCircle className="w-3 h-3" />
                    {direction === 'rtl' ? 'إفصاح الرسوم' : 'Fee transparency'}
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-72 text-xs leading-snug">
                  {direction === 'rtl' ? (
                    <p>
                      المبلغ يشمل <strong>رسوم خدمة Visafaster</strong> فقط.
                      {governmentTotal > 0 && !applicationData.visaFeesIncluded && (
                        <> رسوم التأشيرة الحكومية تُدفع للسفارة بشكل منفصل.</>
                      )}
                      {' '}يمكنك التقديم مباشرة عبر{' '}
                      <Link to="/official-embassies" className="font-semibold underline">المواقع الرسمية</Link>.
                    </p>
                  ) : (
                    <p>
                      Amount covers <strong>Visafaster service fees only</strong>.
                      {governmentTotal > 0 && !applicationData.visaFeesIncluded && (
                        <> Government visa fees are paid separately to the embassy.</>
                      )}
                      {' '}You may apply directly via{' '}
                      <Link to="/official-embassies" className="font-semibold underline">official sites</Link>.
                    </p>
                  )}
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>
        </div>

        {/* Bottom: terms + CTA — sticky on mobile, inline on desktop */}
        <div className="lg:col-span-5 order-3 space-y-2 sticky bottom-0 lg:static bg-background/95 lg:bg-transparent backdrop-blur lg:backdrop-blur-none pt-2 pb-2 lg:pt-0 lg:pb-0 -mx-2 px-2 lg:mx-0 lg:px-0 border-t lg:border-0 z-10">

          {/* Terms & Conditions consent */}
          {docsComplete && (
            <div
              className={cn(
                'p-2 rounded-xl border-2 transition-colors cursor-pointer',
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
