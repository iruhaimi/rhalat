---
description: "Brand assets shipped by the visa-faster design system (logos, icons, illustrations, photography, fonts, videos) with exact import paths. Read before adding any logo, icon, illustration, image, video, or font to the app: use these real assets instead of placeholders, stock photos, or generated images."
---

# visa-faster — Assets

These files are copied into `src/design-system/{slug}/assets/` in this project — never generate, placeholder, or substitute an asset that exists here.

Raw files import directly, e.g. `import logo from "@/design-system/{slug}/assets/logos/logo.svg"`.
R2 pointer files (`.asset.json`) are imported as JSON — use the `url` property, e.g. `import hero from "@/design-system/{slug}/assets/hero.png.asset.json"` then `<img src={hero.url} />`.
The full machine-readable catalog lives in this library's `design-system.json` (`assets` array).

## Logos

- `@/design-system/{slug}/assets/logo.png.asset.json` (png, R2 pointer)

## Images

- `@/design-system/{slug}/assets/ads/ad-landscape-passport.jpg` (jpg)
- `@/design-system/{slug}/assets/ads/ad-landscape-schengen.jpg` (jpg)
- `@/design-system/{slug}/assets/ads/ad-landscape-team.jpg` (jpg)
- `@/design-system/{slug}/assets/ads/ad-landscape-uk.jpg` (jpg)
- `@/design-system/{slug}/assets/ads/ad-square-passport.jpg` (jpg)
- `@/design-system/{slug}/assets/ads/ad-square-schengen.jpg` (jpg)
- `@/design-system/{slug}/assets/ads/ad-square-team.jpg` (jpg)
- `@/design-system/{slug}/assets/ads/ad-square-uk.jpg` (jpg)
- `@/design-system/{slug}/assets/ads/campaign-paris.jpg` (jpg)
- `@/design-system/{slug}/assets/ads/landmark-bigben.jpg` (jpg)
- `@/design-system/{slug}/assets/ads/landmark-eiffel.jpg` (jpg)
- `@/design-system/{slug}/assets/ads/landmark-liberty.jpg` (jpg)
- `@/design-system/{slug}/assets/destination-dubai.jpg` (jpg)
- `@/design-system/{slug}/assets/destination-istanbul.jpg` (jpg)
- `@/design-system/{slug}/assets/destination-london.jpg` (jpg)
- `@/design-system/{slug}/assets/destination-paris.jpg` (jpg)
- `@/design-system/{slug}/assets/hero-bg.jpg` (jpg)
- `@/design-system/{slug}/assets/sar-symbol.svg` (svg)

