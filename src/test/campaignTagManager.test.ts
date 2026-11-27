import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

import { GOOGLE_ANALYTICS_ID, HEAD_SCRIPTS_IN_ORDER as scripts } from '@/lib/headScripts';

function initialize(pathname: string, userAgent = 'Mozilla/5.0') {
  const loaded: string[] = [];
  const window = {
    location: { pathname, search: '', protocol: 'https:', href: `https://visafaster.com${pathname}` },
    dataLayer: [] as unknown[],
  };
  const context = {
    ...window,
    navigator: { userAgent },
    localStorage: { getItem: () => null },
    URLSearchParams,
    document: {
      documentElement: { style: {} },
      createElement: () => ({ src: '', async: false }),
      head: { appendChild: (script: { src: string }) => loaded.push(script.src) },
    },
  };
  const globals = Object.assign(context, { window: context, self: context, top: context });
  for (const script of scripts) runInNewContext(script, globals);
  return { loaded, events: globals.dataLayer.map(event => Array.from(event as ArrayLike<unknown>)), dataLayer: globals.dataLayer };
}

describe('campaign Tag Manager initialization', () => {
  it('loads the supplied container once on the requested campaign URL', () => {
    const result = initialize('/ads-visa');
    expect(result.loaded.filter(url => url.includes('/gtm.js'))).toEqual([
      'https://www.googletagmanager.com/gtm.js?id=GTM-TVXFHMFW',
    ]);
    expect(result.dataLayer).toContainEqual(expect.objectContaining({ event: 'gtm.js' }));
  });

  it('queues denied advertising consent before Tag Manager starts', () => {
    const result = initialize('/ads-visa');
    expect(result.events[0]).toEqual(['consent', 'default', expect.objectContaining({
      ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied',
    })]);
  });

  it('also loads on the existing campaign alias', () => {
    expect(initialize('/lp/visa/').loaded.some(url => url.includes('GTM-TVXFHMFW'))).toBe(true);
  });

  it('loads Tag Manager on every public page, including the homepage', () => {
    expect(initialize('/').loaded.some(url => url.includes('GTM-TVXFHMFW'))).toBe(true);
    expect(initialize('/about').loaded.some(url => url.includes('GTM-TVXFHMFW'))).toBe(true);
  });

  it('does not load any advertising scripts in the iOS wrapper', () => {
    expect(initialize('/ads-visa', 'despia-iphone').loaded).toEqual([]);
  });

  it('configures the supplied GA4 property after consent without an automatic initial page view', () => {
    expect(GOOGLE_ANALYTICS_ID).toBe('G-5HJSPDVN3W');
    for (const path of ['/', '/usa', '/schengen', '/uk', '/canada', '/brazil', '/japan', '/contact', '/future-page']) {
      const { events, loaded } = initialize(path);
      expect(events.filter(event => event[0] === 'config' && event[1] === 'G-5HJSPDVN3W')).toEqual([
        ['config', 'G-5HJSPDVN3W', { send_page_view: false }],
      ]);
      expect(events[0]).toEqual(['consent', 'default', expect.objectContaining({ analytics_storage: 'denied' })]);
      expect(events).toContainEqual(['set', 'developer_id.dZjgwMW', true]);
      expect(loaded.filter(url => url.includes('/gtag/js'))).toHaveLength(1);
    }
  });

  it('never configures GA4 in the iOS wrapper', () => {
    expect(initialize('/usa', 'despia-iphone').events.some(event => event[0] === 'config')).toBe(false);
  });

  it('sets explicit view configuration before GTM can initialize the linked Google tag', () => {
    const { dataLayer } = initialize('/usa');
    const configIndex = dataLayer.findIndex(event => Array.from(event as ArrayLike<unknown>)[0] === 'config');
    const gtmIndex = dataLayer.findIndex(event => (event as { event?: string }).event === 'gtm.js');
    expect(configIndex).toBeGreaterThan(0);
    expect(configIndex).toBeLessThan(gtmIndex);
  });
});