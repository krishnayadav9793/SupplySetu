import { PriceTier } from '@prisma/client';

export interface CalculatedPricing {
  mrp: number;
  basePrice: number;
  dealerPrice: number;
  discountPercent: number;
  marginPercent: number;
  gstRate: number;
  gstAmount: number;
  totalWithGst: number;
  tier: PriceTier;
}

export class PricingService {
  /**
   * Price tier discount matrix for FMCG distribution:
   * STANDARD: Base dealer price (0% extra tier discount)
   * TIER_1: 2% tier discount off base price
   * TIER_2: 4% tier discount off base price
   * WHOLESALE: 6.5% bulk wholesale tier discount
   */
  private static readonly TIER_DISCOUNTS: Record<PriceTier, number> = {
    STANDARD: 0.0,
    TIER_1: 2.0,
    TIER_2: 4.0,
    WHOLESALE: 6.5,
  };

  /**
   * Calculates retailer-specific dealer price and profit margins based on tier.
   */
  static calculatePrice(
    basePrice: number,
    mrp: number,
    gstRate: number = 18.0,
    tier: PriceTier = PriceTier.STANDARD
  ): CalculatedPricing {
    const tierDiscountPercent = this.TIER_DISCOUNTS[tier] || 0.0;
    const discountAmount = (basePrice * tierDiscountPercent) / 100.0;
    const dealerPrice = Math.round((basePrice - discountAmount) * 100) / 100;

    // Retailer profit margin vs MRP: ((mrp - dealerPrice) / mrp) * 100
    const marginPercent = mrp > 0
      ? Math.round(((mrp - dealerPrice) / mrp) * 1000) / 10
      : 0;

    // GST calculation
    const gstAmount = Math.round(((dealerPrice * gstRate) / 100) * 100) / 100;
    const totalWithGst = Math.round((dealerPrice + gstAmount) * 100) / 100;

    return {
      mrp,
      basePrice,
      dealerPrice,
      discountPercent: tierDiscountPercent,
      marginPercent,
      gstRate,
      gstAmount,
      totalWithGst,
      tier,
    };
  }

  /**
   * Returns discount percentage for a given tier.
   */
  static getTierDiscount(tier: PriceTier): number {
    return this.TIER_DISCOUNTS[tier] || 0.0;
  }
}
