import { describe, expect, it } from 'vitest';
import { ADS_CAMPAIGN, campaignWhatsAppUrl } from '@/config/adsCampaign';

describe('dedicated campaign contacts', () => {
  it('uses the campaign number, not the public site number', () => {
    expect(new URL(campaignWhatsAppUrl()).pathname).toBe('/966504539157');
  });
  it('identifies the advertisement in the initial message', () => {
    expect(new URL(campaignWhatsAppUrl()).searchParams.get('text')).toBe('مرحباً، أنا قادم من الإعلان وأرغب بتجهيز ملف وموعد تأشيرة');
  });
  it('does not invent an Ads conversion from an account number', () => {
    expect(ADS_CAMPAIGN.conversionDestination).toBe('');
  });
});