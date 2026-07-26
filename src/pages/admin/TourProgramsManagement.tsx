import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, XCircle, MapPin, Map } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: 'مسودة', cls: 'bg-muted text-foreground' },
  pending: { label: 'قيد المراجعة', cls: 'bg-amber-100 text-amber-800' },
  approved: { label: 'معتمد', cls: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'مرفوض', cls: 'bg-red-100 text-red-800' },
};

export default function TourProgramsManagement() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [tab, setTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [rejectFor, setRejectFor] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('tour_programs')
      .select('*, tour_operators(company_name, is_verified)')
      .order('created_at', { ascending: false });
    setPrograms(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const approve = async (id: string) => {
    const { error } = await supabase
      .from('tour_programs')
      .update({ status: 'approved', rejection_reason: null })
      .eq('id', id);
    if (error) toast.error('فشل الاعتماد');
    else { toast.success('تم اعتماد البرنامج'); load(); }
  };

  const reject = async () => {
    if (!rejectFor) return;
    const { error } = await supabase
      .from('tour_programs')
      .update({ status: 'rejected', rejection_reason: rejectReason })
      .eq('id', rejectFor.id);
    if (error) toast.error('فشل الرفض');
    else {
      toast.success('تم رفض البرنامج');
      setRejectFor(null); setRejectReason(''); load();
    }
  };

  const filtered = programs.filter((p) => tab === 'all' || p.status === tab);

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        icon={Map}
        title="إدارة البرامج السياحية"
        description="اعتمد أو ارفض البرامج المقدّمة من وكلاء السياحة"
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pending">قيد المراجعة ({programs.filter(p => p.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="approved">معتمدة</TabsTrigger>
          <TabsTrigger value="rejected">مرفوضة</TabsTrigger>
          <TabsTrigger value="all">الكل</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">لا توجد برامج.</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((p) => {
                const st = STATUS[p.status] ?? STATUS.draft;
                return (
                  <Card key={p.id} className="overflow-hidden">
                    <div className="relative aspect-video bg-muted">
                      {p.cover_image_url ? (
                        <img src={p.cover_image_url} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
                          لا توجد صورة
                        </div>
                      )}
                      <Badge className={`absolute top-2 right-2 ${st.cls}`}>{st.label}</Badge>
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <h3 className="font-semibold line-clamp-1">{p.title}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" /> {p.destination}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        الوكيل: <strong>{p.tour_operators?.company_name ?? 'غير معروف'}</strong>
                        {' '}({p.tour_operators?.email})
                      </p>
                      <p className="text-sm font-bold">
                        {(p.discounted_price ?? p.price)?.toLocaleString()} {p.currency}
                      </p>
                      {p.rejection_reason && (
                        <p className="text-xs bg-red-50 text-red-700 p-2 rounded">سبب الرفض: {p.rejection_reason}</p>
                      )}
                      {p.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => approve(p.id)}>
                            <CheckCircle2 className="h-4 w-4 ml-1" /> اعتماد
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => setRejectFor(p)}>
                            <XCircle className="h-4 w-4 ml-1" /> رفض
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!rejectFor} onOpenChange={(o) => !o && setRejectFor(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>رفض البرنامج</DialogTitle>
          </DialogHeader>
          <div>
            <Label>سبب الرفض</Label>
            <Textarea rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectFor(null)}>إلغاء</Button>
            <Button onClick={reject} className="bg-red-600 hover:bg-red-700" disabled={!rejectReason.trim()}>
              تأكيد الرفض
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}