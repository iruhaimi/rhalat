import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Loader2, Save, Plus, Trash2, Globe, FileText } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type Country = any;
type VisaType = any;

function parseJsonField(value: any, fallback: any) {
  if (value == null) return fallback;
  if (typeof value === 'string') {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value;
}

function CountrySEOEditor({ country, onSaved }: { country: Country; onSaved: () => void }) {
  const [seoTitle, setSeoTitle] = useState(country.seo_title || '');
  const [seoDescription, setSeoDescription] = useState(country.seo_description || '');
  const [longDescription, setLongDescription] = useState(country.long_description || '');
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>(
    parseJsonField(country.faqs, [])
  );
  const [steps, setSteps] = useState<Array<{ title: string; description: string }>>(
    parseJsonField(country.processing_steps, [])
  );
  const [tips, setTips] = useState<string[]>(
    (parseJsonField(country.tips, []) as any[]).map((t: any) => typeof t === 'string' ? t : (t.title || ''))
  );
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('countries')
      .update({
        seo_title: seoTitle || null,
        seo_description: seoDescription || null,
        long_description: longDescription || null,
        faqs: faqs.filter(f => f.question && f.answer),
        processing_steps: steps.filter(s => s.title),
        tips: tips.filter(Boolean),
      } as any)
      .eq('id', country.id);
    setSaving(false);
    if (error) {
      toast({ title: 'فشل الحفظ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'تم الحفظ', description: `تم تحديث محتوى SEO لـ ${country.name}` });
      onSaved();
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label>SEO Title (≤ 60 حرف)</Label>
        <Input value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} maxLength={70} placeholder={`تأشيرة ${country.name} — الشروط والأسعار`} />
        <p className="text-xs text-muted-foreground">{seoTitle.length} / 70</p>
      </div>
      <div className="grid gap-2">
        <Label>SEO Description (≤ 160 حرف)</Label>
        <Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} maxLength={170} rows={2} placeholder="وصف موجز يظهر في نتائج البحث" />
        <p className="text-xs text-muted-foreground">{seoDescription.length} / 170</p>
      </div>
      <div className="grid gap-2">
        <Label>وصف مطوّل عن الدولة</Label>
        <Textarea value={longDescription} onChange={(e) => setLongDescription(e.target.value)} rows={6} placeholder="نص غني يظهر في صفحة الدولة (يُسمح بفقرات متعددة)" />
      </div>

      {/* Steps */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label>خطوات التقديم</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => setSteps([...steps, { title: '', description: '' }])}>
            <Plus className="h-4 w-4 mr-1" /> إضافة خطوة
          </Button>
        </div>
        {steps.map((s, i) => (
          <div key={i} className="border rounded p-2 space-y-2">
            <div className="flex gap-2">
              <Input placeholder="عنوان الخطوة" value={s.title} onChange={(e) => {
                const next = [...steps]; next[i] = { ...next[i], title: e.target.value }; setSteps(next);
              }} />
              <Button type="button" variant="ghost" size="icon" onClick={() => setSteps(steps.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Textarea placeholder="الوصف" value={s.description} rows={2} onChange={(e) => {
              const next = [...steps]; next[i] = { ...next[i], description: e.target.value }; setSteps(next);
            }} />
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label>نصائح</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => setTips([...tips, ''])}>
            <Plus className="h-4 w-4 mr-1" /> إضافة نصيحة
          </Button>
        </div>
        {tips.map((t, i) => (
          <div key={i} className="flex gap-2">
            <Input value={t} onChange={(e) => { const next = [...tips]; next[i] = e.target.value; setTips(next); }} />
            <Button type="button" variant="ghost" size="icon" onClick={() => setTips(tips.filter((_, j) => j !== i))}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* FAQs */}
      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label>الأسئلة الشائعة (FAQ)</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => setFaqs([...faqs, { question: '', answer: '' }])}>
            <Plus className="h-4 w-4 mr-1" /> إضافة سؤال
          </Button>
        </div>
        {faqs.map((f, i) => (
          <div key={i} className="border rounded p-2 space-y-2">
            <div className="flex gap-2">
              <Input placeholder="السؤال" value={f.question} onChange={(e) => {
                const next = [...faqs]; next[i] = { ...next[i], question: e.target.value }; setFaqs(next);
              }} />
              <Button type="button" variant="ghost" size="icon" onClick={() => setFaqs(faqs.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Textarea placeholder="الإجابة" value={f.answer} rows={3} onChange={(e) => {
              const next = [...faqs]; next[i] = { ...next[i], answer: e.target.value }; setFaqs(next);
            }} />
          </div>
        ))}
      </div>

      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        حفظ التغييرات
      </Button>
    </div>
  );
}

function VisaSEOEditor({ visa, onSaved }: { visa: VisaType; onSaved: () => void }) {
  const [seoDescription, setSeoDescription] = useState(visa.seo_description || '');
  const reqInit = parseJsonField(visa.requirements_detailed, {});
  const [citizen, setCitizen] = useState<string[]>(reqInit.citizen || []);
  const [resident, setResident] = useState<string[]>(reqInit.resident || []);
  const [rejections, setRejections] = useState<string[]>(parseJsonField(visa.common_rejection_reasons, []));
  const [timeline, setTimeline] = useState<Array<{ stage: string; days: string; description: string }>>(parseJsonField(visa.processing_timeline, []));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('visa_types')
      .update({
        seo_description: seoDescription || null,
        requirements_detailed: {
          citizen: citizen.filter(Boolean),
          resident: resident.filter(Boolean),
        },
        common_rejection_reasons: rejections.filter(Boolean),
        processing_timeline: timeline.filter(t => t.stage),
      } as any)
      .eq('id', visa.id);
    setSaving(false);
    if (error) {
      toast({ title: 'فشل الحفظ', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'تم الحفظ' });
      onSaved();
    }
  };

  const ListEditor = ({ label, items, setItems }: { label: string; items: string[]; setItems: (v: string[]) => void }) => (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, ''])}>
          <Plus className="h-4 w-4 mr-1" /> إضافة
        </Button>
      </div>
      {items.map((it, i) => (
        <div key={i} className="flex gap-2">
          <Input value={it} onChange={(e) => { const next = [...items]; next[i] = e.target.value; setItems(next); }} />
          <Button type="button" variant="ghost" size="icon" onClick={() => setItems(items.filter((_, j) => j !== i))}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <Label>SEO Description (≤ 170 حرف)</Label>
        <Textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} maxLength={170} rows={2} />
        <p className="text-xs text-muted-foreground">{seoDescription.length} / 170</p>
      </div>
      <ListEditor label="شروط للمواطن السعودي" items={citizen} setItems={setCitizen} />
      <ListEditor label="شروط للمقيم في السعودية" items={resident} setItems={setResident} />
      <ListEditor label="أسباب الرفض الشائعة" items={rejections} setItems={setRejections} />

      <div className="grid gap-2">
        <div className="flex items-center justify-between">
          <Label>الجدول الزمني للمعالجة</Label>
          <Button type="button" variant="outline" size="sm" onClick={() => setTimeline([...timeline, { stage: '', days: '', description: '' }])}>
            <Plus className="h-4 w-4 mr-1" /> إضافة مرحلة
          </Button>
        </div>
        {timeline.map((t, i) => (
          <div key={i} className="border rounded p-2 space-y-2">
            <div className="flex gap-2">
              <Input placeholder="المرحلة" value={t.stage} onChange={(e) => { const next = [...timeline]; next[i] = { ...next[i], stage: e.target.value }; setTimeline(next); }} />
              <Input placeholder="المدة (مثل: 3-5 أيام)" value={t.days} onChange={(e) => { const next = [...timeline]; next[i] = { ...next[i], days: e.target.value }; setTimeline(next); }} />
              <Button type="button" variant="ghost" size="icon" onClick={() => setTimeline(timeline.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Textarea placeholder="وصف اختياري" value={t.description} rows={2} onChange={(e) => { const next = [...timeline]; next[i] = { ...next[i], description: e.target.value }; setTimeline(next); }} />
          </div>
        ))}
      </div>

      <Button onClick={save} disabled={saving} className="w-full">
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        حفظ التغييرات
      </Button>
    </div>
  );
}

export default function SEOContentManagement() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [visas, setVisas] = useState<VisaType[]>([]);
  const [selectedCountryId, setSelectedCountryId] = useState<string>('');
  const [selectedVisaId, setSelectedVisaId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: v }] = await Promise.all([
      supabase.from('countries').select('*').order('name'),
      supabase.from('visa_types').select('*, country:countries(name, code)').order('name'),
    ]);
    setCountries(c || []);
    setVisas(v || []);
    if (c?.length && !selectedCountryId) setSelectedCountryId(c[0].id);
    if (v?.length && !selectedVisaId) setSelectedVisaId(v[0].id);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const selectedCountry = countries.find(c => c.id === selectedCountryId);
  const selectedVisa = visas.find(v => v.id === selectedVisaId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" />
          إدارة محتوى SEO
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          حرّر عناوين وأوصاف SEO، النصائح، خطوات التقديم، والأسئلة الشائعة لكل دولة وتأشيرة دون كتابة كود.
        </p>
      </div>

      {loading ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Tabs defaultValue="countries" className="w-full">
          <TabsList>
            <TabsTrigger value="countries"><Globe className="h-4 w-4 mr-1" /> الدول ({countries.length})</TabsTrigger>
            <TabsTrigger value="visas"><FileText className="h-4 w-4 mr-1" /> التأشيرات ({visas.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="countries">
            <Card>
              <CardHeader>
                <CardTitle>اختر الدولة</CardTitle>
                <CardDescription>اختر دولة لتحرير محتوى SEO الخاص بها</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedCountryId} onValueChange={setSelectedCountryId}>
                  <SelectTrigger><SelectValue placeholder="اختر دولة" /></SelectTrigger>
                  <SelectContent>
                    {countries.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedCountry && (
                  <CountrySEOEditor key={selectedCountry.id} country={selectedCountry} onSaved={load} />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="visas">
            <Card>
              <CardHeader>
                <CardTitle>اختر التأشيرة</CardTitle>
                <CardDescription>اختر تأشيرة لتحرير محتوى SEO المفصّل</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Select value={selectedVisaId} onValueChange={setSelectedVisaId}>
                  <SelectTrigger><SelectValue placeholder="اختر تأشيرة" /></SelectTrigger>
                  <SelectContent>
                    {visas.map(v => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.country?.name ? `${v.country.name} — ` : ''}{v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedVisa && (
                  <VisaSEOEditor key={selectedVisa.id} visa={selectedVisa} onSaved={load} />
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}