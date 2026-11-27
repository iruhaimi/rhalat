/** Campaign contacts and the dedicated Google Ads conversion destination. */
export const ADS_CAMPAIGN = {
  whatsappPhone: '966562525665',
  whatsappMessage: 'مرحباً، أنا قادم من الإعلان وأرغب بتجهيز ملف وموعد تأشيرة',
  // Google Ads "WhatsApp Click" conversion (فئة: جهة اتصال).
  // 986-983-1137 is the Ads account number, not a conversion destination.
  conversionDestination: 'AW-18502036693/8fXICLLzl74dENXZuvZE',
} as const;

export function campaignWhatsAppUrl(): string {
  return `https://wa.me/${ADS_CAMPAIGN.whatsappPhone}?text=${encodeURIComponent(ADS_CAMPAIGN.whatsappMessage)}`;
}