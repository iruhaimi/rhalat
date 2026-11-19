import { createFileRoute } from "@tanstack/react-router";
import {
  SCHENGEN_PREVIEW,
  countryPreviewText,
  fetchPublicRows,
  pageHead,
  type CountryPreview,
} from "@/lib/routeHead";
import CountryDetail from "@/pages/CountryDetail";

interface CountryRow {
  id: string;
  name: string;
  seo_title: string | null;
  seo_description: string | null;
}

export const Route = createFileRoute("/_main/country/$countryCode")({
  loader: async ({ params }): Promise<CountryPreview | null> => {
    const code = params.countryCode.toUpperCase();
    if (code === "SCHENGEN") return SCHENGEN_PREVIEW;
    const [country] = await fetchPublicRows<CountryRow>(
      "countries",
      `select=id,name,seo_title,seo_description&code=eq.${encodeURIComponent(code)}&limit=1`,
    );
    if (!country) return null;
    const visaTypes = await fetchPublicRows<{ price: number; processing_days: number }>(
      "visa_types",
      `select=price,processing_days&country_id=eq.${country.id}&is_active=eq.true`,
    );
    return countryPreviewText(country, visaTypes);
  },
  head: ({ loaderData, params }) =>
    loaderData
      ? pageHead({ ...loaderData, path: `/country/${params.countryCode.toUpperCase()}` })
      : {},
  component: CountryDetail,
});
