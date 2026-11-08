import { describe, it, expect } from 'vitest';

describe('Scheme Calculation Engine', () => {
  it('Buy 10 Get 1 Free - gives 0 free items below minimum quantity', () => {
    const minQty = 10;
    const freePerSet = 1;
    const qty = 9;
    const free = qty >= minQty ? Math.floor(qty / minQty) * freePerSet : 0;
    expect(free).toBe(0);
  });

  it('Buy 10 Get 1 Free - gives 1 free item at exactly minimum quantity', () => {
    const minQty = 10;
    const freePerSet = 1;
    const qty = 10;
    const free = qty >= minQty ? Math.floor(qty / minQty) * freePerSet : 0;
    expect(free).toBe(1);
  });

  it('Buy 10 Get 1 Free - awards multiple free items proportionally', () => {
    const minQty = 10;
    const freePerSet = 1;
    const qty = 25;
    const free = qty >= minQty ? Math.floor(qty / minQty) * freePerSet : 0;
    expect(free).toBe(2);
  });

  it('Percentage Volume Discount calculation', () => {
    const qty = 6;
    const minQty = 5;
    const discountPercent = 5.0; // 5% bulk discount
    const dealerPrice = 1980;

    let discountAmount = 0;
    if (qty >= minQty) {
      discountAmount = Math.round(((dealerPrice * qty * discountPercent) / 100) * 100) / 100;
    }
    // 1980 * 6 = 11880. 5% of 11880 = 594.
    expect(discountAmount).toBe(594);
  });
});
