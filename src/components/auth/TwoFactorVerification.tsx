import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Shield, Mail, ArrowRight } from 'lucide-react';

interface TwoFactorVerificationProps {
  email: string;
  onVerify: (code: string) => Promise<boolean>;
  onResend: () => Promise<void>;
  onCancel: () => void;
}

// Helper function to mask email for security
const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (!domain) return '***@***.***';
  
  const [domainName, extension] = domain.split('.');
  
  // Mask local part: show first char, mask middle, show last char if long enough
  let maskedLocal = '';
  if (localPart.length <= 2) {
    maskedLocal = '*'.repeat(localPart.length);
  } else {
    maskedLocal = localPart[0] + '*'.repeat(Math.min(localPart.length - 2, 5)) + localPart[localPart.length - 1];
  }
  
  // Mask domain: show first char only
  const maskedDomain = domainName[0] + '*'.repeat(Math.min(domainName.length - 1, 4));
  
  return `${maskedLocal}@${maskedDomain}.${extension || '***'}`;
};

export default function TwoFactorVerification({
  email,
  onVerify,
  onResend,
  onCancel,
}: TwoFactorVerificationProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus first input
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    // Countdown timer for resend
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    const numValue = value.replace(/\D/g, '').slice(-1);
    
    const newCode = [...code];
    newCode[index] = numValue;
    setCode(newCode);
    setError('');

    // Auto-focus next input
    if (numValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newCode = [...code];
    pastedData.split('').forEach((char, i) => {
      if (i < 6) newCode[i] = char;
    });
    setCode(newCode);
    
    // Focus the next empty input or the last one
    const nextEmptyIndex = newCode.findIndex(c => !c);
    inputRefs.current[nextEmptyIndex === -1 ? 5 : nextEmptyIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCode = code.join('');
    
    if (fullCode.length !== 6) {
      setError('يرجى إدخال الرمز المكون من 6 أرقام');
      return;
    }

    setVerifying(true);
    setError('');

    try {
      const success = await onVerify(fullCode);
      if (!success) {
        setError('الرمز غير صحيح أو منتهي الصلاحية');
        setCode(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'حدث خطأ في التحقق';
      setError(message || 'حدث خطأ في التحقق');
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await onResend();
      setCountdown(60);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError('حدث خطأ في إعادة الإرسال');
    } finally {
      setResending(false);
    }
  };

  return (
    <Card className="border-slate-700 bg-slate-800/90 backdrop-blur-sm shadow-2xl">
      <CardHeader className="text-center space-y-4 pb-2">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-primary/10 border border-primary/20">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <div>
          <CardTitle className="text-xl font-bold text-white">
            التحقق بخطوتين
          </CardTitle>
          <CardDescription className="text-slate-400 mt-2 flex items-center justify-center gap-2">
            <Mail className="h-4 w-4" />
            تم إرسال رمز التحقق إلى بريدك الإلكتروني
          </CardDescription>
          <p className="text-sm text-slate-500 mt-1" dir="ltr">
            {maskEmail(email)}
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-slate-300 text-center block">
              أدخل رمز التحقق المكون من 6 أرقام
            </Label>
            <div className="flex justify-center gap-2" dir="ltr" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-14 text-center text-2xl font-bold bg-slate-700/50 border-slate-600 text-white focus:border-primary"
                  disabled={verifying}
                />
              ))}
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-5"
            disabled={verifying || code.join('').length !== 6}
          >
            {verifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                جاري التحقق...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 ml-2" />
                تأكيد الدخول
              </>
            )}
          </Button>

          <div className="text-center space-y-2">
            <p className="text-sm text-slate-400">
              لم تستلم الرمز؟
            </p>
            <Button
              type="button"
              variant="ghost"
              onClick={handleResend}
              disabled={countdown > 0 || resending}
              className="text-primary hover:text-primary/80"
            >
              {resending ? (
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
              ) : countdown > 0 ? (
                `إعادة الإرسال بعد ${countdown} ثانية`
              ) : (
                'إعادة إرسال الرمز'
              )}
            </Button>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="w-full text-slate-400 hover:text-white"
          >
            العودة لتسجيل الدخول
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
