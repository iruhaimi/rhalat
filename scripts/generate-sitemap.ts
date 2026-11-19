import { writeFileSync } from "fs";
import { resolve } from "path";

// Runs before `vite dev` and `vite build` via predev/prebuild npm scripts.
// Outputs public/sitemap.xml with indexable public routes and published content.

const BASE_URL = "https://visafaster.com";
const SUPABASE_URL = "https://hgxvwziiumjxifpgpjce.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhneHZ3emlpdW1qeGlmcGdwamNlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkzNzAxMDMsImV4cCI6MjA4NDk0NjEwM30.5RxkiSiAeAy6Q7VOFlVeXQHrm6CSNvIqV3yQZXh9Lng";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/destinations", changefreq: "weekly", priority: "0.9" },
  { path: "/apply", changefreq: "weekly", priority: "0.9" },
  { path: "/pricing", changefreq: "weekly", priority: "0.8" },
  { path: "/offers", changefreq: "daily", priority: "0.8" },
  { path: "/tourism", changefreq: "weekly", priority: "0.8" },
  { path: "/track", changefreq: "monthly", priority: "0.6" },
  { path: "/track-refund", changefreq: "monthly", priority: "0.5" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.7" },
  { path: "/blog", changefreq: "weekly", priority: "0.8" },
  { path: "/country/SCHENGEN", changefreq: "weekly", priority: "0.9" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/refund", changefreq: "yearly", priority: "0.3" },
  { path: "/delete-account", changefreq: "yearly", priority: "0.4" },
  { path: "/official-embassies", changefreq: "monthly", priority: "0.6" },
  { path: "/connect", changefreq: "monthly", priority: "0.3" },
  { path: "/ads-visa", changefreq: "monthly", priority: "0.5" },
];

async function fetchTable(table: string, select: string, filter = "is_active=eq.true"): Promise<any[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=${select}&${filter}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      },
    );
    if (!res.ok) {
      console.warn(`[sitemap] ${table} fetch failed: ${res.status}`);
      return [];
    }
    return await res.json();
  } catch (err) {
    console.warn(`[sitemap] ${table} fetch error:`, err);
    return [];
  }
}

function generateSitemap(items: SitemapEntry[]): string {
  const urls = items.map((e) =>
    [
      `  <url>`,
      `    <loc>${BASE_URL}${e.path}</loc>`,
      e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

async function main() {
  const all: SitemapEntry[] = [...staticEntries];

  const countries = await fetchTable("countries", "code,updated_at");
  for (const c of countries) {
    if (!c?.code) continue;
    all.push({
      path: `/country/${String(c.code).toUpperCase()}`,
      lastmod: c.updated_at ? String(c.updated_at).slice(0, 10) : undefined,
      changefreq: "weekly",
      priority: "0.8",
    });
    all.push({
      path: `/apply/${String(c.code).toUpperCase()}`,
      changefreq: "monthly",
      priority: "0.6",
    });
  }

  // Visa types are displayed on country pages; /visa/:id is not an app route.
  // Account and payment-result routes are not indexable and stay out of this file.
  const programs = await fetchTable("tour_programs", "id,updated_at", "status=eq.approved");
  for (const program of programs) {
    if (!program?.id) continue;
    all.push({
      path: `/tourism/${program.id}`,
      lastmod: program.updated_at ? String(program.updated_at).slice(0, 10) : undefined,
      changefreq: "monthly",
      priority: "0.7",
    });
  }

  const posts = await fetchTable("blog_posts", "slug,updated_at,published_at", "status=eq.published");
  for (const p of posts) {
    if (!p?.slug) continue;
    all.push({
      path: `/blog/${p.slug}`,
      lastmod: (p.updated_at || p.published_at) ? String(p.updated_at || p.published_at).slice(0, 10) : undefined,
      changefreq: "monthly",
      priority: "0.7",
    });
  }

  const unique = [...new Map(all.map(entry => [entry.path, entry])).values()];
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(unique));
  console.log(
    `sitemap.xml written (${unique.length} entries — ${staticEntries.length} static, ${countries.length} countries, ${programs.length} programs, ${posts.length} posts)`,
  );
}

main().catch((err) => {
  // Never fail the build — fall back to static-only sitemap.
  console.warn("[sitemap] generator error, writing static fallback:", err);
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(staticEntries));
});