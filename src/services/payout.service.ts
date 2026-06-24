import { authInstance } from "@/services/ky.instance";
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
} from "@/types/payout";
import type { PaginatedResponse, Response } from "@/types/response.type";

export function listPayoutRuns(params: PayoutRunListParams = {}) {
  return authInstance
    .get("/api/v1/admin/payout-runs", {
      searchParams: params as Record<
        string,
        string | number | boolean | undefined
      >,
    })
    .json<PaginatedResponse<PayoutRun>>();
}

export function createPayoutRun(payload: CreatePayoutRunPayload) {
  return authInstance
    .post("/api/v1/admin/payout-runs", { json: payload })
    .json<Response<PayoutRun>>();
}

export function listPayoutRunItems(
  runId: string,
  params: PayoutRunItemListParams = {},
) {
  return authInstance
    .get(`/api/v1/admin/payout-runs/${runId}/items`, {
      searchParams: params as Record<
        string,
        string | number | boolean | undefined
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

export function listRefundPayouts(params: AdminRefundReportParams = {}) {
  return authInstance
    .get("/api/v1/admin/payout-runs/refunds", {
      searchParams: params as Record<
        string,
        string | number | boolean | undefined
      >,
    })
    .json<PaginatedResponse<PayoutRunItem>>();
}

export function listSellerPayouts(params: AdminSellerPayoutListParams = {}) {
  return authInstance
    .get("/api/v1/admin/payouts", {
      searchParams: params as Record<
        string,
        string | number | boolean | undefined
      >,
    })
    .json<PaginatedResponse<SellerPayout>>();
}

export function createSellerPayout(payload: CreateSellerPayoutPayload) {
  return authInstance
    .post("/api/v1/admin/payouts", { json: payload })
    .json<Response<SellerPayout>>();
}
