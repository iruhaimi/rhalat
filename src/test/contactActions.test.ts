import { describe, expect, it } from 'vitest';
import { SITE_CONTACT } from '@/config/contact';
import { ADS_CAMPAIGN } from '@/config/adsCampaign';

describe('public contact actions', () => {
  it('calls the same phone number used by WhatsApp', () => {
    expect(SITE_CONTACT.phoneHref).toBe(`tel:+${ADS_CAMPAIGN.whatsappPhone}`);
    expect(SITE_CONTACT.phoneDisplay).toBe('0562525665');
  });
});
