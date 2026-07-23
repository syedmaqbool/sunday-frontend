import type {
  CancelOrderResult,
  CheckoutOrderResult,
  CreateOrderPayload,
  PayFastPayment,
  RetryPayFastResult,
  ValidateDiscountPayload,
  ValidateDiscountResult,
  ValidateSellerCouponResult,
} from '@/types/checkout.type';
import type { Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

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
    .json<Response<CheckoutOrderResult>>();
}

export function retryPayFastOrder(orderId: string) {
  return authInstance
    .post(`/api/v1/checkout/orders/${orderId}/payfast`)
    .json<Response<PayFastPayment | RetryPayFastResult>>();
}

export function cancelOrder(orderId: string) {
  return authInstance
    .post(`/api/v1/checkout/orders/${orderId}/cancel`)
    .json<Response<CancelOrderResult>>();
}
