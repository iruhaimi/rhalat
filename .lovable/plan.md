## Plan: Update Tourism License Text in Footer

### Goal
Update the tourism ministry license card text in the Arabic footer from "مرخّصون من وزارة السياحة" to "مرخصون من وزارة السياحة والتجارة".

### Change
**File:** `src/components/layout/FooterArabic.tsx`

- Remove the diacritic from "مرخّصون" → "مرخصون"
- Append "والتجارة" to the ministry name

### Why
The company is licensed by both the Ministry of Tourism and the Ministry of Commerce, so the footer should accurately reflect both ministries.

---

### Technical Details
- Single-line text change in the license card component
- No database or backend changes required
- No new dependencies
- No impact on other components or functionality