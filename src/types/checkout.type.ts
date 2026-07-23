import type { Order } from '@/types/order.type';

export interface ValidateDiscountPayload {
  code: string;
  listingIds: string[];
}

export interface ValidateDiscountResult {
  code: string;
  commissionAmount: number;
  currency: string;
  discountAmount: number;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  platformFeeAmount: number;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  total: number;
  totalAfterDiscount: number;
}

export interface ValidateSellerCouponResult {
  sellerId: string;
  code: string;
  currency: string;
  discountAmount: number;
  discountType: 'FIXED' | 'PERCENTAGE';
  discountValue: number;
  eligibleSubtotal: number;
}

export interface CreateOrderPayload {
  discountCode?: string;
  listingIds: string[];
  sellerCouponCode?: string;
  shippingAddress: string;
  shippingCity: string;
  shippingFirstName: string;
  shippingLastName: string;
  shippingPhone: string;
  shippingPostal: string;
}

export interface PayFastPayment {
  fields: Record<string, string>;
  paymentUrl: string;
}

export interface CheckoutOrderResult {
  order: Order;
  payment?: PayFastPayment | null;
}

export interface RetryPayFastResult {
  payment: PayFastPayment;
}

export interface CancelOrderResult {
  restorableListingIds: string[];
}
