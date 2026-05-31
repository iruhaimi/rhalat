import { Helmet } from "react-helmet-async";

/**
 * Marks the current route as non-indexable for search engines.
 * Use inside private/auth/admin/agent layouts to prevent crawling.
 */
export default function NoIndex() {
  return (
    <Helmet>
      <meta name="robots" content="noindex, nofollow" />
      <meta name="googlebot" content="noindex, nofollow" />
    </Helmet>
  );
}