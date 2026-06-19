Fix the hero badge separator in LandingVisa.tsx.

In the hero section of `src/pages/LandingVisa.tsx`, the badge text currently reads:
```
معتمدون · أكثر من 10,000 طلب ناجح
```
In RTL/Arabic rendering, the middle dot (U+00B7) displays as an Arabic zero (٠).

Replace the single inline span with an inline-flex container containing three children: left text, a pipe separator, right text. Use `|` as the separator character, which renders correctly in all font/RTL combinations.

### Files
- `src/pages/LandingVisa.tsx` (lines 103-105)

### After fix
```tsx
<span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
  <span>معتمدون</span>
  <span className="text-muted-foreground" aria-hidden="true">|</span>
  <span>أكثر من 10,000 طلب ناجح</span>
</span>
```