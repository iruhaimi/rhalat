# Customer experience audit

# SEO corrections

- [x] Correct content labels and sitemap; add TravelAgency, AboutPage and CollectionPage metadata without exposing private account pages.
- [x] Verify phone/desktop public pages and 55 unique sitemap URLs; mark the content and sitemap findings fixed pending rescan.
- [x] Upgrade rendering so each public page sends its own title, description and share link from the server (approved upgrade).
- [ ] Share image: pages still have no own share picture except articles with a cover photo; hosting supplies the default preview image.
- [ ] Phone app builds: the Android/iOS packaging still expects the old single-page output and must be adjusted before the next store release.
- [ ] Structured-data finding remains partial: FAQ schema is not added as an SEO-only improvement, and no unverified business image or price range is invented.
- [ ] Tourism sitemap completeness remains unverified: the existing public data access returns 401; no permissions changed for this SEO task.

- [x] Review the public customer journey in the browser and inspect reported source issues.
- [x] Fix destination search, payment recovery links, tracking number continuity, missing-image fallbacks, and pricing inconsistencies with the existing fee policy.
- [x] Verify public search → destination → application entry, tracking prefill, recovery links, and homepage images; 11 pricing/delay tests pass.
- [ ] Verify authenticated application submission, payment, and tracking readback. Blocked: no usable customer test session; needs a customer account signed in through preview. No real payment or new application was submitted during this audit.

# Email update

- [x] Survey legacy senders and preserve existing content, permissions, SMS fallback, and operational notices.
- [x] Convert senders and outcome logging; replacement functions typecheck and four email outcome tests pass; remove legacy email files from the repository only.
- [x] Deploy the new email functions; deployed confirmation and event receivers reject unauthorized requests. Publication remains the user's choice; no actual recipient email was sent during verification.

# Google Ads landing page

- [x] Replace the legacy campaign page with the uploaded Arabic brief, dedicated WhatsApp, private-agency disclosure and existing legal/contact information; available at /ads-visa and /lp/visa.
- [x] Verify campaign links, click-only tracking, desktop/mobile layout and main homepage preservation; three campaign tests pass, no browser runtime errors, build OK.
- [ ] Activate dedicated Google Ads conversion reporting. Blocked: Ads ID AW-18502036693 is installed; the conversion label is still required.

# Campaign Tag Manager update

- [x] Add GTM-TVXFHMFW to the campaign head without replacing existing Ads or consent settings.
- [x] Verify campaign loading, consent choices and iOS exclusion; eight tests and browser acceptance/restoration checks pass.
- [x] Prepared verified changes for saving and publication; deployment completion must be confirmed separately.