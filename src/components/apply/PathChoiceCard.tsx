import { useState } from 'react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { useApplication } from '@/contexts/ApplicationContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Globe, MessageCircle, ArrowRight, ArrowLeft, Loader2, ShieldCheck, Zap, Phone, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { filterNonNumeric } from '@/lib/inputFilters';

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

interface Props {
  onBack: () => void;
}

export default function PathChoiceCard({ onBack }: Props) {
  const { direction } = useLanguage();
  const { applicationData, updateApplicationData, goToNextStep, setShowAuthGate, calculateTotal, resetApplication } = useApplication();
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isRTL = direction === 'rtl';
  const [submittingWA, setSubmittingWA] = useState(false);
  const [phoneInput, setPhoneInput] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);
  const ArrowBack = isRTL ? ArrowRight : ArrowLeft;

  const needsPhone = !!user && !profile?.phone;

  const handleSavePhone = async () => {
    if (phoneInput.length !== 9) {
      toast({
        title: isRTL ? 'رقم غير صحيح' : 'Invalid phone',
        description: isRTL ? 'يجب أن يتكون الرقم من 9 أرقام' : 'Phone must be exactly 9 digits',
        variant: 'destructive',
      });
      return;
    }
    if (!profile?.id) return;
    setSavingPhone(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ phone: phoneInput })
        .eq('id', profile.id);
      if (error) throw error;
      updateApplicationData({ phone: phoneInput, countryCode: '+966' });
      await refreshProfile();
      toast({
        title: isRTL ? '✅ تم حفظ الرقم' : '✅ Phone saved',
      });
    } catch (err: any) {
      toast({
        title: 'خطأ',
        description: err.message || 'فشل حفظ الرقم',
        variant: 'destructive',
      });
    } finally {
      setSavingPhone(false);
    }
  };

  const buildWhatsAppMessage = (appNumber: string) => {
    const { grandTotal } = calculateTotal();
    const travelers = applicationData.travelers;
    const travelersStr = [
      `${travelers.adults} بالغ`,
      travelers.children > 0 ? `${travelers.children} طفل` : null,
      travelers.infants > 0 ? `${travelers.infants} رضيع` : null,
    ].filter(Boolean).join('، ');
    const travelDateStr = applicationData.travelDate
      ? format(applicationData.travelDate, 'PPP', { locale: ar })
      : 'غير محدد';
    const fullName = profile?.full_name || '';
    const email = user?.email || '';
    const phone = profile?.phone || '';
    return `مرحباً، أرغب بإكمال طلب التأشيرة عبر واتساب

📋 رقم الطلب: ${appNumber}
👤 الاسم: ${fullName}
📧 البريد: ${email}
📱 الجوال: ${phone}

🌍 الدولة: ${applicationData.countryName}
📄 نوع التأشيرة: ${applicationData.visaTypeName}
📅 تاريخ السفر: ${travelDateStr}
👥 المسافرون: ${travelersStr}

💰 المبلغ الإجمالي: ${grandTotal.toLocaleString()} ر.س
✅ موافق على الشروط والأحكام

جاهز لإرسال المستندات وإكمال الدفع.`;
  };

  const handleElectronic = () => {
    if (needsPhone) {
      toast({
        title: isRTL ? 'رقم الجوال مطلوب' : 'Phone required',
        description: isRTL ? 'يرجى إدخال رقم جوالك أولاً' : 'Please enter your phone first',
        variant: 'destructive',
      });
      return;
    }
    if (!applicationData.termsAccepted) {
      toast({
        title: isRTL ? 'الموافقة على الشروط مطلوبة' : 'Terms required',
        description: isRTL ? 'يرجى الموافقة على الشروط والأحكام للمتابعة' : 'Please accept the Terms to continue',
        variant: 'destructive',
      });
      return;
    }
    if (!user) {
      setShowAuthGate(true);
    } else {
      goToNextStep();
    }
  };

  const handleWhatsApp = async () => {
    if (needsPhone) {
      toast({
        title: isRTL ? 'رقم الجوال مطلوب' : 'Phone required',
        description: isRTL ? 'يرجى إدخال رقم جوالك أولاً' : 'Please enter your phone first',
        variant: 'destructive',
      });
      return;
    }
    if (!applicationData.termsAccepted) {
      toast({
        title: isRTL ? 'الموافقة على الشروط مطلوبة' : 'Terms required',
        description: isRTL ? 'يرجى الموافقة على الشروط والأحكام للمتابعة' : 'Please accept the Terms to continue',
        variant: 'destructive',
      });
      return;
    }
    if (!user) {
      setShowAuthGate(true);
      return;
    }
    setSubmittingWA(true);
    try {
      const ip = await getClientIP();
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : null;
      const meta = JSON.parse(JSON.stringify({
        travelers: applicationData.travelers,
        countryName: applicationData.countryName,
        visaTypeName: applicationData.visaTypeName,
        checkedRequirements: applicationData.checkedRequirements,
        totalAmount: calculateTotal().grandTotal,
      }));
      const termsPayload = JSON.parse(JSON.stringify({
        accepted: true,
        version: TERMS_VERSION,
        ip,
        userAgent: ua,
      }));
      const { data, error } = await supabase.rpc('create_whatsapp_order', {
        p_visa_type_id: applicationData.visaTypeId,
        p_travel_date: applicationData.travelDate ? applicationData.travelDate.toISOString().split('T')[0] : null,
        p_meta: meta,
        p_terms: termsPayload,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      const appNumber = row?.display_number || `VF-${Date.now().toString(36).toUpperCase()}`;
      const message = buildWhatsAppMessage(appNumber);
      const whatsappUrl = `https://wa.me/966562525665?text=${encodeURIComponent(message)}`;
      try { sessionStorage.setItem(`wa_message_${appNumber}`, message); } catch {}
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
    } catch (err: any) {
      console.error('WhatsApp order error:', err);
      toast({
        title: 'خطأ',
        description: err.message || 'فشل إنشاء الطلب، حاول مرة أخرى',
        variant: 'destructive',
      });
    } finally {
      setSubmittingWA(false);
    }
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">
          {isRTL ? 'كيف تريد إكمال طلبك؟' : 'How would you like to continue?'}
        </h2>
        <p className="text-sm text-muted-foreground">
          {isRTL
            ? 'اختر الطريقة الأنسب لك — كلا الخيارين سيُنشئان رقم طلب رسمي'
            : 'Pick the method that suits you — both create an official order number'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Electronic path */}
        <motion.button
          type="button"
          whileHover={{ y: -4 }}
          onClick={handleElectronic}
          disabled={submittingWA}
          className="group relative text-start p-6 rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-primary/0 hover:border-primary hover:shadow-lg transition-all"
        >
          <div className="absolute top-3 left-3 rtl:left-auto rtl:right-3 px-2 py-0.5 text-[10px] font-bold bg-primary text-primary-foreground rounded-full">
            {isRTL ? 'موصى به' : 'Recommended'}
          </div>
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-3">
            <Globe className="w-6 h-6 text-primary" />
          </div>
          <h3 className="font-bold text-lg mb-1">
            {isRTL ? 'إكمال إلكتروني' : 'Complete Online'}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {isRTL
              ? 'ارفع المستندات وادفع الآن خلال دقيقتين'
              : 'Upload documents & pay now in 2 minutes'}
          </p>
          <ul className="text-xs space-y-1.5 text-muted-foreground">
            <li className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-primary" /> {isRTL ? 'معالجة فورية' : 'Instant processing'}</li>
            <li className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-primary" /> {isRTL ? 'حساب آمن وتتبع للطلب' : 'Secure account & tracking'}</li>
          </ul>
        </motion.button>

        {/* WhatsApp path */}
        <motion.button
          type="button"
          whileHover={{ y: -4 }}
          onClick={handleWhatsApp}
          disabled={submittingWA}
          className="group text-start p-6 rounded-2xl border-2 border-green-500/40 bg-gradient-to-br from-green-500/5 to-green-500/0 hover:border-green-500 hover:shadow-lg transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center mb-3">
            {submittingWA ? <Loader2 className="w-6 h-6 text-green-600 animate-spin" /> : <MessageCircle className="w-6 h-6 text-green-600" />}
          </div>
          <h3 className="font-bold text-lg mb-1">
            {isRTL ? 'إكمال عبر الواتساب' : 'Continue via WhatsApp'}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {isRTL
              ? 'بدون تسجيل — موظفنا يكمل معك خطوة بخطوة'
              : 'No sign-up — our agent helps you step by step'}
          </p>
          <ul className="text-xs space-y-1.5 text-muted-foreground">
            <li className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-green-600" /> {isRTL ? 'تواصل مباشر مع موظف' : 'Direct contact with agent'}</li>
            <li className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-green-600" /> {isRTL ? 'رقم طلب فوري للمتابعة' : 'Instant order number'}</li>
          </ul>
        </motion.button>
      </div>

      {/* Terms checkbox */}
      <div className="bg-muted/40 border border-border rounded-xl p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            id="path-terms"
            checked={applicationData.termsAccepted}
            onCheckedChange={(checked) => updateApplicationData({ termsAccepted: !!checked })}
            className="mt-0.5"
          />
          <label htmlFor="path-terms" className="text-sm leading-relaxed cursor-pointer flex-1">
            {isRTL ? 'أوافق على ' : 'I agree to the '}
            <Link to="/terms" target="_blank" className="text-primary font-medium underline underline-offset-2">
              {isRTL ? 'الشروط والأحكام' : 'Terms & Conditions'}
            </Link>
            {isRTL ? ' و' : ' and '}
            <Link to="/privacy" target="_blank" className="text-primary font-medium underline underline-offset-2">
              {isRTL ? 'سياسة الخصوصية' : 'Privacy Policy'}
            </Link>
            {isRTL ? ' و' : ' and '}
            <Link to="/refund" target="_blank" className="text-primary font-medium underline underline-offset-2">
              {isRTL ? 'سياسة الاسترداد' : 'Refund Policy'}
            </Link>
          </label>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        disabled={submittingWA}
        className="gap-2"
      >
        <ArrowBack className="w-4 h-4" />
        {isRTL ? 'رجوع لتعديل المتطلبات' : 'Back to requirements'}
      </Button>
    </div>
  );
}