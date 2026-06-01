import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/seo/SEO";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Calendar, ArrowLeft } from "lucide-react";

interface Post {
  id: string;
  slug: string;
  title_ar: string;
  excerpt_ar: string | null;
  cover_image_url: string | null;
  published_at: string | null;
  tags: string[];
  category_id: string | null;
}
interface Category {
  id: string;
  slug: string;
  name_ar: string;
}

export default function Blog() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: c }, { data: p }] = await Promise.all([
        supabase.from("blog_categories").select("id,slug,name_ar").eq("is_active", true).order("display_order"),
        supabase
          .from("blog_posts")
          .select("id,slug,title_ar,excerpt_ar,cover_image_url,published_at,tags,category_id")
          .eq("status", "published")
          .order("published_at", { ascending: false }),
      ]);
      setCategories(c || []);
      setPosts(p || []);
      setLoading(false);
    })();
  }, []);

  const filtered = posts.filter((p) => {
    if (activeCat && p.category_id !== activeCat) return false;
    if (q && !p.title_ar.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: filtered.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://visafaster.com/blog/${p.slug}`,
      name: p.title_ar,
    })),
  };

  return (
    <div className="container mx-auto px-4 py-12" dir="rtl">
      <SEO
        title="مدونة عطلات رحلاتكم — نصائح ومعلومات التأشيرات"
        description="مقالات وأدلة مفصلة عن تأشيرات الشنغن وبريطانيا وأمريكا، نصائح المقابلات، والمستندات المطلوبة للسفر من السعودية."
        path="/blog"
        jsonLd={jsonLd}
      />
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-3">مدونة عطلات رحلاتكم</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          أدلة ونصائح من خبراء التأشيرات لمساعدتك في الحصول على فيزا السفر بثقة.
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-8 max-w-4xl mx-auto">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ابحث في المقالات..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={activeCat === null ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveCat(null)}
          >
            الكل
          </Button>
          {categories.map((c) => (
            <Button
              key={c.id}
              variant={activeCat === c.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCat(c.id)}
            >
              {c.name_ar}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="text-center text-muted-foreground py-12">جاري التحميل...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">لا توجد مقالات.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link key={p.id} to={`/blog/${p.slug}`}>
              <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow">
                {p.cover_image_url && (
                  <div className="aspect-video bg-muted overflow-hidden">
                    <img
                      src={p.cover_image_url}
                      alt={p.title_ar}
                      loading="lazy"
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <div className="p-5">
                  <h2 className="font-bold text-lg mb-2 line-clamp-2">{p.title_ar}</h2>
                  {p.excerpt_ar && (
                    <p className="text-sm text-muted-foreground line-clamp-3 mb-3">{p.excerpt_ar}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    {p.published_at && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(p.published_at).toLocaleDateString("ar-SA")}
                      </span>
                    )}
                    <span className="flex items-center gap-1 text-primary">
                      اقرأ <ArrowLeft className="h-3 w-3" />
                    </span>
                  </div>
                  {p.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {p.tags.slice(0, 3).map((t) => (
                        <Badge key={t} variant="secondary" className="text-xs">
                          {t}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}