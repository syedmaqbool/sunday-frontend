import type {
  AdminRefundReportParams,
  AdminSellerPayoutListParams,
  CreatePayoutRunPayload,
  CreateSellerPayoutPayload,
  PayoutRun,
  PayoutRunItem,
  PayoutRunItemListParams,
  PayoutRunListParams,
  SellerPayout,
  UpdatePayoutRunItemStatusPayload,
} from '@/types/payout.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listPayoutRuns(parameters: PayoutRunListParams = {}) {
  return authInstance
    .get('/api/v1/admin/payout-runs', {
      searchParams: parameters as Record<
        string,
        boolean | number | string | undefined
      >,
    })
    .json<PaginatedResponse<PayoutRun>>();
}

export function createPayoutRun(payload: CreatePayoutRunPayload) {
  return authInstance
    .post('/api/v1/admin/payout-runs', { json: payload })
    .json<Response<PayoutRun>>();
}

export function listPayoutRunItems(
  runId: string,
  parameters: PayoutRunItemListParams = {},
) {
  return authInstance
    .get(`/api/v1/admin/payout-runs/${runId}/items`, {
      searchParams: parameters as Record<
        string,
        boolean | number | string | undefined
      >,
    })
    .json<PaginatedResponse<PayoutRunItem>>();
}

export function updatePayoutRunItemStatus(
  itemId: string,
  payload: UpdatePayoutRunItemStatusPayload,
) {
  return authInstance
    .patch(`/api/v1/admin/payout-runs/items/${itemId}/status`, {
      json: payload,
    })
    .json<Response<PayoutRunItem>>();
}

export function listRefundPayouts(parameters: AdminRefundReportParams = {}) {
  return authInstance
    .get('/api/v1/admin/payout-runs/refunds', {
      searchParams: parameters as Record<
        string,
        boolean | number | string | undefined
      >,
    })
    .json<PaginatedResponse<PayoutRunItem>>();
}

export function listSellerPayouts(parameters: AdminSellerPayoutListParams = {}) {
  return authInstance
    .get('/api/v1/admin/payouts', {
      searchParams: parameters as Record<
        string,
        boolean | number | string | undefined
      >,
    })
    .json<PaginatedResponse<SellerPayout>>();
}

export function createSellerPayout(payload: CreateSellerPayoutPayload) {
  return authInstance
    .post('/api/v1/admin/payouts', { json: payload })
    .json<Response<SellerPayout>>();
}
