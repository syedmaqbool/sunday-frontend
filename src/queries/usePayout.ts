import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  payoutService,
  type AdminRefundReportParams,
  type AdminSellerPayoutListParams,
  type CreatePayoutRunPayload,
  type CreateSellerPayoutPayload,
  type PayoutRunItemListParams,
  type PayoutRunListParams,
  type UpdatePayoutRunItemStatusPayload,
} from "@/services/payout.service";

// ─── Query keys ───────────────────────────────────────────────────────────────

const PAYOUT_RUNS_KEY = ["payout-runs"];
const PAYOUT_REFUNDS_KEY = ["payout-refunds"];
const SELLER_PAYOUTS_KEY = ["admin-seller-payouts"];

// ─── Payout Runs ──────────────────────────────────────────────────────────────

export const usePayoutRuns = (params: PayoutRunListParams = {}) =>
  useQuery({
    queryKey: [...PAYOUT_RUNS_KEY, params],
    queryFn: async () => {
      const res = await payoutService.listRuns(params);
      return res;
    },
  });

export const useCreatePayoutRun = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePayoutRunPayload) =>
      payoutService.createRun(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYOUT_RUNS_KEY });
    },
  });
};

// ─── Payout Run Items ─────────────────────────────────────────────────────────

export const usePayoutRunItems = (runId: string, params: PayoutRunItemListParams = {}) =>
  useQuery({
    queryKey: [...PAYOUT_RUNS_KEY, runId, "items", params],
    queryFn: async () => {
      const res = await payoutService.listRunItems(runId, params);
      return res;
    },
    enabled: Boolean(runId),
  });

export const useUpdatePayoutRunItemStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      payload,
    }: {
      itemId: string;
      payload: UpdatePayoutRunItemStatusPayload;
    }) => payoutService.updateRunItemStatus(itemId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PAYOUT_RUNS_KEY });
      queryClient.invalidateQueries({ queryKey: PAYOUT_REFUNDS_KEY });
    },
  });
};

// ─── Buyer Refund Report ──────────────────────────────────────────────────────

export const useAdminRefundReport = (params: AdminRefundReportParams = {}) =>
  useQuery({
    queryKey: [...PAYOUT_REFUNDS_KEY, params],
    queryFn: async () => {
      const res = await payoutService.listRefunds(params);
      return res;
    },
  });

// ─── Seller Payouts (manual records) ─────────────────────────────────────────

export const useAdminSellerPayouts = (params: AdminSellerPayoutListParams = {}) =>
  useQuery({
    queryKey: [...SELLER_PAYOUTS_KEY, params],
    queryFn: async () => {
      const res = await payoutService.listSellerPayouts(params);
      return res;
    },
  });

export const useCreateSellerPayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSellerPayoutPayload) =>
      payoutService.createSellerPayout(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SELLER_PAYOUTS_KEY });
      queryClient.invalidateQueries({ queryKey: PAYOUT_RUNS_KEY });
    },
  });
};