/**
 * Central legal identifiers for Visafaster / عطلات رحلاتكم.
 * Edit these values ONCE here — they propagate to Footer, ComplianceDisclaimer,
 * checkout fee disclosure, and any other public legal notice.
 *
 * Required for compliance with:
 *  - Google Ads "Government Documents & Official Services" policy (2026)
 *  - Saudi Ministry of Tourism + Ministry of Commerce disclosure rules
 *  - Saudi VAT (ZATCA) display requirement on tax-bearing invoices
 */
export const LEGAL = {
  /** Legal name of the operating company (Arabic). */
  companyNameAr: 'وكالة عطلات رحلاتكم للسفر والسياحة',
  /** Legal name of the operating company (English). */
  companyNameEn: 'Rahalatukum Travel & Tourism Co.',
  /** Saudi Ministry of Tourism license number. */
  tourismLicense: '73100234',
  /** Saudi Ministry of Commerce — Commercial Registration. */
  commercialRegistration: '7010581259',
  /** Saudi VAT (ZATCA) registration number — 15 digits. */
  vatNumber: '302009616300003',
  /** Brand domain shown in legal text. */
  domain: 'visafaster.com',
  /** Support inbox shown on public pages (account deletion, contact). */
  supportEmail: 'support@visafaster.com',
  /** Saudi MoFA official consular services page (used in disclaimers). */
  mofaUrl: 'https://www.mofa.gov.sa/ar/ConsularServices',
} as const;
