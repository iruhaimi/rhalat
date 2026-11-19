import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

import { HEAD_SCRIPTS_IN_ORDER as scripts } from '@/lib/headScripts';

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

  it('does not add campaign Tag Manager to the public homepage', () => {
    expect(initialize('/').loaded.some(url => url.includes('/gtm.js'))).toBe(false);
  });

  it('does not load any advertising scripts in the iOS wrapper', () => {
    expect(initialize('/ads-visa', 'despia-iphone').loaded).toEqual([]);
  });
});