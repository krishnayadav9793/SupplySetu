import { describe, it, expect } from 'vitest';
import { PricingService } from '../modules/pricing/pricing.service';
import { PriceTier } from '@prisma/client';

describe('PricingService & FMCG Margin Engine', () => {
  it('Standard Tier applies 0% discount', () => {
    const res = PricingService.calculatePrice(1000, 1200, 18, PriceTier.STANDARD);
    expect(res.dealerPrice).toBe(1000);
    expect(res.discountPercent).toBe(0);
    expect(res.gstAmount).toBe(180);
    expect(res.totalWithGst).toBe(1180);
  });

  it('Tier 1 applies 2% discount', () => {
    const res = PricingService.calculatePrice(1000, 1200, 18, PriceTier.TIER_1);
    expect(res.dealerPrice).toBe(980);
    expect(res.discountPercent).toBe(2);
    expect(res.gstAmount).toBe(176.4);
    expect(res.totalWithGst).toBe(1156.4);
  });

  it('Tier 2 applies 4% discount', () => {
    const res = PricingService.calculatePrice(1000, 1200, 18, PriceTier.TIER_2);
    expect(res.dealerPrice).toBe(960);
    expect(res.discountPercent).toBe(4);
  });

  it('Wholesale Tier applies 6.5% discount', () => {
    const res = PricingService.calculatePrice(1000, 1200, 18, PriceTier.WHOLESALE);
    expect(res.dealerPrice).toBe(935);
    expect(res.discountPercent).toBe(6.5);
  });

  it('calculates retailer margin percent against MRP correctly', () => {
    // MRP 1200, Dealer price 960 -> margin = (1200 - 960) / 1200 = 240 / 1200 = 20%
    const res = PricingService.calculatePrice(1000, 1200, 18, PriceTier.TIER_2);
    expect(res.marginPercent).toBe(20.0);
  });
});
