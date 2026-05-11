import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Phone, Mail, Users } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: 'بانتظار التواصل', cls: 'bg-amber-100 text-amber-800' },
  contacted: { label: 'تم التواصل', cls: 'bg-sky-100 text-sky-800' },
  confirmed: { label: 'مؤكد', cls: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'ملغي', cls: 'bg-red-100 text-red-800' },
};

export default function MyBookings() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<any[]>([]);

  const load = async () => {
    const { data } = await supabase
      .from('tour_bookings')
      .select('*, tour_programs(title, destination)')
      .order('created_at', { ascending: false });
    setBookings(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('tour_bookings').update({ status }).eq('id', id);
    if (error) toast.error('تعذر تحديث الحالة');
    else {
      toast.success('تم تحديث الحالة');
      load();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div>
        <h1 className="text-2xl font-bold">حجوزات برامجي</h1>
        <p className="text-muted-foreground mt-1">قائمة العملاء الذين أبدوا اهتمامهم ببرامجك السياحية</p>
      </div>

      {bookings.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            لا توجد حجوزات بعد.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const st = STATUS[b.status] ?? STATUS.pending;
            return (
              <Card key={b.id}>
                <CardContent className="p-4 grid md:grid-cols-4 gap-3 items-center">
                  <div>
                    <p className="font-semibold">{b.customer_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {b.tour_programs?.title ?? 'برنامج محذوف'} — {b.tour_programs?.destination}
                    </p>
                  </div>
                  <div className="text-sm space-y-1">
                    <p className="flex items-center gap-2"><Phone className="h-3 w-3" /> {b.customer_phone}</p>
                    {b.customer_email && (
                      <p className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-3 w-3" /> {b.customer_email}
                      </p>
                    )}
                  </div>
                  <div className="text-sm">
                    <p className="flex items-center gap-2">
                      <Users className="h-3 w-3" /> {b.travelers_count} مسافر
                    </p>
                    {b.preferred_date && (
                      <p className="text-xs text-muted-foreground">التاريخ: {b.preferred_date}</p>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2">
                    <Badge className={st.cls}>{st.label}</Badge>
                    <Select value={b.status} onValueChange={(v) => updateStatus(b.id, v)}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">بانتظار التواصل</SelectItem>
                        <SelectItem value="contacted">تم التواصل</SelectItem>
                        <SelectItem value="confirmed">مؤكد</SelectItem>
                        <SelectItem value="cancelled">ملغي</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}