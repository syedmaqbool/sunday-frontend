export interface CheckoutPricingInput {
  platformDiscountAmount: number;
  platformFeeAmount: number;
  sellerCouponDiscountAmount: number;
  subtotal: number;
  taxRate: number;
}

export interface CheckoutPricing {
  subtotalAfterPlatformDiscount: number;
  taxAmount: number;
  total: number;
}

export function calculateCheckoutPricing({
  platformDiscountAmount,
  platformFeeAmount,
  sellerCouponDiscountAmount,
  subtotal,
  taxRate,
}: CheckoutPricingInput): CheckoutPricing {
  const subtotalAfterPlatformDiscount = subtotal - platformDiscountAmount;
  const taxAmount = Math.round(subtotalAfterPlatformDiscount * taxRate) / 100;
  const total = Math.round((
    subtotalAfterPlatformDiscount
    + taxAmount
    + platformFeeAmount
    - sellerCouponDiscountAmount
  ) * 100) / 100;

  return {
    subtotalAfterPlatformDiscount,
    taxAmount,
    total,
  };
}
