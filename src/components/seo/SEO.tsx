import { Helmet } from "react-helmet-async";

/**
 * Structured data only. Page titles, descriptions, canonical links and share
 * previews come from each route's head() so the server sends them with the page.
 */
interface SEOProps {
  title: string;
  description: string;
  path: string;
  type?: "website" | "article";
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

export default function SEO({ jsonLd }: SEOProps) {
  const ldArray = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
  if (ldArray.length === 0) return null;
  return (
    <Helmet>
      {ldArray.map((data, i) => (
        <script key={i} type="application/ld+json">{JSON.stringify(data)}</script>
      ))}
    </Helmet>
  );
}
