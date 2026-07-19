import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, UserCheck, CheckCircle, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UnlockRequestFormProps {
  email: string;
  userId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Helper function to mask email for security
const maskEmail = (email: string): string => {
  const [localPart, domain] = email.split('@');
  if (!domain) return '***@***.***';
  
  const [domainName, extension] = domain.split('.');
  
  let maskedLocal = '';
  if (localPart.length <= 2) {
    maskedLocal = '*'.repeat(localPart.length);
  } else {
    maskedLocal = localPart[0] + '*'.repeat(Math.min(localPart.length - 2, 5)) + localPart[localPart.length - 1];
  }
  
  const maskedDomain = domainName[0] + '*'.repeat(Math.min(domainName.length - 1, 4));
  
  return `${maskedLocal}@${maskedDomain}.${extension || '***'}`;
};

export default function UnlockRequestForm({
  email,
  userId,
  onSuccess,
  onCancel,
}: UnlockRequestFormProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      toast.error('يرجى إدخال سبب الطلب');
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.rpc('submit_unlock_request', {
        p_email: email,
        p_reason: reason.trim(),
      });

      if (error) {
        if ((error as any).message?.includes('rate_limited')) {
          toast.error('لقد تجاوزت الحد المسموح. حاول لاحقاً.');
          return;
        }
        throw error;
      }

      setSubmitted(true);
      toast.success('تم إرسال طلب فك القفل بنجاح');
    } catch (err) {
      console.error('Error submitting unlock request:', err);
      toast.error('حدث خطأ في إرسال الطلب');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="border-slate-700 bg-slate-800/90 backdrop-blur-sm shadow-2xl">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-green-500/10 border border-green-500/20">
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">تم إرسال الطلب</h3>
            <p className="text-slate-400 mt-2">
              سيتم مراجعة طلبك من قبل أحد المسؤولين. ستتمكن من الدخول بمجرد الموافقة على طلبك.
            </p>
          </div>
          <Button
            onClick={onSuccess}
            className="w-full bg-primary hover:bg-primary/90 text-white mt-4"
          >
            العودة لصفحة الدخول
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-700 bg-slate-800/90 backdrop-blur-sm shadow-2xl">
      <CardHeader className="text-center space-y-4 pb-2">
        <div className="flex justify-center">
          <div className="p-4 rounded-full bg-amber-500/10 border border-amber-500/20">
            <UserCheck className="h-8 w-8 text-amber-500" />
          </div>
        </div>
        <div>
          <CardTitle className="text-xl font-bold text-white">
            طلب فك قفل الحساب
          </CardTitle>
          <CardDescription className="text-slate-400 mt-2">
            سيتم إرسال طلبك لمراجعته من قبل مسؤول آخر
          </CardDescription>
          <p className="text-sm text-slate-500 mt-1" dir="ltr">
            {maskEmail(email)}
          </p>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <form onSubmit={handleSubmit} className="space-y-5" dir="rtl">
          {/* Info */}
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div>
                <p>سيتم إرسال طلبك للمراجعة. يجب أن يوافق مسؤول آخر على طلبك قبل فك القفل.</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason" className="text-slate-300">
              سبب الطلب <span className="text-red-400">*</span>
            </Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="مثال: نسيت رموز الاسترداد وأحتاج للوصول لحسابي للعمل..."
              className="bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500 focus:border-primary min-h-[100px]"
              disabled={submitting}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white font-medium py-5"
            disabled={submitting || !reason.trim()}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin ml-2" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <UserCheck className="h-4 w-4 ml-2" />
                إرسال الطلب
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="w-full text-slate-400 hover:text-white"
          >
            إلغاء
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
