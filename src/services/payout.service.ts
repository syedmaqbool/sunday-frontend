import { apiClient } from "@/lib/apiClient";

// ─── Shared response wrappers ─────────────────────────────────────────────────

interface ListResponse<T> {
  data: T[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}

interface ItemResponse<T> {
  data: T;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PayoutRun {
  id: string;
  periodStart: string;
  periodEnd: string;
  generatedBy: string;
  generatedByFullName: string;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
  totalAmount: number;
  sellerPayoutAmount: number;
  sellerPayoutItemCount: number;
  buyerRefundAmount: number;
  buyerRefundItemCount: number;
}

export interface PayoutRunItem {
  id: string;
  payoutRunId: string;
  periodStart: string;
  periodEnd: string;
  itemType: "SELLER_PAYOUT" | "BUYER_REFUND";
  status: "PAID" | "UNPAID";
  amount: number;
  userId: string;
  sellerId: string | null;
  buyerId: string | null;
  orderId: string | null;
  orderItemId: string | null;
  complaintId: string | null;
  userFullName: string | null;
  bankAccountHolder: string | null;
  bankAccountNumber: string | null;
  bankIban: string | null;
  bankName: string | null;
  bankSwift: string | null;
  sourceType: string;
  sourceStatus: string;
  sourceDate: string | null;
  sourceMetadata: {
    orderId?: string;
    listingTitle?: string;
    grossListingPrice?: number;
    sellerCommissionShare?: number;
    sellerCommissionShareRate?: number;
    buyerPlatformFeeAmount?: number;
    finalPayoutAmount?: number;
    complaintReason?: string;
    orderItemId?: string;
    [key: string]: unknown;
  };
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SellerPayout {
  id: string;
  sellerId: string;
  sellerFullName: string;
  createdBy: string;
  createdByFullName: string;
  amount: number;
  method: string;
  reference: string;
  notes: string | null;
  status: string;
  paidAt: string;
  periodStart: string | null;
  periodEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

// ─── Payload types ────────────────────────────────────────────────────────────

export interface CreatePayoutRunPayload {
  periodStart: string;
  periodEnd: string;
}

export interface CreateSellerPayoutPayload {
  sellerId: string;
  amount: number;
  method: string;
  reference: string;
  notes?: string | null;
  paidAt?: string;
  periodStart: string;
  periodEnd: string;
  status?: "PAID" | "PENDING" | "FAILED" | "CANCELLED";
}

export interface UpdatePayoutRunItemStatusPayload {
  status: "PAID" | "UNPAID";
  paidAt?: string;
}

// ─── Query param types ────────────────────────────────────────────────────────

export interface PayoutRunListParams {
  page?: number;
  size?: number;
  periodStart?: string;
  periodEnd?: string;
}

export interface PayoutRunItemListParams {
  page?: number;
  size?: number;
  itemType?: "SELLER_PAYOUT" | "BUYER_REFUND";
  status?: "PAID" | "UNPAID";
}

export interface AdminRefundReportParams {
  page?: number;
  size?: number;
  payoutRunId?: string;
  status?: "PAID" | "UNPAID";
}

export interface AdminSellerPayoutListParams {
  page?: number;
  size?: number;
  sellerId?: string;
  periodStart?: string;
  periodEnd?: string;
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function toQS(params: Record<string, string | number | undefined>): string {
  const qs = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  return qs ? `?${qs}` : "";
}

// ─── Service ──────────────────────────────────────────────────────────────────

export const payoutService = {
  // Payout Runs
  listRuns: (params: PayoutRunListParams = {}) =>
    apiClient.get<ListResponse<PayoutRun>>(
      `/api/v1/admin/payout-runs${toQS(params as Record<string, string | number | undefined>)}`
    ),

  createRun: (payload: CreatePayoutRunPayload) =>
    apiClient.post<ItemResponse<PayoutRun>>("/api/v1/admin/payout-runs", payload),

  // Payout Run Items
  listRunItems: (runId: string, params: PayoutRunItemListParams = {}) =>
    apiClient.get<ListResponse<PayoutRunItem>>(
      `/api/v1/admin/payout-runs/${runId}/items${toQS(params as Record<string, string | number | undefined>)}`
    ),

  updateRunItemStatus: (itemId: string, payload: UpdatePayoutRunItemStatusPayload) =>
    apiClient.patch<ItemResponse<PayoutRunItem>>(
      `/api/v1/admin/payout-runs/items/${itemId}/status`,
      payload
    ),

  // Buyer Refund Report
  listRefunds: (params: AdminRefundReportParams = {}) =>
    apiClient.get<ListResponse<PayoutRunItem>>(
      `/api/v1/admin/payout-runs/refunds${toQS(params as Record<string, string | number | undefined>)}`
    ),

  // Seller Payouts (manual records)
  listSellerPayouts: (params: AdminSellerPayoutListParams = {}) =>
    apiClient.get<ListResponse<SellerPayout>>(
      `/api/v1/admin/payouts${toQS(params as Record<string, string | number | undefined>)}`
    ),

  createSellerPayout: (payload: CreateSellerPayoutPayload) =>
    apiClient.post<ItemResponse<SellerPayout>>("/api/v1/admin/payouts", payload),
};