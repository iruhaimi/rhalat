# App Store Review Notes — عطلات رحلاتكم (visafaster)

Paste the section below into **App Store Connect → App Information → App Review → Notes** (English).

---

## Review Notes (copy into App Store Connect)

Hello App Review Team,

**About the app**
visafaster ("عطلات رحلاتكم") is an Arabic-first assisted-visa service for Saudi and GCC travelers. Users pick a destination (Schengen, UK, USA, etc.), submit required documents (passport scan, personal photo, financial statements), pay a service fee, and our licensed agents (Saudi Tourism Ministry license) process the visa application on their behalf with the relevant embassy.

**Business model & payments (Guideline 3.1.1)**
The app sells a **real-world government-related service** (embassy visa processing), not digital content, digital goods, subscriptions, or unlockable in-app functionality. Under Apple's guidelines this falls under the same category as Uber, Airbnb, and Booking.com and is **explicitly exempt from In-App Purchase**.

All payment flows open in the device's default browser (Safari) — no payment UI, no card-entry form, and no purchase button is shown inside the app itself. Payment methods available: Saudi Mada card, credit card (via Moyasar hosted checkout), and bank transfer (Al Rajhi Bank IBAN) with WhatsApp receipt submission. Bank transfer is a common, expected payment method in Saudi Arabia and is offered nowhere as a digital good.

**Data collected (App Privacy)**
- Contact info (name, email, phone) — for account and application processing.
- Government IDs (passport scan, national ID) — required by the embassy; stored on Saudi-resident storage per PDPL law.
- No advertising SDKs are active on iOS. Google Ads/gtag is disabled at runtime inside the Despia wrapper (detected via user-agent). **We do not track users across apps or websites, so no ATT prompt is required.**
- Push notifications via OneSignal (for application status updates).

**Account deletion (Guideline 5.1.1(v))**
Users can permanently delete their account from **Profile → Delete My Account** (bottom of the profile page). This immediately removes personal data (name, phone, avatar) and revokes access. Anonymized transaction records are retained only for tax/legal compliance (Saudi VAT law).

**Sign in with Apple (Guideline 4.8)**
Both Google Sign-In and Sign in with Apple are offered on the login screen. The demo account below uses email/password so the reviewer does not need an Apple ID.

**Demo account for review**
- URL (auto-loaded in app): https://visafaster.com
- Email: `applereview@visafaster.com`
- Password: `Vf-Rev!7k2Q9pXm4T`
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
- WhatsApp / Phone (reviewer contact, fastest): +966 56 252 5665
- Support email: support@visafaster.com

Thank you for your review.

---

## Pre-submission checklist
- [x] Demo account (`applereview@visafaster.com`) created in production with a sample application.
- [x] Reviewer contact number filled in.
- [ ] Confirm "Account Deletion" toggle in App Privacy = **Yes, users can delete their account**.
- [ ] Confirm "Data Used to Track You" = **None** (Google Ads is disabled in iOS build).
- [x] Sign in with Apple enabled on the login screen (Guideline 4.8 compliance for the Google Sign-In offering).