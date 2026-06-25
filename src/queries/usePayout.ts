import type {
  AdminRefundReportParams,
  AdminSellerPayoutListParams,
  CreatePayoutRunPayload,
  CreateSellerPayoutPayload,
  PayoutRunItemListParams,
  PayoutRunListParams,
  UpdatePayoutRunItemStatusPayload,
} from '@/types/payout';
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createPayoutRun,
  createSellerPayout,
  listPayoutRunItems,
  listPayoutRuns,
  listRefundPayouts,
  listSellerPayouts,
  updatePayoutRunItemStatus,
} from '@/services/payout.service';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const payoutQueryKey = {
  refundList: (parameters: AdminRefundReportParams = {}) =>
    [...payoutQueryKey.refunds(), 'list', parameters] as const,
  refunds: () => ['payout-refunds'] as const,
  runItems: (runId: string, parameters: PayoutRunItemListParams = {}) =>
    [...payoutQueryKey.runs(), runId, 'items', parameters] as const,
  runList: (parameters: PayoutRunListParams = {}) =>
    [...payoutQueryKey.runs(), 'list', parameters] as const,
  runs: () => ['payout-runs'] as const,
  sellerPayoutList: (parameters: AdminSellerPayoutListParams = {}) =>
    [...payoutQueryKey.sellerPayouts(), 'list', parameters] as const,
  sellerPayouts: () => ['admin-seller-payouts'] as const,
};

// ─── Payout Runs ──────────────────────────────────────────────────────────────

export function getPayoutRunsOptions(parameters: PayoutRunListParams = {}) {
  return queryOptions({
    queryFn: async () => {
      const response = await listPayoutRuns(parameters);
      return response;
    },
    queryKey: payoutQueryKey.runList(parameters),
  });
}

export function useCreatePayoutRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePayoutRunPayload) => createPayoutRun(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: payoutQueryKey.runs() });
    },
  });
}

// ─── Payout Run Items ─────────────────────────────────────────────────────────

export function getPayoutRunItemsOptions(runId: string, parameters: PayoutRunItemListParams = {}) {
  return queryOptions({
    enabled: Boolean(runId),
    queryFn: async () => {
      const response = await listPayoutRunItems(runId, parameters);
      return response;
    },
    queryKey: payoutQueryKey.runItems(runId, parameters),
  });
}

export function useUpdatePayoutRunItemStatus() {
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
}

// ─── Buyer Refund Report ──────────────────────────────────────────────────────

export function getAdminRefundReportOptions(parameters: AdminRefundReportParams = {}) {
  return queryOptions({
    queryFn: async () => {
      const response = await listRefundPayouts(parameters);
      return response;
    },
    queryKey: payoutQueryKey.refundList(parameters),
  });
}

// ─── Seller Payouts (manual records) ─────────────────────────────────────────

export function getAdminSellerPayoutsOptions(parameters: AdminSellerPayoutListParams = {}) {
  return queryOptions({
    queryFn: async () => {
      const response = await listSellerPayouts(parameters);
      return response;
    },
    queryKey: payoutQueryKey.sellerPayoutList(parameters),
  });
}

export function useCreateSellerPayout() {
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
}
