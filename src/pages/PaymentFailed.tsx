import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  XCircle, 
  RefreshCw, 
  MessageCircle, 
  Home,
  Phone,
  Mail
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function PaymentFailed() {
  const { direction } = useLanguage();

  const content = direction === 'rtl' ? {
    title: 'فشل الدفع',
    subtitle: 'لم يتم إتمام عملية الدفع. يرجى المحاولة مرة أخرى.',
    reasons: 'أسباب محتملة',
    reason1: 'رصيد غير كافي في البطاقة',
    reason2: 'انتهت صلاحية البطاقة',
    reason3: 'تم رفض العملية من البنك',
    reason4: 'مشكلة في الاتصال بالإنترنت',
    tryAgain: 'حاول مرة أخرى',
    contactSupport: 'تواصل مع الدعم',
    homeBtn: 'العودة للرئيسية',
    supportTitle: 'هل تحتاج مساعدة؟',
    supportDesc: 'فريق الدعم متاح لمساعدتك',
  } : {
    title: 'Payment Failed',
    subtitle: 'The payment was not completed. Please try again.',
    reasons: 'Possible Reasons',
    reason1: 'Insufficient card balance',
    reason2: 'Card has expired',
    reason3: 'Transaction declined by bank',
    reason4: 'Internet connection issue',
    tryAgain: 'Try Again',
    contactSupport: 'Contact Support',
    homeBtn: 'Back to Home',
    supportTitle: 'Need Help?',
    supportDesc: 'Our support team is available to assist you',
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
          {/* Error Header */}
          <div className="bg-gradient-to-br from-destructive to-red-600 p-8 text-center text-white">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <XCircle className="w-20 h-20 mx-auto mb-4" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-2">{content.title}</h1>
            <p className="text-red-100">{content.subtitle}</p>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Possible Reasons */}
            <div className="space-y-3">
              <h3 className="font-semibold">{content.reasons}</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  {content.reason1}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  {content.reason2}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  {content.reason3}
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                  {content.reason4}
                </li>
              </ul>
            </div>

            {/* Support Section */}
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">{content.supportTitle}</h4>
              <p className="text-sm text-muted-foreground mb-3">{content.supportDesc}</p>
              <div className="flex flex-wrap gap-3 text-sm">
                <a href="tel:562525665" className="flex items-center gap-1 text-primary hover:underline">
                  <Phone className="w-3 h-3" />
                  562525665
                </a>
                <a href="mailto:info@rhalat.com" className="flex items-center gap-1 text-primary hover:underline">
                  <Mail className="w-3 h-3" />
                  info@rhalat.com
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button className="w-full h-12 gap-2">
                <RefreshCw className="w-4 h-4" />
                {content.tryAgain}
              </Button>
              
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="gap-2">
                  <MessageCircle className="w-4 h-4" />
                  {content.contactSupport}
                </Button>
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
