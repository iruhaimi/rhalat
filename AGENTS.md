# Architecture rules

- Keep application delay calculations in the pure `src/lib/applicationOverdue.ts` helper, with tests covering timing and terminal outcomes, so list rendering and business rules remain separate.
- Calculate application totals through the pure `src/lib/applicationPricing.ts` helper so new selections and restored drafts use the same fee rules.
- Send feature emails from their own authenticated Edge Functions through the managed email helpers; preserve the existing email tables as observational logs only, so delivery and suppression authority stay with Lovable.