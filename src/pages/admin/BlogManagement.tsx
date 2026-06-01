import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Eye } from "lucide-react";

interface Post {
  id: string;
  slug: string;
  title_ar: string;
  status: string;
  published_at: string | null;
  views_count: number;
  updated_at: string;
}

export default function BlogManagement() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("blog_posts")
      .select("id,slug,title_ar,status,published_at,views_count,updated_at")
      .order("updated_at", { ascending: false });
    setPosts((data as Post[]) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("هل تريد حذف هذا المقال؟")) return;
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) toast.error("فشل الحذف: " + error.message);
    else { toast.success("تم الحذف"); load(); }
  };

  const filtered = posts.filter((p) => !q || p.title_ar.includes(q));

  return (
    <div className="p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">إدارة المدونة</h1>
          <p className="text-sm text-muted-foreground">إنشاء وتعديل مقالات المدونة</p>
        </div>
        <Button asChild>
          <Link to="/admin/blog/new"><Plus className="h-4 w-4 ml-2" /> مقال جديد</Link>
        </Button>
      </div>

      <Input
        placeholder="بحث بالعنوان..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-4 max-w-md"
      />

      {loading ? (
        <p className="text-center text-muted-foreground py-10">جاري التحميل...</p>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-muted-foreground">لا توجد مقالات بعد.</Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <Card key={p.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{p.title_ar}</h3>
                  <Badge variant={p.status === "published" ? "default" : "secondary"}>
                    {p.status === "published" ? "منشور" : "مسودة"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  /{p.slug} • مشاهدات: {p.views_count}
                  {p.published_at && ` • نُشر: ${new Date(p.published_at).toLocaleDateString("ar-SA")}`}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {p.status === "published" && (
                  <Button size="sm" variant="ghost" asChild>
                    <a href={`/blog/${p.slug}`} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4" />
                    </a>
                  </Button>
                )}
                <Button size="sm" variant="outline" asChild>
                  <Link to={`/admin/blog/${p.id}/edit`}><Edit className="h-4 w-4" /></Link>
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}