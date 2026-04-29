import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  open: boolean;
  onExtend: () => void;
  onLogout: () => void;
  countdownSeconds?: number;
}

export default function IdleWarningDialog({ open, onExtend, onLogout, countdownSeconds = 120 }: Props) {
  const [remaining, setRemaining] = useState(countdownSeconds);

  useEffect(() => {
    if (!open) {
      setRemaining(countdownSeconds);
      return;
    }
    setRemaining(countdownSeconds);
    const t = window.setInterval(() => {
      setRemaining(r => (r <= 1 ? 0 : r - 1));
    }, 1000);
    return () => window.clearInterval(t);
  }, [open, countdownSeconds]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onExtend(); }}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            تنبيه: انتهاء الجلسة قريباً
          </DialogTitle>
          <DialogDescription>
            لم نلاحظ أي نشاط منذ فترة. سيتم تسجيل الخروج تلقائياً خلال{' '}
            <span className="font-bold text-foreground">{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}</span>{' '}
            للحفاظ على أمان حسابك.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onLogout}>تسجيل الخروج الآن</Button>
          <Button onClick={onExtend}>متابعة العمل</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
