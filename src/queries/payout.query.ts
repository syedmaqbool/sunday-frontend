import type {
  AdminRefundReportParams,
  AdminSellerPayoutListParams,
  CreatePayoutRunPayload,
  CreateSellerPayoutPayload,
  EligibleSellerPayoutItemsParams,
  PayoutRunItemListParams,
  PayoutRunListParams,
  UpdatePayoutRunItemStatusPayload,
} from '@/types/payout.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createPayoutRun,
  createSellerPayout,
  listEligibleSellerPayoutItems,
  listPayoutRunItems,
  listPayoutRuns,
  listRefundPayouts,
  listSellerPayouts,
  updatePayoutRunItemStatus,
} from '@/services/payout.service';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const payoutQueryKey = {
  all: () => ['payouts'] as const,
  eligibleItemList: (parameters: EligibleSellerPayoutItemsParams) =>
    [...payoutQueryKey.eligibleItems(), 'list', parameters] as const,
  eligibleItems: () => [...payoutQueryKey.all(), 'eligible-items'] as const,
  refundList: (parameters: AdminRefundReportParams = {}) =>
    [...payoutQueryKey.refunds(), 'list', parameters] as const,
  refunds: () => [...payoutQueryKey.all(), 'refunds'] as const,
  runItems: (runId: string, parameters: PayoutRunItemListParams = {}) =>
    [...payoutQueryKey.runs(), runId, 'items', parameters] as const,
  runList: (parameters: PayoutRunListParams = {}) =>
    [...payoutQueryKey.runs(), 'list', parameters] as const,
  runs: () => [...payoutQueryKey.all(), 'runs'] as const,
  sellerPayoutList: (parameters: AdminSellerPayoutListParams = {}) =>
    [...payoutQueryKey.sellerPayouts(), 'list', parameters] as const,
  sellerPayouts: () => [...payoutQueryKey.all(), 'seller-payouts'] as const,
};

export function getEligibleSellerPayoutItemsOptions(
  parameters: EligibleSellerPayoutItemsParams,
) {
  return queryOptions({
    queryFn: () => listEligibleSellerPayoutItems(parameters),
    queryKey: payoutQueryKey.eligibleItemList(parameters),
  });
}

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

export function useCreatePayoutRunMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreatePayoutRunPayload) => createPayoutRun(payload),

    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: payoutQueryKey.eligibleItems() }),
        queryClient.invalidateQueries({ queryKey: payoutQueryKey.runs() }),
      ]);
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

export function useUpdatePayoutRunItemStatusMutation() {
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

export function useCreateSellerPayoutMutation() {
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
