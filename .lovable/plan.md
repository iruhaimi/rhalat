## Problem

In the navy "happy travelers" tile of the hero, the small circle row shows what looks like ".ok+" instead of "+10k", and the three other circles look like empty/broken avatars.

Causes:
1. The `+10k` text is inside an RTL container, so bidi reordering flips it visually.
2. The 3 placeholder circles (`bg-cream`, `bg-cream/70`, `bg-cream/50`) have no content — they look like missing avatar images.

## Fix (in `src/components/home/HeroSection.tsx`, lines ~160-170)

1. Force LTR on the `+10k` badge so it always reads correctly:
   - Add `dir="ltr"` and a `tabular-nums` class to the first circle div.
2. Replace the 3 empty cream circles with real-looking customer avatars:
   - Use initials (Arabic letters like م، س، أ) styled with a gradient background and white text — matching the existing testimonials avatar pattern (`TestimonialsSection.tsx` already uses single-letter avatars).
   - Keeps the visual "stack of travelers" intent without looking broken.

No backend, no new assets, no layout changes outside that small badge row.
