# Architecture rules

- Keep application delay calculations in the pure `src/lib/applicationOverdue.ts` helper, with tests covering timing and terminal outcomes, so list rendering and business rules remain separate.