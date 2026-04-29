import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Shield, RotateCw, Copy, KeyRound, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

function generateRandomPath(length = 16): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  let out = 'portal-';
  for (let i = 0; i < length; i++) out += chars[arr[i] % chars.length];
  return out;
}

export default function PortalSecurity() {
  const qc = useQueryClient();
  const [customPath, setCustomPath] = useState('');
  const [rotating, setRotating] = useState(false);
  const [pendingPath, setPendingPath] = useState<string | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ['staff-portal-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('staff_portal_settings')
        .select('*')
        .eq('id', 1)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const currentUrl = settings ? `${window.location.origin}/${settings.secret_path}` : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    toast.success('تم نسخ الرابط');
  };

  const handleRotate = async (newPath: string) => {
    setRotating(true);
    try {
      const { data, error } = await supabase.functions.invoke('rotate-portal-secret', {
        body: { new_path: newPath },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);

      toast.success(`تم تدوير المسار بنجاح. الرابط الجديد: /${data.new_path}`);
      qc.invalidateQueries({ queryKey: ['staff-portal-settings'] });
      setCustomPath('');
      setPendingPath(null);
    } catch (e: any) {
      toast.error(e.message || 'فشل تدوير المسار');
    } finally {
      setRotating(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6 max-w-4xl" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          أمان بوابة الموظفين
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          إدارة المسار السري لدخول فريق العمل وتدويره عند الحاجة
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            الرابط السري الحالي
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-sm break-all">
            <span className="flex-1">{currentUrl}</span>
            <Button size="sm" variant="ghost" onClick={handleCopy}><Copy className="h-4 w-4" /></Button>
          </div>
          {settings?.rotated_at && (
            <p className="text-xs text-muted-foreground">
              آخر تدوير: <Badge variant="outline">{format(new Date(settings.rotated_at), 'PPpp', { locale: ar })}</Badge>
            </p>
          )}
        </CardContent>
      </Card>

      <Alert variant="destructive" className="border-amber-300 bg-amber-50 text-amber-900 [&>svg]:text-amber-600">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>تحذير قبل التدوير</AlertTitle>
        <AlertDescription className="space-y-1 text-sm">
          <p>عند تدوير المسار:</p>
          <ul className="list-disc pr-5 space-y-1">
            <li>سيتم إجبار <strong>جميع الموظفين</strong> على إعادة تسجيل الدخول.</li>
            <li>الرابط القديم لن يعمل بعد التدوير.</li>
            <li>سيتم إرسال الرابط الجديد تلقائياً عبر البريد لكل الموظفين.</li>
            <li>هذا الإجراء يُسجَّل في سجل التدقيق.</li>
          </ul>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCw className="h-5 w-5" />
            تدوير المسار السري
          </CardTitle>
          <CardDescription>اختر مساراً عشوائياً موصى به أو أدخل مساراً مخصصاً (8-40 حرف، أحرف إنجليزية صغيرة وأرقام وشرطة فقط)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>مسار مخصص (اختياري)</Label>
            <Input
              value={customPath}
              onChange={(e) => setCustomPath(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="مثلاً: portal-newpath2026"
              maxLength={40}
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  className="flex-1"
                  disabled={rotating}
                  onClick={() => setPendingPath(generateRandomPath())}
                >
                  <RotateCw className="h-4 w-4 ml-2" />
                  توليد مسار عشوائي وتدوير
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد تدوير المسار</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم تغيير المسار إلى: <code className="block mt-2 p-2 bg-muted rounded">{pendingPath}</code>
                    <br />
                    وسيُسجَّل خروج جميع الموظفين فوراً. هل أنت متأكد؟
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={() => pendingPath && handleRotate(pendingPath)}>
                    نعم، تدوير الآن
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={rotating || customPath.length < 8}
                >
                  استخدام المسار المخصص
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent dir="rtl">
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد تدوير المسار</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم تغيير المسار إلى: <code className="block mt-2 p-2 bg-muted rounded">{customPath}</code>
                    <br />
                    وسيُسجَّل خروج جميع الموظفين فوراً. هل أنت متأكد؟
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={() => handleRotate(customPath)}>
                    نعم، تدوير الآن
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
