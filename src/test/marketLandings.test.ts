import { describe, it, expect } from 'vitest';
import { MARKET_LANDINGS, MARKET_KEYS } from '@/config/marketLandings';

const texts = (k: string) => {
  const m = MARKET_LANDINGS[k as keyof typeof MARKET_LANDINGS];
  return [m.title, m.intro, m.seoTitle, m.seoDescription, m.closingTitle, ...m.services.flatMap(s => [s.title, s.description]), ...m.benefits.map(b => b.description), ...m.steps.map(s => s.description), ...m.faq.flatMap(f => [f.q, f.a])];
};

describe('market landing pages', () => {
  it('has exactly the six requested markets', () => {
    expect(MARKET_KEYS.sort()).toEqual(['brazil', 'canada', 'japan', 'schengen', 'uk', 'usa']);
  });
  it('uses direct country URLs as the canonical paths', () => {
    for (const k of MARKET_KEYS) expect(MARKET_LANDINGS[k].path).toBe(`/${k}`);
  });
  it('never repeats a sentence between markets', () => {
    const seen = new Map<string, string>();
    for (const k of MARKET_KEYS) for (const t of texts(k)) {
      expect(seen.get(t), `"${t}" reused in ${k}`).toBeUndefined();
      seen.set(t, k);
    }
  });
  it('makes no guarantee or government claims', () => {
    for (const k of MARKET_KEYS) for (const t of texts(k)) {
      expect(t).not.toMatch(/(?<!لا )نضمن (لك )?(القبول|التأشيرة|صدور)|مضمون|معتمد(ون)? من السفارة|الجهة الرسمية الوحيدة|إلزامي(ة)? لكل/);
    }
  });
});
