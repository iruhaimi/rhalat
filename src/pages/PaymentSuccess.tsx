import { useSearchParams, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
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
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const applicationNumber = searchParams.get('app') || 'VISA-XXXXXX';
  const isWhatsApp = searchParams.get('via') === 'whatsapp';
  const { direction } = useLanguage();

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
    : 'from-green-500 to-green-600';
  const savedMessage = useMemo(() => {
    try {
      return sessionStorage.getItem(`wa_message_${applicationNumber}`) || '';
    } catch {
      return '';
    }
  }, [applicationNumber]);

  const fallbackMessage =
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
                  <Button variant="outline" className="gap-2">
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
