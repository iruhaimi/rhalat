import { writeFileSync } from "fs";
import { resolve } from "path";

// Runs before `vite dev` and `vite build` via predev/prebuild npm scripts.
// Outputs public/sitemap.xml with static routes + dynamic country/visa pages.

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
  { path: "/country/SCHENGEN", changefreq: "weekly", priority: "0.9" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/refund", changefreq: "yearly", priority: "0.3" },
];

async function fetchTable(table: string, select: string): Promise<any[]> {
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=${select}&is_active=eq.true`,
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
  }

  const visas = await fetchTable("visa_types", "id,updated_at");
  for (const v of visas) {
    if (!v?.id) continue;
    all.push({
      path: `/visa/${v.id}`,
      lastmod: v.updated_at ? String(v.updated_at).slice(0, 10) : undefined,
      changefreq: "monthly",
      priority: "0.7",
    });
  }

  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(all));
  console.log(
    `sitemap.xml written (${all.length} entries — ${staticEntries.length} static, ${countries.length} countries, ${visas.length} visas)`,
  );
}

main().catch((err) => {
  // Never fail the build — fall back to static-only sitemap.
  console.warn("[sitemap] generator error, writing static fallback:", err);
  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(staticEntries));
});