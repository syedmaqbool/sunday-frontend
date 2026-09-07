import type {
  AdminOrder,
  AdminOrderListParameters,
  ManualPaymentReviewPayload,
  ReservedListing,
} from '@/types/adminOrder.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listAdminOrders(
  parameters: AdminOrderListParameters = {},
) {
  return authInstance
    .get('/api/v1/admin/orders', {
      searchParams: parameters as Record<string, boolean | number | string | undefined>,
    })
    .json<PaginatedResponse<AdminOrder>>();
}

export function getAdminOrder(orderId: string) {
  return authInstance
    .get(`/api/v1/admin/orders/${orderId}`)
    .json<Response<AdminOrder>>();
}

export function approveAdminManualPayment(orderId: string) {
  return authInstance
    .post(`/api/v1/admin/orders/${orderId}/manual-payment/approve`)
    .json<Response<AdminOrder['manualPaymentSubmissions'][number]>>();
}

export function rejectAdminManualPayment(
  orderId: string,
  payload: ManualPaymentReviewPayload,
) {
  return authInstance
    .post(`/api/v1/admin/orders/${orderId}/manual-payment/reject`, { json: payload })
    .json<Response<AdminOrder['manualPaymentSubmissions'][number]>>();
}

export function requestAdminManualPaymentResubmission(
  orderId: string,
  payload: ManualPaymentReviewPayload,
) {
  return authInstance
    .post(`/api/v1/admin/orders/${orderId}/manual-payment/request-resubmission`, { json: payload })
    .json<Response<AdminOrder['manualPaymentSubmissions'][number]>>();
}

export function getPaymentProofFile(fileId: string) {
  return authInstance
    .get(`/api/v1/payment-proof-files/${fileId}`)
    .blob();
}

export function listReservedListings(
  parameters: { page?: number; size?: number } = {},
) {
  return authInstance
    .get('/api/v1/admin/orders/reserved-listings', { searchParams: parameters })
    .json<PaginatedResponse<ReservedListing>>();
}
