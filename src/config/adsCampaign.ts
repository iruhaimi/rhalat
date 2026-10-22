/** Campaign-only contacts. Never reuse this number for the public site. */
export const ADS_CAMPAIGN = {
  whatsappPhone: '966504539157',
  whatsappMessage: 'مرحباً، أنا قادم من الإعلان وأرغب بتجهيز ملف وموعد تأشيرة',
  // The supplied 986-983-1137 is an account number, not a conversion destination.
  // Fill only after receiving the actual AW-ID/ConversionLabel from Google Ads.
  conversionDestination: '',
} as const;

export function campaignWhatsAppUrl(): string {
  return `https://wa.me/${ADS_CAMPAIGN.whatsappPhone}?text=${encodeURIComponent(ADS_CAMPAIGN.whatsappMessage)}`;
}