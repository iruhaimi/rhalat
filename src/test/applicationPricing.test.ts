import { describe, it, expect } from 'vitest';
import { calculateApplicationPricing } from '@/lib/applicationPricing';

const data = {
  travelers: { adults: 2, children: 1, infants: 1 },
  adultPrice: 350, childPrice: 250, infantPrice: 0,
  visaFeesIncluded: false, governmentFees: 400,
  governmentFeesByAge: { adults: 400, children: 200, infants: 0 },
};

describe('configured application pricing', () => {
  it('excludes separately paid government fees from checkout', () => {
    expect(calculateApplicationPricing(data).grandTotal).toBe(950);
  });
  it('estimates government fees using configured age groups', () => {
    expect(calculateApplicationPricing(data).governmentTotal).toBe(1000);
  });
  it('does not add government estimates for inclusive visas', () => {
    expect(calculateApplicationPricing({ ...data, visaFeesIncluded: true }).governmentTotal).toBe(0);
  });
  it('supports older drafts with a single configured government fee', () => {
    expect(calculateApplicationPricing({ ...data, governmentFeesByAge: undefined }).governmentTotal).toBe(1600);
  });
});