// Per-page head tags rendered on the server, so shared links show each page's own preview.
export const SITE_URL = "https://visafaster.com";

export interface PageHeadInput {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  image?: string | null;
}

export function pageHead({ title, description, path, type = "website", image }: PageHeadInput) {
  const url = `${SITE_URL}${path}`;
  const meta: Array<Record<string, string>> = [
    { title },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: type },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
  ];
  if (image) {
    meta.push({ property: "og:image", content: image }, { name: "twitter:image", content: image });
  }
  return { meta, links: [{ rel: "canonical", href: url }] };
}

/** Public, read-only lookup used only to build page previews; failures fall back to site defaults. */
export async function fetchPublicRows<T>(table: string, query: string): Promise<T[]> {
  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: {
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
    });
    if (!res.ok) return [];
    return (await res.json()) as T[];
  } catch {
    return [];
  }
}

export interface CountryPreview {
  title: string;
  description: string;
}

export const SCHENGEN_PREVIEW: CountryPreview = {
  title: "تأشيرة الشنغن للسعوديين والمقيمين — الشروط والأسعار | عطلات رحلاتكم",
  description: "استخرج تأشيرة شنغن واحدة تتيح لك دخول 27 دولة أوروبية. متطلبات واضحة، أسعار منافسة، ومعالجة سريعة من السعودية.",
};

/** Same wording the country page uses for its own title and description. */
export function countryPreviewText(
  country: { name: string; seo_title?: string | null; seo_description?: string | null },
  visaTypes: Array<{ price: number; processing_days: number }>,
): CountryPreview {
  const minPrice = visaTypes.length ? Math.min(...visaTypes.map((v) => v.price)) : null;
  const minDays = visaTypes.length ? Math.min(...visaTypes.map((v) => v.processing_days)) : null;
  return {
    title: country.seo_title || `تأشيرة ${country.name} — الشروط والأسعار | عطلات رحلاتكم`,
    description:
      country.seo_description ||
      `استخرج تأشيرة ${country.name} بسهولة من السعودية: ${visaTypes.length} نوع تأشيرة${minPrice ? `، تبدأ من ${minPrice} ر.س` : ""}${minDays ? `، معالجة خلال ${minDays} أيام` : ""}. متطلبات واضحة ودعم متواصل.`,
  };
}
