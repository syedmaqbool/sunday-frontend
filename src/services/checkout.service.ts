import type {
  CancelOrderResult,
  CheckoutOrderResult,
  CheckoutQuote,
  CheckoutQuotePayload,
  CreateOrderPayload,
  PaymentInstructions,
  ResubmitManualPaymentPayload,
  ResubmitManualPaymentResult,
  UploadedPaymentProof,
} from '@/types/checkout.type';
import type { Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function quoteCheckout(payload: CheckoutQuotePayload) {
  return authInstance
    .post('/api/v1/checkout/quote', { json: payload })
    .json<Response<CheckoutQuote>>();
}

export function createOrder(payload: CreateOrderPayload) {
  return authInstance
    .post('/api/v1/checkout/orders', { json: payload })
    .json<Response<CheckoutOrderResult>>();
}

export function getPaymentInstructions() {
  return authInstance
    .get('/api/v1/checkout/payment-instructions')
    .json<Response<PaymentInstructions>>();
}

export function uploadPaymentProof(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('purpose', 'PAYMENT_PROOF');

  return authInstance
    .post('/api/upload-file', { body: formData })
    .json<Response<UploadedPaymentProof>>();
}

export function cancelOrder(orderId: string) {
  return authInstance
    .post(`/api/v1/checkout/orders/${orderId}/cancel`)
    .json<Response<CancelOrderResult>>();
}

export function resubmitManualPayment(
  orderId: string,
  payload: ResubmitManualPaymentPayload,
) {
  return authInstance
    .post(`/api/v1/checkout/orders/${orderId}/resubmit`, { json: payload })
    .json<Response<ResubmitManualPaymentResult>>();
}
