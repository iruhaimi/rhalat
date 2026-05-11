import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, Save, ShieldCheck, ShieldAlert, Upload } from 'lucide-react';

export default function TourismCompanyProfile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [op, setOp] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('tour_operators').select('*').maybeSingle();
      if (error) toast.error('تعذر تحميل بيانات الشركة');
      setOp(data);
      setLoading(false);
    })();
  }, []);

  const update = (field: string, value: any) => setOp((prev: any) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!op) return;
    setSaving(true);
    const { error } = await supabase
      .from('tour_operators')
      .update({
        company_name: op.company_name,
        company_name_en: op.company_name_en,
        description: op.description,
        description_en: op.description_en,
        logo_url: op.logo_url,
        cover_image_url: op.cover_image_url,
        whatsapp_number: op.whatsapp_number,
        phone: op.phone,
        email: op.email,
        website: op.website,
        address: op.address,
        city: op.city,
        country: op.country,
      })
      .eq('id', op.id);
    if (error) toast.error('فشل حفظ البيانات');
    else toast.success('تم حفظ البيانات بنجاح');
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${user.id}/tour-operators/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (error) {
      toast.error('فشل رفع الشعار');
    } else {
      const { data } = supabase.storage.from('avatars').getPublicUrl(path);
      update('logo_url', data.publicUrl);
      toast.success('تم رفع الشعار');
    }
    setUploading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!op) {
    return <p className="text-center text-muted-foreground">لم يتم العثور على ملف شركتك. تواصل مع الإدارة.</p>;
  }

  return (
    <div className="space-y-6 max-w-3xl" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ملف الشركة</h1>
          <p className="text-muted-foreground mt-1">حدّث بيانات شركتك التي ستظهر للعملاء</p>
        </div>
        {op.is_verified ? (
          <Badge className="bg-emerald-600 gap-1">
            <ShieldCheck className="h-3 w-3" /> معتمد
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1 border-amber-400 text-amber-700">
            <ShieldAlert className="h-3 w-3" /> بانتظار الاعتماد
          </Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>الشعار والصور</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            {op.logo_url && (
              <img src={op.logo_url} alt="logo" className="h-20 w-20 rounded-lg object-cover border" />
            )}
            <Label className="cursor-pointer">
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <span className="inline-flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-muted">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                رفع الشعار
              </span>
            </Label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>بيانات الشركة</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="اسم الشركة (عربي)" value={op.company_name} onChange={(v) => update('company_name', v)} />
          <Field label="اسم الشركة (إنجليزي)" value={op.company_name_en} onChange={(v) => update('company_name_en', v)} />
          <div className="md:col-span-2">
            <Label>الوصف</Label>
            <Textarea rows={4} value={op.description ?? ''} onChange={(e) => update('description', e.target.value)} />
          </div>
          <Field label="رقم الواتساب" value={op.whatsapp_number} onChange={(v) => update('whatsapp_number', v)} />
          <Field label="رقم الهاتف" value={op.phone} onChange={(v) => update('phone', v)} />
          <Field label="البريد الإلكتروني" value={op.email} onChange={(v) => update('email', v)} />
          <Field label="الموقع الإلكتروني" value={op.website} onChange={(v) => update('website', v)} />
          <Field label="المدينة" value={op.city} onChange={(v) => update('city', v)} />
          <Field label="الدولة" value={op.country} onChange={(v) => update('country', v)} />
          <div className="md:col-span-2">
            <Label>العنوان</Label>
            <Textarea rows={2} value={op.address ?? ''} onChange={(e) => update('address', e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <Save className="h-4 w-4 ml-2" />}
          حفظ التغييرات
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <Label>{label}</Label>
      <Input value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}