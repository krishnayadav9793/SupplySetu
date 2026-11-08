import { describe, it, expect } from 'vitest';
import { calculateItemBenefits } from '../context/CartContext';
import { Product } from '../types';

describe('Cart Pricing & FMCG Scheme Calculations', () => {
  const baseProduct: Product = {
    id: 'prod-1',
    skuCode: 'SURF-EXCEL-1KG',
    name: 'Surf Excel Easy Wash 1kg',
    brand: 'Hindustan Unilever',
    category: 'Home Care',
    mrp: 140,
    basePrice: 120,
    gstRate: 18,
    isAvailable: true,
  };

  it('computes standard price, GST, and total without schemes', () => {
    const res = calculateItemBenefits(baseProduct, 2);
    // 120 * 2 = 240 taxable. 18% GST on 240 = 43.2. Total = 283.2
    expect(res.unitPrice).toBe(120);
    expect(res.discountAmount).toBe(0);
    expect(res.freeQuantity).toBe(0);
    expect(res.gstAmount).toBe(43.2);
    expect(res.itemTotal).toBe(283.2);
  });

  it('calculates Buy X Get Y Free scheme correctly', () => {
    const productWithScheme: Product = {
      ...baseProduct,
      scheme: {
        id: 'sch-1',
        title: 'Buy 10 Get 1 Free',
        schemeType: 'BUY_X_GET_Y_FREE',
        minQuantity: 10,
        freeQuantity: 1,
        discountPercent: 0,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        isActive: true,
      },
    };

    // Ordering 25 items -> 2 free sets (20 items = 2 free)
    const res = calculateItemBenefits(productWithScheme, 25);
    expect(res.freeQuantity).toBe(2);
    expect(res.discountAmount).toBe(0);
  });

  it('calculates Percentage Volume Discount scheme correctly', () => {
    const productWithVolumeDiscount: Product = {
      ...baseProduct,
      scheme: {
        id: 'sch-2',
        title: '5% off on 5+ packs',
        schemeType: 'PERCENTAGE_DISCOUNT',
        minQuantity: 5,
        freeQuantity: 0,
        discountPercent: 5,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        isActive: true,
      },
    };

    // 5 units * 120 = 600. 5% discount = 30. Taxable = 570. 18% GST = 102.6. Total = 672.6
    const res = calculateItemBenefits(productWithVolumeDiscount, 5);
    expect(res.discountAmount).toBe(30);
    expect(res.gstAmount).toBe(102.6);
    expect(res.itemTotal).toBe(672.6);
  });
});
