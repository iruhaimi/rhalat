import { describe, expect, it } from 'vitest';
import { ADS_CAMPAIGN, campaignWhatsAppUrl } from '@/config/adsCampaign';

describe('dedicated campaign contacts', () => {
  it('uses the campaign number, not the public site number', () => {
    expect(new URL(campaignWhatsAppUrl()).pathname).toBe('/966562525665');
  });
  it('identifies the advertisement in the initial message', () => {
    expect(new URL(campaignWhatsAppUrl()).searchParams.get('text')).toBe('مرحباً، أنا قادم من الإعلان وأرغب بتجهيز ملف وموعد تأشيرة');
  });
  it('uses the real Ads conversion destination, not the account number', () => {
    expect(ADS_CAMPAIGN.conversionDestination).toBe('AW-18502036693/8fXICLLzl74dENXZuvZE');
    expect(ADS_CAMPAIGN.conversionDestination).not.toContain('986-983-1137');
  });
});