import { describe, expect, it } from 'vitest';
import { calculateCheckoutPricing } from '@/lib/checkoutPricing';

describe('calculateCheckoutPricing', () => {
  it('keeps seller-coupon savings off the merchandise subtotal and tax base', () => {
    expect(calculateCheckoutPricing({
      platformDiscountAmount: 0,
      platformFeeAmount: 50,
      sellerCouponDiscountAmount: 20,
      subtotal: 1000,
      taxRate: 10,
    })).toEqual({
      subtotalAfterPlatformDiscount: 1000,
      taxAmount: 100,
      total: 1130,
    });
  });

  it('applies platform-wide discounts to merchandise and its tax base', () => {
    expect(calculateCheckoutPricing({
      platformDiscountAmount: 100,
      platformFeeAmount: 50,
      sellerCouponDiscountAmount: 0,
      subtotal: 1000,
      taxRate: 10,
    })).toEqual({
      subtotalAfterPlatformDiscount: 900,
      taxAmount: 90,
      total: 1040,
    });
  });

  it('combines both coupon types while subtracting seller savings from platform fees', () => {
    expect(calculateCheckoutPricing({
      platformDiscountAmount: 100,
      platformFeeAmount: 50,
      sellerCouponDiscountAmount: 20,
      subtotal: 1000,
      taxRate: 10,
    })).toEqual({
      subtotalAfterPlatformDiscount: 900,
      taxAmount: 90,
      total: 1020,
    });
  });
});
