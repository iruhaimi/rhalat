import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Loader2, FileText, AlertTriangle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import PageHeader from '@/components/admin/PageHeader';

interface VisaRequirement {
  id: string;
  visa_type_id: string;
  code: string | null;
  name_ar: string;
  name_en: string;
  description_ar: string | null;
  description_en: string | null;
  icon: string | null;
  applies_to: 'all' | 'adult' | 'child' | 'infant';
  is_required: boolean;
  requires_upload: boolean;
  display_order: number;
  is_active: boolean;
}

const APPLIES_TO_LABELS: Record<string, string> = {
  all: 'جميع المسافرين',
  adult: 'البالغين فقط',
  child: 'الأطفال فقط',
  infant: 'الرضع فقط',
};

const blankForm: Partial<VisaRequirement> = {
  name_ar: '',
  name_en: '',
  description_ar: '',
  description_en: '',
  applies_to: 'all',
  is_required: true,
  requires_upload: true,
  display_order: 0,
  is_active: true,
};

export default function VisaRequirementsManagement() {
  const qc = useQueryClient();
  const [selectedVisaId, setSelectedVisaId] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<VisaRequirement>>(blankForm);

  // Load all visa types grouped by country for the selector
  const { data: visaTypes, isLoading: visasLoading } = useQuery({
    queryKey: ['admin-visa-types-for-reqs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('visa_types')
        .select('id, name, country:countries(name)')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Load requirements for selected visa type
  const { data: requirements, isLoading: reqsLoading } = useQuery({
    queryKey: ['admin-visa-requirements', selectedVisaId],
    queryFn: async () => {
      if (!selectedVisaId) return [] as VisaRequirement[];
      const { data, error } = await supabase
        .from('visa_requirements')
        .select('*')
        .eq('visa_type_id', selectedVisaId)
        .order('display_order');
      if (error) throw error;
      return (data || []) as VisaRequirement[];
    },
    enabled: !!selectedVisaId,
  });

  const upsertMutation = useMutation({
    mutationFn: async (payload: Partial<VisaRequirement>) => {
      if (editingId) {
        const { error } = await supabase
          .from('visa_requirements')
          .update({
            name_ar: payload.name_ar,
            name_en: payload.name_en,
            description_ar: payload.description_ar,
            description_en: payload.description_en,
            applies_to: payload.applies_to,
            is_required: payload.is_required,
            requires_upload: payload.requires_upload,
            display_order: payload.display_order,
            is_active: payload.is_active,
          })
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('visa_requirements').insert({
          visa_type_id: selectedVisaId,
          name_ar: payload.name_ar!,
          name_en: payload.name_en!,
          description_ar: payload.description_ar || null,
          description_en: payload.description_en || null,
          applies_to: payload.applies_to as any,
          is_required: payload.is_required ?? true,
          requires_upload: payload.requires_upload ?? true,
          display_order: payload.display_order ?? 0,
          is_active: payload.is_active ?? true,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingId ? 'تم تحديث المتطلب' : 'تم إضافة المتطلب');
      qc.invalidateQueries({ queryKey: ['admin-visa-requirements', selectedVisaId] });
      qc.invalidateQueries({ queryKey: ['visa-requirements', selectedVisaId] });
      setDialogOpen(false);
      setForm(blankForm);
      setEditingId(null);
    },
    onError: (e: any) => toast.error(e?.message || 'فشل الحفظ'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('visa_requirements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('تم الحذف');
      qc.invalidateQueries({ queryKey: ['admin-visa-requirements', selectedVisaId] });
      qc.invalidateQueries({ queryKey: ['visa-requirements', selectedVisaId] });
    },
    onError: (e: any) => toast.error(e?.message || 'فشل الحذف'),
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({
      ...blankForm,
      display_order: (requirements?.length || 0) + 1,
    });
    setDialogOpen(true);
  };

  const openEdit = (req: VisaRequirement) => {
    setEditingId(req.id);
    setForm(req);
    setDialogOpen(true);
  };

  const groupedVisas = useMemo(() => {
    const map: Record<string, { id: string; name: string }[]> = {};
    (visaTypes || []).forEach((v: any) => {
      const c = v.country?.name || 'بدون دولة';
      if (!map[c]) map[c] = [];
      map[c].push({ id: v.id, name: v.name });
    });
    return map;
  }, [visaTypes]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="إدارة متطلبات التأشيرات"
        description="حدد المستندات والمتطلبات المطلوبة لكل سفارة. سيراها العميل تلقائياً عند تقديم الطلب."
        icon={FileText}
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">اختر التأشيرة</CardTitle>
          <CardDescription>كل سفارة يمكن أن يكون لها قائمة متطلبات مختلفة.</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedVisaId} onValueChange={setSelectedVisaId}>
            <SelectTrigger>
              <SelectValue placeholder={visasLoading ? 'جاري التحميل...' : 'اختر تأشيرة لإدارة متطلباتها'} />
            </SelectTrigger>
            <SelectContent className="max-h-[400px]">
              {Object.entries(groupedVisas).map(([country, visas]) => (
                <div key={country}>
                  <div className="px-2 py-1 text-xs font-bold text-muted-foreground">{country}</div>
                  {visas.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedVisaId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">المتطلبات</CardTitle>
              <CardDescription>{requirements?.length || 0} متطلب</CardDescription>
            </div>
            <Button onClick={openCreate} size="sm" className="gap-1">
              <Plus className="w-4 h-4" /> إضافة متطلب
            </Button>
          </CardHeader>
          <CardContent>
            {reqsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : !requirements || requirements.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                لا توجد متطلبات لهذه التأشيرة. أضف أول متطلب.
              </div>
            ) : (
              <div className="space-y-2">
                {requirements.map(req => (
                  <div key={req.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/30">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 text-sm font-bold">
                      {req.display_order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm">{req.name_ar}</span>
                        <span className="text-xs text-muted-foreground">/ {req.name_en}</span>
                        {req.is_required ? (
                          <Badge variant="destructive" className="text-[10px] h-5 gap-1">
                            <AlertTriangle className="w-3 h-3" /> إلزامي
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] h-5">اختياري</Badge>
                        )}
                        {!req.requires_upload && (
                          <Badge variant="outline" className="text-[10px] h-5 gap-1">
                            <ShieldCheck className="w-3 h-3" /> بدون رفع
                          </Badge>
                        )}
                        {!req.is_active && (
                          <Badge variant="outline" className="text-[10px] h-5">معطّل</Badge>
                        )}
                        <Badge variant="outline" className="text-[10px] h-5">
                          {APPLIES_TO_LABELS[req.applies_to]}
                        </Badge>
                      </div>
                      {req.description_ar && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{req.description_ar}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(req)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>حذف المتطلب؟</AlertDialogTitle>
                            <AlertDialogDescription>
                              سيتم حذف "{req.name_ar}" نهائياً ولن يظهر للعملاء.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>إلغاء</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteMutation.mutate(req.id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              حذف
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? 'تعديل متطلب' : 'إضافة متطلب جديد'}</DialogTitle>
            <DialogDescription>
              املأ التفاصيل بالعربية والإنجليزية. سيراها العميل في خطوة المستندات.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الاسم (عربي) *</Label>
                <Input
                  value={form.name_ar || ''}
                  onChange={e => setForm({ ...form, name_ar: e.target.value })}
                  placeholder="مثل: شهادة راتب"
                />
              </div>
              <div>
                <Label>الاسم (إنجليزي) *</Label>
                <Input
                  value={form.name_en || ''}
                  onChange={e => setForm({ ...form, name_en: e.target.value })}
                  placeholder="e.g. Salary Certificate"
                />
              </div>
            </div>
            <div>
              <Label>الوصف (عربي)</Label>
              <Textarea
                value={form.description_ar || ''}
                onChange={e => setForm({ ...form, description_ar: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label>الوصف (إنجليزي)</Label>
              <Textarea
                value={form.description_en || ''}
                onChange={e => setForm({ ...form, description_en: e.target.value })}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>يطبّق على</Label>
                <Select
                  value={form.applies_to}
                  onValueChange={v => setForm({ ...form, applies_to: v as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع المسافرين</SelectItem>
                    <SelectItem value="adult">البالغين فقط</SelectItem>
                    <SelectItem value="child">الأطفال فقط</SelectItem>
                    <SelectItem value="infant">الرضع فقط</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>ترتيب العرض</Label>
                <Input
                  type="number"
                  value={form.display_order || 0}
                  onChange={e => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-2 border rounded-lg">
              <div>
                <Label className="cursor-pointer">إلزامي</Label>
                <p className="text-xs text-muted-foreground">يظهر للعميل بشارة "إلزامي" حمراء</p>
              </div>
              <Switch
                checked={!!form.is_required}
                onCheckedChange={v => setForm({ ...form, is_required: v })}
              />
            </div>
            <div className="flex items-center justify-between p-2 border rounded-lg">
              <div>
                <Label className="cursor-pointer">يتطلب رفع ملف</Label>
                <p className="text-xs text-muted-foreground">عطّل إذا كان مجرد بند للتأكيد دون ملف</p>
              </div>
              <Switch
                checked={!!form.requires_upload}
                onCheckedChange={v => setForm({ ...form, requires_upload: v })}
              />
            </div>
            <div className="flex items-center justify-between p-2 border rounded-lg">
              <div>
                <Label className="cursor-pointer">مفعّل</Label>
                <p className="text-xs text-muted-foreground">إذا أُلغي، لن يظهر للعملاء</p>
              </div>
              <Switch
                checked={form.is_active !== false}
                onCheckedChange={v => setForm({ ...form, is_active: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            <Button
              onClick={() => upsertMutation.mutate(form)}
              disabled={!form.name_ar || !form.name_en || upsertMutation.isPending}
            >
              {upsertMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editingId ? 'حفظ التعديلات' : 'إضافة'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}