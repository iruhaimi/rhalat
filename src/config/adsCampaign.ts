/** Campaign-only contacts. Never reuse this number for the public site. */
export const ADS_CAMPAIGN = {
  whatsappPhone: '966504539157',
  whatsappMessage: 'مرحباً، أنا قادم من الإعلان وأرغب بتجهيز ملف وموعد تأشيرة',
  // Google Ads "WhatsApp Click" conversion (فئة: جهة اتصال).
  // 986-983-1137 is the Ads account number, not a conversion destination.
  conversionDestination: 'AW-18502036693/8fXICLLzl74dENXZuvZE',
} as const;

export function campaignWhatsAppUrl(): string {
  return `https://wa.me/${ADS_CAMPAIGN.whatsappPhone}?text=${encodeURIComponent(ADS_CAMPAIGN.whatsappMessage)}`;
}