import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Loader2, Plus, Pencil, Trash2, Upload, Send, Eye, MapPin } from 'lucide-react';

interface Program {
  id: string;
  operator_id: string;
  title: string;
  destination: string;
  description: string | null;
  cover_image_url: string | null;
  duration_days: number;
  duration_nights: number;
  price: number;
  discounted_price: number | null;
  currency: string;
  status: string;
  rejection_reason: string | null;
  views_count: number;
}

const empty = (operator_id: string): Partial<Program> => ({
  operator_id,
  title: '',
  destination: '',
  description: '',
  cover_image_url: '',
  duration_days: 1,
  duration_nights: 0,
  price: 0,
  discounted_price: null,
  currency: 'SAR',
  status: 'draft',
});

const STATUS: Record<string, { label: string; cls: string }> = {
  draft: { label: 'مسودة', cls: 'bg-muted text-foreground' },
  pending: { label: 'قيد المراجعة', cls: 'bg-amber-100 text-amber-800' },
  approved: { label: 'معتمد', cls: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'مرفوض', cls: 'bg-red-100 text-red-800' },
};

export default function MyPrograms() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [operatorId, setOperatorId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Partial<Program> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const refresh = async (opId: string) => {
    const { data } = await supabase
      .from('tour_programs')
      .select('*')
      .eq('operator_id', opId)
      .order('created_at', { ascending: false });
    setPrograms((data as Program[]) ?? []);
  };

  useEffect(() => {
    (async () => {
      const { data: op } = await supabase.from('tour_operators').select('id').maybeSingle();
      if (op) {
        setOperatorId(op.id);
        await refresh(op.id);
      }
      setLoading(false);
    })();
  }, []);

  const openNew = () => {
    if (!operatorId) return;
    setEditing(empty(operatorId));
    setDialogOpen(true);
  };

  const openEdit = (p: Program) => {
    setEditing({ ...p });
    setDialogOpen(true);
  };

  const handleCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/tour-programs/cover-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) {
      toast.error('فشل رفع الصورة');
    } else {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      setEditing((prev) => (prev ? { ...prev, cover_image_url: data.publicUrl } : prev));
      toast.success('تم رفع الصورة');
    }
    setUploading(false);
  };

  const handleSave = async (submit: boolean) => {
    if (!editing || !operatorId) return;
    setSaving(true);
    const payload: any = {
      operator_id: operatorId,
      title: editing.title,
      destination: editing.destination,
      description: editing.description,
      cover_image_url: editing.cover_image_url,
      duration_days: Number(editing.duration_days) || 1,
      duration_nights: Number(editing.duration_nights) || 0,
      price: Number(editing.price) || 0,
      discounted_price: editing.discounted_price ? Number(editing.discounted_price) : null,
      currency: editing.currency || 'SAR',
      status: submit ? 'pending' : (editing.status === 'rejected' ? 'draft' : editing.status) || 'draft',
    };

    let res;
    if (editing.id) {
      res = await supabase.from('tour_programs').update(payload).eq('id', editing.id);
    } else {
      res = await supabase.from('tour_programs').insert(payload);
    }
    if (res.error) {
      toast.error('فشل الحفظ: ' + res.error.message);
    } else {
      toast.success(submit ? 'تم الإرسال للمراجعة' : 'تم الحفظ كمسودة');
      setDialogOpen(false);
      setEditing(null);
      await refresh(operatorId);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!deleteId || !operatorId) return;
    const { error } = await supabase.from('tour_programs').delete().eq('id', deleteId);
    if (error) toast.error('تعذر الحذف: ' + error.message);
    else {
      toast.success('تم الحذف');
      await refresh(operatorId);
    }
    setDeleteId(null);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">برامجي السياحية</h1>
          <p className="text-muted-foreground mt-1">أنشئ وعدّل برامجك. يجب اعتماد كل برنامج قبل ظهوره للزوار.</p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4 ml-2" /> برنامج جديد
        </Button>
      </div>

      {programs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            لا توجد برامج بعد. ابدأ بإضافة أول برنامج سياحي.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map((p) => {
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
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold">
                      {(p.discounted_price ?? p.price).toLocaleString()} {p.currency}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {p.duration_days}ي / {p.duration_nights}ل
                    </span>
                  </div>
                  {p.status === 'rejected' && p.rejection_reason && (
                    <div className="text-xs bg-red-50 text-red-700 p-2 rounded">
                      <strong>سبب الرفض:</strong> {p.rejection_reason}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(p)}>
                      <Pencil className="h-3 w-3 ml-1" /> تعديل
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600" onClick={() => setDeleteId(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent dir="rtl" className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing?.id ? 'تعديل برنامج' : 'برنامج جديد'}</DialogTitle>
            <DialogDescription>املأ بيانات البرنامج. يمكنك الحفظ كمسودة أو إرساله للمراجعة.</DialogDescription>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>عنوان البرنامج</Label>
                <Input
                  value={editing.title ?? ''}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </div>
              <div>
                <Label>الوجهة</Label>
                <Input
                  value={editing.destination ?? ''}
                  onChange={(e) => setEditing({ ...editing, destination: e.target.value })}
                  placeholder="تركيا، ماليزيا..."
                />
              </div>
              <div>
                <Label>الوصف</Label>
                <Textarea
                  rows={4}
                  value={editing.description ?? ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>عدد الأيام</Label>
                  <Input
                    type="number"
                    min={1}
                    value={editing.duration_days ?? 1}
                    onChange={(e) => setEditing({ ...editing, duration_days: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>عدد الليالي</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editing.duration_nights ?? 0}
                    onChange={(e) => setEditing({ ...editing, duration_nights: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>السعر</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editing.price ?? 0}
                    onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>السعر بعد الخصم (اختياري)</Label>
                  <Input
                    type="number"
                    min={0}
                    value={editing.discounted_price ?? ''}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        discounted_price: e.target.value === '' ? null : Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>صورة الغلاف</Label>
                <div className="flex items-center gap-3">
                  {editing.cover_image_url && (
                    <img src={editing.cover_image_url} className="h-16 w-24 object-cover rounded border" alt="cover" />
                  )}
                  <Label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handleCover} />
                    <span className="inline-flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-muted text-sm">
                      {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      رفع صورة
                    </span>
                  </Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
              حفظ كمسودة
            </Button>
            <Button onClick={() => handleSave(true)} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Send className="h-4 w-4 ml-2" />}
              إرسال للمراجعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف البرنامج</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا البرنامج؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}