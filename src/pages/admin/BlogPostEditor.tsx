import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MDEditor from "@uiw/react-md-editor";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowRight, Upload } from "lucide-react";

interface Category { id: string; name_ar: string; }

const empty = {
  slug: "",
  title_ar: "",
  excerpt_ar: "",
  content_ar: "",
  cover_image_url: "",
  category_id: "",
  tags: "",
  seo_title: "",
  seo_description: "",
  status: "draft" as "draft" | "published",
};

export default function BlogPostEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = !id;
  const [form, setForm] = useState({ ...empty });
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: c } = await supabase
        .from("blog_categories")
        .select("id,name_ar")
        .order("display_order");
      setCategories(c || []);
      if (!isNew && id) {
        const { data } = await supabase.from("blog_posts").select("*").eq("id", id).maybeSingle();
        if (data) {
          setForm({
            slug: data.slug,
            title_ar: data.title_ar,
            excerpt_ar: data.excerpt_ar || "",
            content_ar: data.content_ar || "",
            cover_image_url: data.cover_image_url || "",
            category_id: data.category_id || "",
            tags: (data.tags || []).join(", "),
            seo_title: data.seo_title || "",
            seo_description: data.seo_description || "",
            status: (data.status as "draft" | "published") || "draft",
          });
        }
      }
    })();
  }, [id, isNew]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `covers/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("blog-images").upload(path, file);
    if (error) {
      toast.error("فشل الرفع: " + error.message);
    } else {
      const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
      setForm((f) => ({ ...f, cover_image_url: data.publicUrl }));
      toast.success("تم رفع الصورة");
    }
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.title_ar || !form.slug || !form.content_ar) {
      toast.error("العنوان والرابط والمحتوى مطلوبة");
      return;
    }
    setSaving(true);
    const payload = {
      slug: form.slug.trim(),
      title_ar: form.title_ar.trim(),
      excerpt_ar: form.excerpt_ar || null,
      content_ar: form.content_ar,
      cover_image_url: form.cover_image_url || null,
      category_id: form.category_id || null,
      tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      status: form.status,
      published_at: form.status === "published" ? new Date().toISOString() : null,
    };
    const { error } = isNew
      ? await supabase.from("blog_posts").insert(payload)
      : await supabase.from("blog_posts").update(payload).eq("id", id!);
    setSaving(false);
    if (error) toast.error("فشل الحفظ: " + error.message);
    else { toast.success("تم الحفظ"); navigate("/admin/blog"); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <Button variant="ghost" onClick={() => navigate("/admin/blog")} className="mb-4">
        <ArrowRight className="h-4 w-4 ml-2" /> العودة
      </Button>
      <h1 className="text-2xl font-bold mb-6">{isNew ? "مقال جديد" : "تعديل المقال"}</h1>

      <Card className="p-6 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>العنوان (عربي) *</Label>
            <Input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} />
          </div>
          <div>
            <Label>الرابط (slug) *</Label>
            <Input
              value={form.slug}
              onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
              placeholder="my-post-title"
            />
          </div>
        </div>

        <div>
          <Label>المقتطف</Label>
          <Textarea value={form.excerpt_ar} onChange={(e) => setForm({ ...form, excerpt_ar: e.target.value })} rows={2} />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>الفئة</Label>
            <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
              <SelectTrigger><SelectValue placeholder="اختر فئة" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name_ar}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>الحالة</Label>
            <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">مسودة</SelectItem>
                <SelectItem value="published">منشور</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>الوسوم (مفصولة بفاصلة)</Label>
          <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="شنغن, نصائح" />
        </div>

        <div>
          <Label>صورة الغلاف</Label>
          <div className="flex gap-2 items-center">
            <Input
              value={form.cover_image_url}
              onChange={(e) => setForm({ ...form, cover_image_url: e.target.value })}
              placeholder="https://..."
              className="flex-1"
            />
            <Button asChild variant="outline" disabled={uploading}>
              <label className="cursor-pointer">
                <Upload className="h-4 w-4 ml-1" />
                {uploading ? "..." : "رفع"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                />
              </label>
            </Button>
          </div>
          {form.cover_image_url && (
            <img src={form.cover_image_url} alt="" className="mt-2 max-h-48 rounded" />
          )}
        </div>

        <div>
          <Label>المحتوى (Markdown) *</Label>
          <div data-color-mode="light">
            <MDEditor
              value={form.content_ar}
              onChange={(v) => setForm({ ...form, content_ar: v || "" })}
              height={400}
              textareaProps={{ dir: "rtl" }}
            />
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-semibold mb-3">حقول SEO</h3>
          <div className="space-y-3">
            <div>
              <Label>عنوان SEO (≤60 حرف)</Label>
              <Input value={form.seo_title} onChange={(e) => setForm({ ...form, seo_title: e.target.value })} maxLength={60} />
            </div>
            <div>
              <Label>وصف SEO (≤160 حرف)</Label>
              <Textarea value={form.seo_description} onChange={(e) => setForm({ ...form, seo_description: e.target.value })} maxLength={160} rows={2} />
            </div>
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-4 border-t">
          <Button variant="outline" onClick={() => navigate("/admin/blog")}>إلغاء</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ"}</Button>
        </div>
      </Card>
    </div>
  );
}