interface PricingData {
  travelers: { adults: number; children: number; infants: number };
  adultPrice: number;
  childPrice: number;
  infantPrice: number;
  visaFeesIncluded: boolean;
  governmentFees: number;
  governmentFeesByAge?: { adults: number; children: number; infants: number };
}

export function calculateApplicationPricing(data: PricingData) {
  const breakdown = {
    adults: data.travelers.adults * data.adultPrice,
    children: data.travelers.children * data.childPrice,
    infants: data.travelers.infants * data.infantPrice,
  };
  const serviceTotal = breakdown.adults + breakdown.children + breakdown.infants;
  const fees = data.governmentFeesByAge ?? {
    adults: data.governmentFees, children: data.governmentFees, infants: data.governmentFees,
  };
  const governmentTotal = data.visaFeesIncluded ? 0
    : data.travelers.adults * fees.adults + data.travelers.children * fees.children + data.travelers.infants * fees.infants;
  return { serviceTotal, governmentTotal, grandTotal: serviceTotal, breakdown };
}