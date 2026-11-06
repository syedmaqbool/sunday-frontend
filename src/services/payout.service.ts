import type {
  AdminRefundReportParams,
  AdminBuyerRefundsParams,
  AdminBuyerRefundsResponse,
  AdminSellerPayoutListParams,
  CreatePayoutRunPayload,
  CreateSellerPayoutPayload,
  EligibleSellerPayoutItemsParams,
  EligibleSellerPayoutItemsResponse,
  PayoutRun,
  PayoutRunItem,
  PayoutRunItemListParams,
  PayoutRunListParams,
  RecordAdminSellerPaymentPayload,
  RecordAdminSellerPaymentResponse,
  RecordSellerPayoutCyclePaymentPayload,
  RecordSellerPayoutCyclePaymentResponse,
  SellerPayout,
  SellerPayoutSummaryListParams,
  SellerPayoutSummaryResponse,
  SellerPayment,
  SellerPaymentDetailResponse,
  SellerPaymentListParams,
  SellerPayablePreviewResponse,
} from '@/types/payout.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listPayoutRuns(parameters: PayoutRunListParams = {}) {
  return authInstance
    .get('/api/v1/admin/payout-runs', {
      searchParams: parameters as Record<string, boolean | number | string | undefined>,
    })
    .json<PaginatedResponse<PayoutRun>>();
}

export function createPayoutRun(payload: CreatePayoutRunPayload) {
  return authInstance
    .post('/api/v1/admin/payout-runs', { json: payload })
    .json<Response<PayoutRun>>();
}

export function listEligibleSellerPayoutItems(parameters: EligibleSellerPayoutItemsParams) {
  return authInstance
    .get('/api/v1/admin/payout-runs/eligible-items', {
      searchParams: parameters as Record<string, boolean | number | string | undefined>,
    })
    .json<EligibleSellerPayoutItemsResponse>();
}

export function listPayoutRunItems(runId: string, parameters: PayoutRunItemListParams = {}) {
  return authInstance
    .get(`/api/v1/admin/payout-runs/${runId}/items`, {
      searchParams: parameters as Record<string, boolean | number | string | undefined>,
    })
    .json<PaginatedResponse<PayoutRunItem>>();
}

export function recordSellerPayoutCyclePayment(
  runId: string,
  sellerId: string,
  payload: RecordSellerPayoutCyclePaymentPayload,
) {
  return authInstance
    .post(`/api/v1/admin/payout-runs/${runId}/sellers/${sellerId}/payment`, { json: payload })
    .json<RecordSellerPayoutCyclePaymentResponse>();
}

export function listRefundPayouts(parameters: AdminRefundReportParams = {}) {
  return authInstance
    .get('/api/v1/admin/payout-runs/refunds', {
      searchParams: parameters as Record<string, boolean | number | string | undefined>,
    })
    .json<PaginatedResponse<PayoutRunItem>>();
}

export function listAdminBuyerRefunds(parameters: AdminBuyerRefundsParams) {
  return authInstance
    .get('/api/v1/admin/payouts/refunds', {
      searchParams: parameters as Record<string, boolean | number | string | undefined>,
    })
    .json<AdminBuyerRefundsResponse>();
}

export function listSellerPayouts(parameters: AdminSellerPayoutListParams = {}) {
  return authInstance
    .get('/api/v1/admin/payouts', {
      searchParams: parameters as Record<string, boolean | number | string | undefined>,
    })
    .json<PaginatedResponse<SellerPayout>>();
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

export function createSellerPayout(payload: CreateSellerPayoutPayload) {
  return authInstance
    .post('/api/v1/admin/payouts', { json: payload })
    .json<Response<SellerPayout>>();
}
