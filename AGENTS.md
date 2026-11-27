# Architecture rules

- Keep application delay calculations in the pure `src/lib/applicationOverdue.ts` helper, with tests covering timing and terminal outcomes, so list rendering and business rules remain separate.
- Calculate application totals through the pure `src/lib/applicationPricing.ts` helper so new selections and restored drafts use the same fee rules.
- Keep the campaign landing outside MainLayout and its contacts in a campaign-only config; track explicit WhatsApp clicks, never page visits, to isolate advertising from the public customer journey.
- Initialize Tag Manager in the document head after consent defaults, site-wide but outside the iOS wrapper, to preserve consent ordering and native tracking restrictions.
- Send feature emails from their own authenticated Edge Functions through the managed email helpers; preserve the existing email tables as observational logs only, so delivery and suppression authority stay with Lovable.
- Exempt only exact preview-tooling development dependency keys in the native build guard; keep scanning dependency values and runtime references to prevent redirect protection from being weakened.
- Keep the existing sitemap generator limited to real indexable routes and published public content; derive lastmod only from page-specific content timestamps and exclude account/payment-result pages.
- Run the site on TanStack Start with file routes in `src/routes/`; keep page components in `src/pages/` reached through the `@/lib/router-compat` shim, so existing navigation calls keep working without a typed-router rewrite.
- Give every public page its title, description, canonical link and share tags through its route `head()` using `src/lib/routeHead.ts`; the `SEO` component emits structured data only, so server-rendered previews never carry duplicate tags.
- Keep inline document-head scripts in `src/lib/headScripts.ts` in consent-first order and cover them with tests, so tracking order stays verifiable without a static HTML file.
- Keep `strict` on but leave `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` and `noPropertyAccessFromIndexSignature` off; existing database-shaped code was not written for them and their errors were noise, not bugs.
- Create live-update channels with `uniqueChannelName()`; reusing a channel name across mounted listeners throws and blanks signed-in pages.
- Read browser-only values (`window`, storage) inside effects or event handlers, never during render, because pages are now rendered on the server first.
- Keep per-market campaign landing copy in `src/config/marketLandings.ts` rendered by one shared page at direct canonical paths (`/usa`, `/schengen`, `/uk`, `/canada`, `/brazil`, `/japan`), with permanent `/lp/*` redirects and a test that no sentence repeats across markets and no guarantee/government claims appear, so ad pages stay unique and policy-safe.
