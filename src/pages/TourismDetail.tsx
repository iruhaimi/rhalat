import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { MapPin, Loader2, Plane, Calendar, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function TourismDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    travelers_count: 1, preferred_date: '', notes: '',
  });

  useEffect(() => {
    if (!id) return;
    (async () => {
      const { data } = await supabase
        .from('tour_programs')
        .select('*, tour_operators_public(company_name, logo_url)')
        .eq('id', id)
        .eq('status', 'approved')
        .maybeSingle();
      setProgram(data);
      setLoading(false);
      if (data) document.title = `${data.title} | برنامج سياحي`;
    })();
  }, [id]);

  const handleBook = async () => {
    if (!user) { toast.error('يرجى تسجيل الدخول للحجز'); return; }
    if (!form.customer_name || !form.customer_phone) { toast.error('الاسم ورقم الجوال مطلوبان'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('tour_bookings').insert({
      program_id: program.id,
      operator_id: program.operator_id,
      user_id: user.id,
      ...form,
      travelers_count: Number(form.travelers_count) || 1,
    });
    setSubmitting(false);
    if (error) { toast.error('تعذّر إرسال الطلب'); return; }
    toast.success('تم إرسال طلب الحجز. سيتواصل معك الوكيل قريباً.');
    setOpen(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
  );
  if (!program) return (
    <div className="container mx-auto py-20 text-center" dir="rtl">
      <p className="text-muted-foreground mb-4">البرنامج غير متوفر</p>
      <Link to="/tourism" className="text-primary underline">العودة إلى البرامج</Link>
    </div>
  );

  const inclusions: string[] = Array.isArray(program.inclusions) ? program.inclusions : [];
  const exclusions: string[] = Array.isArray(program.exclusions) ? program.exclusions : [];
  const itinerary: any[] = Array.isArray(program.daily_itinerary) ? program.daily_itinerary : [];

  return (
    <div className="min-h-screen bg-background py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-5xl">
        <Link to="/tourism" className="inline-flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-primary">
          <ArrowRight className="h-4 w-4" /> العودة للبرامج
        </Link>

        <div className="aspect-video rounded-lg overflow-hidden bg-muted mb-6">
          {program.cover_image_url ? (
            <img src={program.cover_image_url} alt={program.title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground"><Plane className="h-12 w-12" /></div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{program.title}</h1>
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="h-4 w-4" /> {program.destination}
              </p>
            </div>

            {program.description && (
              <Card><CardContent className="p-4 whitespace-pre-line">{program.description}</CardContent></Card>
            )}

            {itinerary.length > 0 && (
              <Card><CardContent className="p-4">
                <h3 className="font-semibold mb-2">البرنامج اليومي</h3>
                <ol className="space-y-2">
                  {itinerary.map((d, i) => (
                    <li key={i} className="border-r-2 border-primary pr-3">
                      <strong>اليوم {i + 1}:</strong> {typeof d === 'string' ? d : d.title || d.description}
                    </li>
                  ))}
                </ol>
              </CardContent></Card>
            )}

            {(inclusions.length > 0 || exclusions.length > 0) && (
              <div className="grid sm:grid-cols-2 gap-4">
                {inclusions.length > 0 && (
                  <Card><CardContent className="p-4">
                    <h4 className="font-semibold mb-2 text-green-700">يشمل</h4>
                    <ul className="text-sm space-y-1">{inclusions.map((x, i) => <li key={i}>✓ {x}</li>)}</ul>
                  </CardContent></Card>
                )}
                {exclusions.length > 0 && (
                  <Card><CardContent className="p-4">
                    <h4 className="font-semibold mb-2 text-red-700">لا يشمل</h4>
                    <ul className="text-sm space-y-1">{exclusions.map((x, i) => <li key={i}>✗ {x}</li>)}</ul>
                  </CardContent></Card>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <Card><CardContent className="p-4 space-y-3">
              <div className="text-2xl font-bold">
                {program.discounted_price ? (
                  <>
                    {Number(program.discounted_price).toLocaleString()} {program.currency}
                    <div className="text-sm text-muted-foreground line-through font-normal">
                      {Number(program.price).toLocaleString()} {program.currency}
                    </div>
                  </>
                ) : (
                  <>{Number(program.price).toLocaleString()} {program.currency}</>
                )}
              </div>
              <div className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" /> {program.duration_days} أيام / {program.duration_nights} ليالي
              </div>
              {program.tour_operators_public?.company_name && (
                <p className="text-xs text-muted-foreground">
                  مقدم من: <strong>{program.tour_operators_public.company_name}</strong>
                </p>
              )}
              {program.max_seats && (
                <Badge variant="outline">المقاعد المتبقية: {program.max_seats - program.seats_booked}</Badge>
              )}

              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" size="lg">احجز الآن</Button>
                </DialogTrigger>
                <DialogContent dir="rtl">
                  <DialogHeader><DialogTitle>طلب حجز</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label>الاسم الكامل</Label>
                      <Input value={form.customer_name} onChange={e => setForm({ ...form, customer_name: e.target.value })} /></div>
                    <div><Label>رقم الجوال</Label>
                      <Input value={form.customer_phone} onChange={e => setForm({ ...form, customer_phone: e.target.value })} /></div>
                    <div><Label>البريد الإلكتروني (اختياري)</Label>
                      <Input type="email" value={form.customer_email} onChange={e => setForm({ ...form, customer_email: e.target.value })} /></div>
                    <div><Label>عدد المسافرين</Label>
                      <Input type="number" min={1} value={form.travelers_count} onChange={e => setForm({ ...form, travelers_count: Number(e.target.value) })} /></div>
                    <div><Label>التاريخ المفضل</Label>
                      <Input value={form.preferred_date} onChange={e => setForm({ ...form, preferred_date: e.target.value })} placeholder="مثال: يونيو 2026" /></div>
                    <div><Label>ملاحظات</Label>
                      <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleBook} disabled={submitting}>
                      {submitting && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
                      إرسال الطلب
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent></Card>
          </div>
        </div>
      </div>
    </div>
  );
}