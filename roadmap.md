# Customer experience audit

- [x] Review the public customer journey in the browser and inspect reported source issues.
- [x] Fix destination search, payment recovery links, tracking number continuity, missing-image fallbacks, and pricing inconsistencies with the existing fee policy.
- [x] Verify public search → destination → application entry, tracking prefill, recovery links, and homepage images; 11 pricing/delay tests pass.
- [ ] Verify authenticated application submission, payment, and tracking readback. Blocked: no usable customer test session; needs a customer account signed in through preview. No real payment or new application was submitted during this audit.

# Email update

- [x] Survey legacy senders and preserve existing content, permissions, SMS fallback, and operational notices.
- [x] Convert senders and outcome logging; replacement functions typecheck and four email outcome tests pass; remove legacy email files from the repository only.
- [x] Deploy the new email functions; deployed confirmation and event receivers reject unauthorized requests. Publication remains the user's choice; no actual recipient email was sent during verification.