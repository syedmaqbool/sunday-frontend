import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createPayoutRun,
  createSellerPayout,
  listPayoutRunItems,
  listPayoutRuns,
  listRefundPayouts,
  listSellerPayouts,
  updatePayoutRunItemStatus,
} from "@/services/payout.service";
import type {
  AdminRefundReportParams,
  AdminSellerPayoutListParams,
  CreatePayoutRunPayload,
  CreateSellerPayoutPayload,
  PayoutRunItemListParams,
  PayoutRunListParams,
  UpdatePayoutRunItemStatusPayload,
} from "@/types/payout";

// ─── Query keys ───────────────────────────────────────────────────────────────

export const payoutQueryKey = {
  runs: () => ["payout-runs"] as const,
  runList: (params: PayoutRunListParams = {}) =>
    [...payoutQueryKey.runs(), "list", params] as const,
  runItems: (runId: string, params: PayoutRunItemListParams = {}) =>
    [...payoutQueryKey.runs(), runId, "items", params] as const,
  refunds: () => ["payout-refunds"] as const,
  refundList: (params: AdminRefundReportParams = {}) =>
    [...payoutQueryKey.refunds(), "list", params] as const,
  sellerPayouts: () => ["admin-seller-payouts"] as const,
  sellerPayoutList: (params: AdminSellerPayoutListParams = {}) =>
    [...payoutQueryKey.sellerPayouts(), "list", params] as const,
};

// ─── Payout Runs ──────────────────────────────────────────────────────────────

export const getPayoutRunsOptions = (params: PayoutRunListParams = {}) =>
  queryOptions({
    queryKey: payoutQueryKey.runList(params),
    queryFn: async () => {
      const res = await listPayoutRuns(params);
      return res;
    },
  });

export const usePayoutRuns = (params: PayoutRunListParams = {}) =>
  useQuery(getPayoutRunsOptions(params));

export const useCreatePayoutRun = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePayoutRunPayload) => createPayoutRun(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payoutQueryKey.runs() });
    },
  });
};

// ─── Payout Run Items ─────────────────────────────────────────────────────────

export const getPayoutRunItemsOptions = (
  runId: string,
  params: PayoutRunItemListParams = {},
) =>
  queryOptions({
    queryKey: payoutQueryKey.runItems(runId, params),
    queryFn: async () => {
      const res = await listPayoutRunItems(runId, params);
      return res;
    },
    enabled: Boolean(runId),
  });

export const usePayoutRunItems = (
  runId: string,
  params: PayoutRunItemListParams = {},
) => useQuery(getPayoutRunItemsOptions(runId, params));

export const useUpdatePayoutRunItemStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      itemId,
      payload,
    }: {
      itemId: string;
      payload: UpdatePayoutRunItemStatusPayload;
    }) => updatePayoutRunItemStatus(itemId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payoutQueryKey.runs() });
      queryClient.invalidateQueries({ queryKey: payoutQueryKey.refunds() });
    },
  });
};

// ─── Buyer Refund Report ──────────────────────────────────────────────────────

export const getAdminRefundReportOptions = (
  params: AdminRefundReportParams = {},
) =>
  queryOptions({
    queryKey: payoutQueryKey.refundList(params),
    queryFn: async () => {
      const res = await listRefundPayouts(params);
      return res;
    },
  });

export const useAdminRefundReport = (params: AdminRefundReportParams = {}) =>
  useQuery(getAdminRefundReportOptions(params));

// ─── Seller Payouts (manual records) ─────────────────────────────────────────

export const getAdminSellerPayoutsOptions = (
  params: AdminSellerPayoutListParams = {},
) =>
  queryOptions({
    queryKey: payoutQueryKey.sellerPayoutList(params),
    queryFn: async () => {
      const res = await listSellerPayouts(params);
      return res;
    },
  });

export const useAdminSellerPayouts = (
  params: AdminSellerPayoutListParams = {},
) => useQuery(getAdminSellerPayoutsOptions(params));

export const useCreateSellerPayout = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSellerPayoutPayload) =>
      createSellerPayout(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: payoutQueryKey.sellerPayouts(),
      });
      queryClient.invalidateQueries({ queryKey: payoutQueryKey.runs() });
    },
  });
};
