import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import * as LucideIcons from 'lucide-react';
import {
  Building2, Plane, Landmark, Factory, Smartphone, Wifi, Briefcase, Globe,
  Hotel, ShoppingBag, Car, Hospital, GraduationCap, Banknote, Plus, Pencil,
  Trash2, Loader2, Upload, ImageIcon, Save,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/admin/PageHeader';
import { usePartners, usePartnersSectionSettings, Partner, PartnersSectionSettings } from '@/hooks/usePartners';

const ICON_OPTIONS = [
  'Plane','Landmark','Factory','Building2','Smartphone','Wifi','Briefcase',
  'Globe','Hotel','ShoppingBag','Car','Hospital','GraduationCap','Banknote',
];

function IconPreview({ name, className = 'h-5 w-5' }: { name?: string | null; className?: string }) {
  const Icon = (name && (LucideIcons as any)[name]) || Building2;
  return <Icon className={className} strokeWidth={1.5} />;
}

export default function PartnersManagement() {
  const qc = useQueryClient();
  const { data: partners = [], isLoading, refetch } = usePartners(true);
  const { data: serverSettings } = usePartnersSectionSettings();

  const [settings, setSettings] = useState<PartnersSectionSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [editing, setEditing] = useState<Partner | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Partner | null>(null);

  useEffect(() => {
    if (serverSettings) setSettings(serverSettings);
  }, [serverSettings]);

  const invalidate = () => {
    refetch();
    qc.invalidateQueries({ queryKey: ['partners'] });
    qc.invalidateQueries({ queryKey: ['partners-section-settings'] });
  };

  const saveSettings = async () => {
    if (!settings) return;
    setSavingSettings(true);
    const { data: existing } = await supabase
      .from('site_content')
      .select('id')
      .eq('page', 'home')
      .eq('section', 'partners_section')
      .maybeSingle();
    let error;
    if (existing?.id) {
      ({ error } = await supabase
        .from('site_content')
        .update({ content: settings as any })
        .eq('id', existing.id));
    } else {
      ({ error } = await supabase
        .from('site_content')
        .insert({ page: 'home', section: 'partners_section', content: settings as any, is_active: true }));
    }
    setSavingSettings(false);
    if (error) toast.error('فشل الحفظ: ' + error.message);
    else {
      toast.success('تم حفظ إعدادات القسم');
      invalidate();
    }
  };

  const togglePartner = async (p: Partner) => {
    const { error } = await supabase
      .from('partners' as any)
      .update({ is_active: !p.is_active } as any)
      .eq('id', p.id);
    if (error) toast.error('فشل التحديث: ' + error.message);
    else {
      toast.success(!p.is_active ? 'تم تفعيل الشركة' : 'تم تعطيل الشركة');
      invalidate();
    }
  };

  const deletePartner = async (p: Partner) => {
    const { error } = await supabase.from('partners' as any).delete().eq('id', p.id);
    if (error) toast.error('فشل الحذف: ' + error.message);
    else {
      toast.success('تم حذف الشركة');
      setConfirmDelete(null);
      invalidate();
    }
  };

  const openNew = () => {
    const maxOrder = partners.reduce((m, p) => Math.max(m, p.display_order), 0);
    setEditing({
      id: '', name: '', name_en: '', icon_name: 'Building2',
      logo_url: '', display_order: maxOrder + 1, is_active: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (p: Partner) => {
    setEditing({ ...p });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6" dir="rtl">
      <PageHeader
        title="إدارة الشركاء"
        description='التحكم بقسم "شركاؤنا في النجاح": تفعيل القسم، إضافة وتعديل الشركات وتفعيل/تعطيل كل شركة على حدة.'
        icon={Building2}
      />

      {/* Section settings */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h3 className="font-bold text-lg">إعدادات القسم</h3>
              <p className="text-sm text-muted-foreground">
                {settings?.enabled ? 'القسم ظاهر على الصفحة الرئيسية' : 'القسم مخفي عن الزوار'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="section-active" className="text-sm">إظهار القسم</Label>
              <Switch
                id="section-active"
                checked={!!settings?.enabled}
                onCheckedChange={(v) => settings && setSettings({ ...settings, enabled: v })}
              />
            </div>
          </div>

          {settings && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>العنوان الفرعي (عربي)</Label>
                <Input value={settings.eyebrow_ar} onChange={(e) => setSettings({ ...settings, eyebrow_ar: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>العنوان الفرعي (إنجليزي)</Label>
                <Input value={settings.eyebrow_en} onChange={(e) => setSettings({ ...settings, eyebrow_en: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>العنوان الرئيسي (عربي)</Label>
                <Input value={settings.title_ar} onChange={(e) => setSettings({ ...settings, title_ar: e.target.value })} />
              </div>
              <div className="space-y-1">
                <Label>العنوان الرئيسي (إنجليزي)</Label>
                <Input value={settings.title_en} onChange={(e) => setSettings({ ...settings, title_en: e.target.value })} />
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button onClick={saveSettings} disabled={savingSettings || !settings}>
              {savingSettings ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
              حفظ الإعدادات
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Partners list */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg">قائمة الشركاء ({partners.length})</h3>
              <p className="text-sm text-muted-foreground">يظهر للزوار فقط الشركاء المفعّلون.</p>
            </div>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4 ml-2" />
              إضافة شركة
            </Button>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : partners.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>لا يوجد شركاء. ابدأ بإضافة شركة.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {partners.map((p) => (
                <div
                  key={p.id}
                  className={`flex items-center gap-3 p-4 rounded-xl border bg-card ${!p.is_active ? 'opacity-60' : ''}`}
                >
                  <div className="w-12 h-12 flex-shrink-0 rounded-xl bg-muted flex items-center justify-center overflow-hidden">
                    {p.logo_url ? (
                      <img src={p.logo_url} alt={p.name} className="w-full h-full object-contain" />
                    ) : (
                      <IconPreview name={p.icon_name} className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{p.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>ترتيب: {p.display_order}</span>
                      {p.is_active ? (
                        <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30 text-[10px]">مفعّل</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px]">معطّل</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Switch checked={p.is_active} onCheckedChange={() => togglePartner(p)} />
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setConfirmDelete(p)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <PartnerEditorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        partner={editing}
        onSaved={() => { setDialogOpen(false); invalidate(); }}
      />

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حذف الشريك؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف "{confirmDelete?.name}" نهائياً. هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDelete && deletePartner(confirmDelete)}>
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PartnerEditorDialog({
  open, onOpenChange, partner, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  partner: Partner | null;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<Partner | null>(partner);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => { setForm(partner); }, [partner]);

  if (!form) return null;

  const handleUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop() || 'png';
    const path = `partners/${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });
    if (upErr) {
      toast.error('فشل رفع الصورة: ' + upErr.message);
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
    setForm({ ...form, logo_url: pub.publicUrl });
    setUploading(false);
    toast.success('تم رفع الشعار');
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error('الاسم مطلوب');
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      name_en: form.name_en?.trim() || null,
      icon_name: form.icon_name || null,
      logo_url: form.logo_url || null,
      display_order: form.display_order || 0,
      is_active: form.is_active,
    };
    let error;
    if (form.id) {
      ({ error } = await supabase.from('partners' as any).update(payload as any).eq('id', form.id));
    } else {
      ({ error } = await supabase.from('partners' as any).insert(payload as any));
    }
    setSaving(false);
    if (error) toast.error('فشل الحفظ: ' + error.message);
    else {
      toast.success(form.id ? 'تم تحديث الشركة' : 'تم إضافة الشركة');
      onSaved();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{form.id ? 'تعديل شركة' : 'إضافة شركة جديدة'}</DialogTitle>
          <DialogDescription>الاسم العربي مطلوب. الشعار اختياري — عند رفع شعار يُستخدم بدل الأيقونة.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>الاسم (عربي) *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>الاسم (إنجليزي)</Label>
              <Input value={form.name_en || ''} onChange={(e) => setForm({ ...form, name_en: e.target.value })} dir="ltr" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>الأيقونة</Label>
              <Select value={form.icon_name || 'Building2'} onValueChange={(v) => setForm({ ...form, icon_name: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map((n) => (
                    <SelectItem key={n} value={n}>
                      <div className="flex items-center gap-2">
                        <IconPreview name={n} className="h-4 w-4" />
                        <span>{n}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>ترتيب العرض</Label>
              <Input
                type="number"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>الشعار (اختياري)</Label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl bg-muted flex items-center justify-center overflow-hidden border">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 flex items-center gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUpload(f);
                      e.target.value = '';
                    }}
                  />
                  <span className="inline-flex items-center gap-2 h-9 px-3 rounded-md border bg-background hover:bg-muted text-sm">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploading ? 'جاري الرفع...' : 'رفع شعار'}
                  </span>
                </label>
                {form.logo_url && (
                  <Button variant="ghost" size="sm" onClick={() => setForm({ ...form, logo_url: '' })}>
                    إزالة
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div>
              <Label className="text-sm">تفعيل الشركة</Label>
              <p className="text-xs text-muted-foreground">عند التعطيل لن تظهر للزوار</p>
            </div>
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
          <Button onClick={save} disabled={saving || uploading}>
            {saving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
            حفظ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}