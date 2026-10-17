# Customer experience audit

- [x] Review the public customer journey in the browser and inspect reported source issues.
- [x] Fix destination search, payment recovery links, tracking number continuity, missing-image fallbacks, and pricing inconsistencies with the existing fee policy.
- [x] Verify public search → destination → application entry, tracking prefill, recovery links, and homepage images; 11 pricing/delay tests pass.
- [ ] Verify authenticated application submission, payment, and tracking readback. Blocked: no usable customer test session; needs a customer account signed in through preview. No real payment or new application was submitted during this audit.

# Email update

- [x] Survey legacy senders and preserve existing content, permissions, SMS fallback, and operational notices.
- [ ] Convert senders and outcome logging, verify replacements, and remove legacy email files from the repository only.
- [ ] Deploy and verify the new email functions; leave publication to the user.