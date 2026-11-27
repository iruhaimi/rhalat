import { StrictMode } from 'react';
import { cleanup, render, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PageViewTracker from '@/components/analytics/PageViewTracker';

const location = vi.hoisted(() => ({ pathname: '/', search: '' }));
vi.mock('@/lib/router-compat', () => ({ useLocation: () => location }));
vi.mock('@/lib/headScripts', () => ({ GOOGLE_ANALYTICS_ID: 'G-5HJSPDVN3W' }));

const gtag = vi.fn();
let dataLayer: unknown[];

beforeEach(() => {
  vi.useFakeTimers();
  location.pathname = '/';
  location.search = '';
  dataLayer = [];
  Object.assign(window, { gtag, dataLayer });
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('Mozilla/5.0');
  gtag.mockClear();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('site-wide GA4 page views', () => {
  it('records exactly one initial GA4 view even in StrictMode', () => {
    render(<StrictMode><PageViewTracker /></StrictMode>);
    act(() => vi.runAllTimers());
    expect(gtag.mock.calls.filter(call => call[2]?.send_to === 'G-5HJSPDVN3W')).toEqual([['event', 'page_view', expect.objectContaining({
      send_to: 'G-5HJSPDVN3W', page_path: '/',
    })]]);
    expect(gtag).toHaveBeenCalledTimes(1);
    expect(dataLayer).toEqual([]);
  });

  it('records navigation only once for GA4, never as an Ads conversion', () => {
    const view = render(<PageViewTracker />);
    act(() => vi.runAllTimers());
    gtag.mockClear();
    location.pathname = '/usa';
    view.rerender(<PageViewTracker />);
    act(() => vi.runAllTimers());
    expect(gtag.mock.calls).toEqual([
      ['event', 'page_view', expect.objectContaining({ send_to: 'G-5HJSPDVN3W', page_path: '/usa' })],
    ]);
    expect(dataLayer).toEqual([expect.objectContaining({ event: 'page_view', page_path: '/usa' })]);
    view.rerender(<PageViewTracker />);
    act(() => vi.runAllTimers());
    expect(gtag).toHaveBeenCalledTimes(1);
  });

  it('does not record any page views inside the iOS wrapper', () => {
    vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('despia-iphone');
    render(<PageViewTracker />);
    act(() => vi.runAllTimers());
    expect(gtag).not.toHaveBeenCalled();
    expect(dataLayer).toEqual([]);
  });

  it('normalizes the router search prefix to one question mark', () => {
    location.pathname = '/usa';
    location.search = '??utm_source=google';
    render(<PageViewTracker />);
    act(() => vi.runAllTimers());
    expect(gtag).toHaveBeenCalledExactlyOnceWith('event', 'page_view', expect.objectContaining({
      send_to: 'G-5HJSPDVN3W', page_path: '/usa?utm_source=google',
    }));
  });
});