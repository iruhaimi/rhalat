import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/seo/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, ArrowLeft, ArrowRight } from "lucide-react";

interface Post {
  id: string;
  slug: string;
  title_ar: string;
  excerpt_ar: string | null;
  content_ar: string;
  cover_image_url: string | null;
  published_at: string | null;
  tags: string[];
  category_id: string | null;
  seo_title: string | null;
  seo_description: string | null;
  author_name: string | null;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [related, setRelated] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .maybeSingle();
      if (error || !data) {
        setLoading(false);
        return;
      }
      setPost(data as Post);
      setLoading(false);
      supabase.rpc("increment_blog_post_views", { _slug: slug });

      if (data.category_id) {
        const { data: rel } = await supabase
          .from("blog_posts")
          .select("id,slug,title_ar,excerpt_ar,cover_image_url,published_at,tags,category_id,content_ar,seo_title,seo_description,author_name")
          .eq("status", "published")
          .eq("category_id", data.category_id)
          .neq("id", data.id)
          .limit(3);
        setRelated((rel || []) as Post[]);
      }
    })();
  }, [slug]);

  if (loading) {
    return <div className="container mx-auto py-20 text-center text-muted-foreground">جاري التحميل...</div>;
  }
  if (!post) {
    return (
      <div className="container mx-auto py-20 text-center">
        <p className="mb-4">المقال غير موجود.</p>
        <Button onClick={() => navigate("/blog")}>العودة للمدونة</Button>
      </div>
    );
  }

  const url = `https://visafaster.com/blog/${post.slug}`;
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: post.title_ar,
      description: post.seo_description || post.excerpt_ar || "",
      image: post.cover_image_url || undefined,
      datePublished: post.published_at,
      author: { "@type": "Organization", name: post.author_name || "عطلات رحلاتكم" },
      publisher: {
        "@type": "Organization",
        name: "عطلات رحلاتكم",
        url: "https://visafaster.com",
      },
      mainEntityOfPage: url,
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: "https://visafaster.com/" },
        { "@type": "ListItem", position: 2, name: "المدونة", item: "https://visafaster.com/blog" },
        { "@type": "ListItem", position: 3, name: post.title_ar, item: url },
      ],
    },
  ];

  return (
    <article className="container mx-auto px-4 py-10 max-w-4xl" dir="rtl">
      <SEO
        title={post.seo_title || post.title_ar}
        description={post.seo_description || post.excerpt_ar || post.title_ar}
        path={`/blog/${post.slug}`}
        type="article"
        jsonLd={jsonLd}
      />

      <nav className="text-sm text-muted-foreground mb-6">
        <Link to="/" className="hover:text-primary">الرئيسية</Link>
        {" / "}
        <Link to="/blog" className="hover:text-primary">المدونة</Link>
        {" / "}
        <span className="text-foreground">{post.title_ar}</span>
      </nav>

      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">{post.title_ar}</h1>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {post.published_at && (
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {new Date(post.published_at).toLocaleDateString("ar-SA")}
            </span>
          )}
        </div>
      </header>

      {post.cover_image_url && (
        <img
          src={post.cover_image_url}
          alt={post.title_ar}
          className="w-full rounded-lg mb-8 aspect-video object-cover"
        />
      )}

      <div className="prose prose-lg max-w-none prose-headings:font-bold prose-a:text-primary" dir="rtl">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content_ar}</ReactMarkdown>
      </div>

      {post.tags?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t">
          {post.tags.map((t) => (
            <Badge key={t} variant="secondary">{t}</Badge>
          ))}
        </div>
      )}

      <Card className="mt-10 p-6 bg-primary/5 border-primary/20">
        <h3 className="font-bold text-xl mb-2">جاهز للحصول على تأشيرتك؟</h3>
        <p className="text-muted-foreground mb-4">
          فريق عطلات رحلاتكم يساعدك في تجهيز ملف كامل ومراجعة شاملة قبل التقديم.
        </p>
        <Button asChild>
          <Link to="/apply">قدّم طلبك الآن</Link>
        </Button>
      </Card>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-6">مقالات ذات صلة</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {related.map((r) => (
              <Link key={r.id} to={`/blog/${r.slug}`}>
                <Card className="p-4 hover:shadow-md transition-shadow h-full">
                  <h3 className="font-semibold mb-2 line-clamp-2">{r.title_ar}</h3>
                  {r.excerpt_ar && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{r.excerpt_ar}</p>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 text-center">
        <Button variant="outline" asChild>
          <Link to="/blog">
            <ArrowRight className="h-4 w-4 ml-2" /> العودة لجميع المقالات
          </Link>
        </Button>
      </div>
    </article>
  );
}