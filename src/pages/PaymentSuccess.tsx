import { useSearchParams, Link } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  trackConversion,
  markConversionFired,
  wasConversionFired,
} from '@/lib/gtagEvents';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle2, 
  Download, 
  Search, 
  Home, 
  Mail,
  Clock,
  FileText,
  MessageCircle,
  Info,
  Copy,
  Check,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BANK_ACCOUNT, BANK_VERIFICATION_MINUTES } from '@/lib/bankAccount';
import { useToast } from '@/hooks/use-toast';
import { generateReceiptPDF } from '@/lib/generateReceiptPDF';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const applicationNumber = searchParams.get('app') || 'VISA-XXXXXX';
  const isWhatsApp = searchParams.get('via') === 'whatsapp';
  const isBankTransfer = searchParams.get('method') === 'bank_transfer';
  const amountParam = searchParams.get('amount');
  const currencyParam = searchParams.get('currency') || 'SAR';
  const { direction } = useLanguage();
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Fire the conversion on the order confirmation page so Google Tag
  // Assistant detects it exactly where it expects it. Deduplicated by
  // transaction_id (the application number) so a refresh — or the
  // earlier fire from Step6Payment — does not double-count.
  useEffect(() => {
    if (!applicationNumber || applicationNumber === 'VISA-XXXXXX') return;
    if (wasConversionFired(applicationNumber)) return;

    const value = amountParam ? Number(amountParam) : 0;

    if (isWhatsApp || isBankTransfer) {
      trackConversion('generate_lead', {
        value: Number.isFinite(value) ? value : 0,
        currency: currencyParam,
        transaction_id: applicationNumber,
      });
    } else {
      trackConversion('purchase', {
        value: Number.isFinite(value) ? value : 0,
        currency: currencyParam,
        transaction_id: applicationNumber,
      });
    }
    markConversionFired(applicationNumber);
  }, [applicationNumber, isWhatsApp, isBankTransfer, amountParam, currencyParam]);


  const content = direction === 'rtl' ? {
    title: isWhatsApp ? 'تم إرسال طلبك بنجاح!' : 'تم الدفع بنجاح!',
    subtitle: isWhatsApp
      ? 'تم تسجيل طلبك. سيتواصل معك فريقنا عبر واتساب لإكمال الإجراءات والدفع'
      : 'تم استلام طلبك وسيتم معالجته في أقرب وقت',
    appNumber: 'رقم طلبك هو',
    copySuccess: 'تم نسخ الرقم',
    nextSteps: 'الخطوات التالية',
    step1: isWhatsApp
      ? 'سيتواصل معك أحد موظفينا عبر واتساب لإكمال الطلب'
      : 'سيتم مراجعة طلبك خلال 1-2 ساعة عمل',
    step2: isWhatsApp
      ? 'سيتم تأكيد المبلغ وطريقة الدفع معك مباشرة'
      : 'يمكنك متابعة تحديثات طلبك من صفحة "تتبع الطلب"',
    step3: 'يمكنك تتبع حالة طلبك في أي وقت برقم الطلب أعلاه',
    trackBtn: 'تتبع الطلب',
    receiptBtn: 'تحميل الإيصال',
    whatsappBtn: 'فتح محادثة واتساب',
    homeBtn: 'العودة للرئيسية',
    processingTime: 'الوقت المتوقع للمعالجة',
    days: 'ساعة عمل',
    noPaymentNotice: 'لم يتم خصم أي مبلغ. سيتم تأكيد المبلغ والدفع مع موظف خدمة العملاء عبر واتساب.',
  } : {
    title: isWhatsApp ? 'Application Submitted!' : 'Payment Successful!',
    subtitle: isWhatsApp
      ? 'Your application has been registered. Our team will contact you on WhatsApp to complete payment.'
      : 'Your application has been received and will be processed soon',
    appNumber: 'Your application number is',
    copySuccess: 'Number copied',
    nextSteps: 'Next Steps',
    step1: isWhatsApp
      ? 'Our staff will contact you on WhatsApp to complete the request'
      : 'Your application will be reviewed within 1-2 business hours',
    step2: isWhatsApp
      ? 'The amount and payment method will be confirmed with you directly'
      : 'You can follow your application status anytime from the Track page',
    step3: 'You can track your application anytime using the number above',
    trackBtn: 'Track Application',
    receiptBtn: 'Download Receipt',
    whatsappBtn: 'Open WhatsApp Chat',
    homeBtn: 'Back to Home',
    processingTime: 'Expected processing time',
    days: 'business hours',
    noPaymentNotice: 'No amount has been charged. Payment details will be confirmed with our staff on WhatsApp.',
  };

  const headerGradient = isWhatsApp
    ? 'from-[#25D366] to-[#128C7E]'
    : isBankTransfer
      ? 'from-amber-500 to-orange-600'
      : 'from-green-500 to-green-600';
  const savedMessage = useMemo(() => {
    try {
      return sessionStorage.getItem(`wa_message_${applicationNumber}`) || '';
    } catch {
      return '';
    }
  }, [applicationNumber]);

  const amountText = amountParam ? `${amountParam} ${currencyParam}` : '';
  const bankWhatsAppMessage =
    direction === 'rtl'
      ? `السلام عليكم،\nأرغب بإرسال صورة إيصال التحويل البنكي\nرقم الطلب: ${applicationNumber}${amountText ? `\nالمبلغ: ${amountText}` : ''}`
      : `Hello,\nI'd like to send the bank transfer receipt.\nApplication: ${applicationNumber}${amountText ? `\nAmount: ${amountText}` : ''}`;

  const fallbackMessage = isBankTransfer
    ? bankWhatsAppMessage
    :
    direction === 'rtl'
      ? `مرحباً، أرغب بمتابعة طلبي رقم: ${applicationNumber}`
      : `Hello, I'd like to follow up on my application: ${applicationNumber}`;
  const whatsappText = savedMessage || fallbackMessage;
  const whatsappUrl = `https://wa.me/966562525665?text=${encodeURIComponent(whatsappText)}`;

  const openWhatsApp = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      if (window.top && window.top !== window.self) {
        window.top.location.href = whatsappUrl;
        return;
      }
    } catch {}
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast({
        title: direction === 'rtl' ? 'تم النسخ' : 'Copied',
        description: text,
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast({
        title: direction === 'rtl' ? 'فشل النسخ' : 'Copy failed',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadReceipt = () => {
    const ok = generateReceiptPDF({
      applicationNumber,
      amount: amountParam,
      currency: currencyParam,
      method: isBankTransfer ? 'bank_transfer' : isWhatsApp ? 'whatsapp' : 'online',
    });
    toast({
      title: ok
        ? direction === 'rtl' ? 'تم تحميل الإيصال' : 'Receipt downloaded'
        : direction === 'rtl' ? 'تعذّر تحميل الإيصال' : 'Could not download receipt',
      description: ok
        ? undefined
        : direction === 'rtl'
          ? 'يرجى المحاولة مرة أخرى أو التواصل مع الدعم'
          : 'Please try again or contact support',
      variant: ok ? undefined : 'destructive',
    });
  };

  // Bank transfer view
  if (isBankTransfer) {
    const t = direction === 'rtl'
      ? {
          title: 'بانتظار تأكيد التحويل البنكي',
          subtitle: 'الرجاء تحويل المبلغ ثم إرسال صورة الإيصال عبر الواتساب',
          appNumber: 'رقم طلبك هو',
          bankInfo: 'بيانات الحساب البنكي',
          bankName: 'اسم البنك',
          beneficiary: 'اسم المستفيد',
          iban: 'رقم الآيبان (IBAN)',
          accountNumber: 'رقم الحساب',
          amount: 'المبلغ المطلوب تحويله',
          alertTitle: 'مهم جداً',
          alertBody: `يستغرق التحقق من التحويل حتى ${BANK_VERIFICATION_MINUTES} دقيقة من وقت استلامنا لصورة الإيصال عبر الواتساب. لن يبدأ معالجة طلبك قبل التأكد من وصول المبلغ.`,
          nextSteps: 'الخطوات التالية',
          step1: 'قم بتحويل المبلغ المذكور أعلاه إلى الحساب البنكي',
          step2: 'أرسل صورة إيصال التحويل عبر الواتساب مع رقم الطلب',
          step3: `سيتم تأكيد طلبك خلال ${BANK_VERIFICATION_MINUTES} دقيقة من استلام الإيصال`,
          whatsappBtn: 'إرسال صورة الإيصال عبر الواتساب',
          trackBtn: 'تتبع الطلب',
          homeBtn: 'العودة للرئيسية',
          copy: 'نسخ',
          copied: 'تم النسخ',
        }
      : {
          title: 'Awaiting Bank Transfer Confirmation',
          subtitle: 'Please transfer the amount and send the receipt via WhatsApp',
          appNumber: 'Your application number is',
          bankInfo: 'Bank Account Details',
          bankName: 'Bank Name',
          beneficiary: 'Beneficiary',
          iban: 'IBAN',
          accountNumber: 'Account Number',
          amount: 'Amount to transfer',
          alertTitle: 'Important',
          alertBody: `Verifying the transfer takes up to ${BANK_VERIFICATION_MINUTES} minutes after we receive the receipt via WhatsApp. Processing will not begin before payment is verified.`,
          nextSteps: 'Next Steps',
          step1: 'Transfer the amount above to the bank account',
          step2: 'Send the transfer receipt via WhatsApp with your application number',
          step3: `Your order will be confirmed within ${BANK_VERIFICATION_MINUTES} minutes after we receive the receipt`,
          whatsappBtn: 'Send Receipt via WhatsApp',
          trackBtn: 'Track Application',
          homeBtn: 'Back to Home',
          copy: 'Copy',
          copied: 'Copied',
        };

    const bankName = direction === 'rtl' ? BANK_ACCOUNT.bankName : BANK_ACCOUNT.bankNameEn;
    const beneficiary = direction === 'rtl' ? BANK_ACCOUNT.beneficiary : BANK_ACCOUNT.beneficiaryEn;

    const rows = [
      { label: t.bankName, value: bankName, copyValue: bankName, key: 'bank' },
      { label: t.beneficiary, value: beneficiary, copyValue: beneficiary, key: 'beneficiary' },
      { label: t.iban, value: BANK_ACCOUNT.iban, copyValue: BANK_ACCOUNT.iban.replace(/\s/g, ''), key: 'iban' },
      { label: t.accountNumber, value: BANK_ACCOUNT.accountNumber, copyValue: BANK_ACCOUNT.accountNumber, key: 'account' },
    ];

    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <Card className="overflow-hidden">
            <div className={`bg-gradient-to-br ${headerGradient} p-8 text-center text-white`}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                <Clock className="w-20 h-20 mx-auto mb-4" />
              </motion.div>
              <h1 className="text-2xl font-bold mb-2">{t.title}</h1>
              <p className="text-white/90 text-sm">{t.subtitle}</p>
            </div>

            <CardContent className="p-6 space-y-5">
              {/* Application Number */}
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-2">{t.appNumber}</p>
                <p className="text-2xl font-mono font-bold text-primary tracking-wider">
                  {applicationNumber}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 h-9 gap-1.5"
                  onClick={() => copyToClipboard(applicationNumber, 'appNumber')}
                >
                  {copiedField === 'appNumber' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-xs">{direction === 'rtl' ? 'نسخ رقم التتبع' : 'Copy tracking number'}</span>
                </Button>
              </div>

              {/* Amount */}
              {amountParam && (
                <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <span className="text-sm font-medium">{t.amount}</span>
                  <span className="text-xl font-bold text-primary">
                    {amountParam} {currencyParam}
                  </span>
                </div>
              )}

              {/* Verification alert */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200 mb-1">{t.alertTitle}</p>
                  <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">{t.alertBody}</p>
                </div>
              </div>

              {/* Bank details */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {t.bankInfo}
                </h3>
                <div className="border rounded-lg overflow-hidden divide-y">
                  {rows.map((row) => (
                    <div key={row.key} className="flex items-center justify-between gap-3 p-3 bg-card hover:bg-muted/40 transition-colors">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground mb-0.5">{row.label}</p>
                        <p className="text-sm font-medium font-mono truncate" dir="ltr">{row.value}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 h-8 gap-1"
                        onClick={() => copyToClipboard(row.copyValue, row.key)}
                      >
                        {copiedField === row.key ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-600" />
                            <span className="text-xs">{t.copied}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-xs">{t.copy}</span>
                          </>
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next steps */}
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  {t.nextSteps}
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {[t.step1, t.step2, t.step3].map((s, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <Button asChild className="w-full h-12 gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white">
                  <a href={whatsappUrl} onClick={openWhatsApp} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4" />
                    {t.whatsappBtn}
                  </a>
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" asChild className="gap-2">
                    <Link to={`/track?app=${applicationNumber}`}>
                      <Search className="w-4 h-4" />
                      {t.trackBtn}
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="gap-2">
                    <Link to="/">
                      <Home className="w-4 h-4" />
                      {t.homeBtn}
                    </Link>
                  </Button>
                </div>
                <Button variant="ghost" className="w-full gap-2 min-h-11" onClick={handleDownloadReceipt}>
                  <Download className="w-4 h-4" />
                  {direction === 'rtl' ? 'تحميل إيصال الطلب' : 'Download order receipt'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="overflow-hidden">
          {/* Success Header */}
          <div className={`bg-gradient-to-br ${headerGradient} p-8 text-center text-white`}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              {isWhatsApp ? (
                <MessageCircle className="w-20 h-20 mx-auto mb-4" />
              ) : (
                <CheckCircle2 className="w-20 h-20 mx-auto mb-4" />
              )}
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">{content.title}</h1>
            <p className="text-white/90">{content.subtitle}</p>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Application Number */}
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">{content.appNumber}</p>
              <p className="text-2xl font-mono font-bold text-primary tracking-wider">
                {applicationNumber}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 h-9 gap-1.5"
                onClick={() => copyToClipboard(applicationNumber, 'appNumber')}
              >
                {copiedField === 'appNumber' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-xs">
                  {copiedField === 'appNumber'
                    ? content.copySuccess
                    : direction === 'rtl' ? 'نسخ رقم التتبع' : 'Copy tracking number'}
                </span>
              </Button>
            </div>

            {/* WhatsApp non-payment notice */}
            {isWhatsApp && (
              <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800 dark:text-amber-200">{content.noPaymentNotice}</p>
              </div>
            )}

            {/* Processing time (only for paid path) */}
            {!isWhatsApp && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="w-5 h-5 text-primary" />
                <div className="text-sm">
                  <div className="font-medium">1-2 {content.days}</div>
                  <div className="text-muted-foreground text-xs">{content.processingTime}</div>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {content.nextSteps}
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">1</span>
                  {content.step1}
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">2</span>
                  {content.step2}
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center shrink-0 mt-0.5">3</span>
                  {content.step3}
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {isWhatsApp ? (
                <Button asChild className="w-full h-12 gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white">
                  <a href={whatsappUrl} onClick={openWhatsApp} target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="w-4 h-4" />
                    {content.whatsappBtn}
                  </a>
                </Button>
              ) : (
                <Button asChild className="w-full h-12 gap-2">
                  <Link to={`/track?app=${applicationNumber}`}>
                    <Search className="w-4 h-4" />
                    {content.trackBtn}
                  </Link>
                </Button>
              )}

              <div className="grid grid-cols-2 gap-3">
                {isWhatsApp ? (
                  <Button variant="outline" asChild className="gap-2">
                    <Link to={`/track?app=${applicationNumber}`}>
                      <Search className="w-4 h-4" />
                      {content.trackBtn}
                    </Link>
                  </Button>
                ) : (
                  <Button variant="outline" className="gap-2 min-h-11" onClick={handleDownloadReceipt}>
                    <Download className="w-4 h-4" />
                    {content.receiptBtn}
                  </Button>
                )}
                <Button variant="outline" asChild className="gap-2">
                  <Link to="/">
                    <Home className="w-4 h-4" />
                    {content.homeBtn}
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
