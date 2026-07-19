# App Store Review Notes — عطلات رحلاتكم (visafaster)

Paste the section below into **App Store Connect → App Information → App Review → Notes** (English).

---

## Review Notes (copy into App Store Connect)

Hello App Review Team,

**About the app**
visafaster ("عطلات رحلاتكم") is an Arabic-first assisted-visa service for Saudi and GCC travelers. Users pick a destination (Schengen, UK, USA, etc.), submit required documents (passport scan, personal photo, financial statements), pay a service fee, and our licensed agents (Saudi Tourism Ministry license) process the visa application on their behalf with the relevant embassy.

**Business model & payments (Guideline 3.1.1)**
The app sells a **real-world government-related service** (embassy visa processing), not digital content, digital goods, subscriptions, or unlockable in-app functionality. Under Apple's guidelines this falls under the same category as Uber, Airbnb, and Booking.com and is **explicitly exempt from In-App Purchase**.

All payment flows open in the device's default browser (Safari) — no payment UI is shown inside the app. Payment methods available: Saudi Mada card, credit card (via Moyasar), and bank transfer (Al Rajhi Bank IBAN) with WhatsApp receipt submission. Bank transfer is a common, expected payment method in Saudi Arabia.

**Data collected (App Privacy)**
- Contact info (name, email, phone) — for account and application processing.
- Government IDs (passport scan, national ID) — required by the embassy; stored on Saudi-resident storage per PDPL law.
- No advertising SDKs are active on iOS. Google Ads/gtag is disabled at runtime inside the Despia wrapper (detected via user-agent). **We do not track users across apps or websites, so no ATT prompt is required.**
- Push notifications via OneSignal (for application status updates).

**Account deletion (Guideline 5.1.1(v))**
Users can permanently delete their account from **Profile → Delete My Account** (bottom of the profile page). This immediately removes personal data (name, phone, avatar) and revokes access. Anonymized transaction records are retained only for tax/legal compliance (Saudi VAT law).

**Demo account for review**
- URL (auto-loaded in app): https://visafaster.com
- Email: `applereview@visafaster.com`
- Password: `AppleReview2026!`
- This test account already has a sample visa application in progress so you can inspect the full flow (destinations → wizard → document upload → payment screen → tracking).

**Regarding Guideline 4.2 (Minimum Functionality)**
The app is not a generic web wrapper. It provides:
- Native push notifications (OneSignal) tied to real application status transitions.
- Native document/camera upload for passport and personal photo capture.
- Persistent authenticated session and multi-step application drafts.
- Deep-linked application tracking and Arabic RTL-first UX built specifically for mobile.
- Content and pricing dynamically served for authenticated users — not equivalent to visiting the marketing site.

**Regulatory compliance**
- Saudi Ministry of Tourism License: (see footer of app).
- Saudi PDPL (Personal Data Protection Law) compliant — data residency inside KSA.
- VAT registered.

**Contact**
- Support email: support@visafaster.com
- WhatsApp: +966 XX XXX XXXX
- Reviewer contact (fastest): [your phone / email]

Thank you for your review.

---

## Pre-submission checklist
- [ ] Create the demo account (`applereview@visafaster.com`) in production and seed it with a sample application.
- [ ] Fill in the WhatsApp/phone numbers above before pasting into App Store Connect.
- [ ] Confirm "Account Deletion" toggle in App Privacy = **Yes, users can delete their account**.
- [ ] Confirm "Data Used to Track You" = **None** (Google Ads is disabled in iOS build).
- [ ] Sign-In with Apple: only required if you offer any third-party social login on iOS. If Google login is enabled in the iOS build, **Sign in with Apple must also be enabled** (Guideline 4.8).