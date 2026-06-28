import type { Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

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

export interface Order {
  id: string;
  commissionAmount: number;
  discountAmount: number;
  discountCode: string | null;
  status: string;
  subtotal: number;
  taxAmount: number;
  taxRate: number;
  total: number;
}

export function validateDiscount(payload: ValidateDiscountPayload) {
  return authInstance
    .post('/api/v1/checkout/validate-discount', { json: payload })
    .json<Response<ValidateDiscountResult>>();
}

export function validateSellerCoupon(payload: ValidateDiscountPayload) {
  return authInstance
    .post('/api/v1/checkout/validate-seller-coupon', { json: payload })
    .json<Response<ValidateSellerCouponResult>>();
}

export function createOrder(payload: CreateOrderPayload) {
  return authInstance
    .post('/api/v1/checkout/orders', { json: payload })
    .json<Response<Order>>();
}
