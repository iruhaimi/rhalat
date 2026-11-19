import { createFileRoute } from "@tanstack/react-router";
import { fetchPublicRows, pageHead } from "@/lib/routeHead";
import BlogPost from "@/pages/BlogPost";

interface PostPreviewRow {
  slug: string;
  title_ar: string;
  excerpt_ar: string | null;
  seo_title: string | null;
  seo_description: string | null;
  cover_image_url: string | null;
}

export const Route = createFileRoute("/_main/blog/$slug")({
  loader: async ({ params }) => {
    const [post] = await fetchPublicRows<PostPreviewRow>(
      "blog_posts",
      `select=slug,title_ar,excerpt_ar,seo_title,seo_description,cover_image_url&slug=eq.${encodeURIComponent(params.slug)}&status=eq.published&limit=1`,
    );
    return post ?? null;
  },
  head: ({ loaderData }) =>
    loaderData
      ? pageHead({
          title: loaderData.seo_title || loaderData.title_ar,
          description: loaderData.seo_description || loaderData.excerpt_ar || loaderData.title_ar,
          path: `/blog/${loaderData.slug}`,
          type: "article",
          image: loaderData.cover_image_url?.startsWith("https://") ? loaderData.cover_image_url : null,
        })
      : {},
  component: BlogPost,
});
