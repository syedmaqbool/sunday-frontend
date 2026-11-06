import type {
  AdminBuyerRefundsParams,
  AdminBuyerRefundsResponse,
  AdminPayoutTransaction,
  AdminPayoutTransactionListParams,
  RecordAdminSellerPaymentPayload,
  RecordAdminSellerPaymentResponse,
  SellerPayoutSummaryListParams,
  SellerPayoutSummaryResponse,
  SellerPayment,
  SellerPaymentDetailResponse,
  SellerPaymentListParams,
  SellerPayablePreviewResponse,
} from '@/types/payout.type';
import type { PaginatedResponse } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listAdminBuyerRefunds(parameters: AdminBuyerRefundsParams) {
  return authInstance
    .get('/api/v1/admin/payouts/refunds', {
      searchParams: parameters as Record<string, boolean | number | string | undefined>,
    })
    .json<AdminBuyerRefundsResponse>();
}

export function listAdminPayoutSellers(parameters: SellerPayoutSummaryListParams) {
  return authInstance
    .get('/api/v1/admin/payouts/sellers', {
      searchParams: parameters as Record<string, boolean | number | string | undefined>,
    })
    .json<SellerPayoutSummaryResponse>();
}

export function listAdminSellerPayments(parameters: SellerPaymentListParams) {
  return authInstance
    .get('/api/v1/admin/payouts/payments', {
      searchParams: parameters as Record<string, boolean | number | string | undefined>,
    })
    .json<PaginatedResponse<SellerPayment>>();
}

export function getAdminSellerPayment(paymentId: string) {
  return authInstance
    .get(`/api/v1/admin/payouts/payments/${paymentId}`)
    .json<SellerPaymentDetailResponse>();
}

export function listAdminPayoutTransactions(parameters: AdminPayoutTransactionListParams) {
  return authInstance
    .get('/api/v1/admin/payouts/transactions', {
      searchParams: parameters as Record<string, boolean | number | string | undefined>,
    })
    .json<PaginatedResponse<AdminPayoutTransaction>>();
}

export function getAdminSellerPayable(sellerId: string) {
  return authInstance
    .get(`/api/v1/admin/payouts/sellers/${sellerId}/payable`)
    .json<SellerPayablePreviewResponse>();
}

export function recordAdminSellerPayment(
  sellerId: string,
  payload: RecordAdminSellerPaymentPayload,
) {
  return authInstance
    .post(`/api/v1/admin/payouts/sellers/${sellerId}/payment`, { json: payload })
    .json<RecordAdminSellerPaymentResponse>();
}
