import type {
  AdminBuyerRefundsParams,
  AdminRefundReportParams,
  AdminSellerPayoutListParams,
  CreatePayoutRunPayload,
  CreateSellerPayoutPayload,
  EligibleSellerPayoutItemsParams,
  PayoutRunItemListParams,
  PayoutRunListParams,
  RecordAdminSellerPaymentPayload,
  RecordSellerPayoutCyclePaymentPayload,
  SellerPayoutSummaryListParams,
  SellerPaymentListParams,
} from '@/types/payout.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createPayoutRun,
  createSellerPayout,
  getAdminSellerPayable,
  listEligibleSellerPayoutItems,
  listAdminBuyerRefunds,
  listPayoutRunItems,
  listPayoutRuns,
  listRefundPayouts,
  listAdminPayoutSellers,
  listAdminSellerPayments,
  listSellerPayouts,
  recordSellerPayoutCyclePayment,
  recordAdminSellerPayment,
} from '@/services/payout.service';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const payoutQueryKey = {
  all: () => ['payouts'] as const,
  buyerRefundList: (parameters: AdminBuyerRefundsParams) =>
    [...payoutQueryKey.buyerRefunds(), 'list', parameters] as const,
  buyerRefunds: () => [...payoutQueryKey.all(), 'buyer-refunds'] as const,
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
  sellerPayable: (sellerId: string) =>
    [...payoutQueryKey.all(), 'seller-payable', 'detail', sellerId] as const,
  sellerSummaryList: (parameters: SellerPayoutSummaryListParams) =>
    [...payoutQueryKey.sellerSummaries(), 'list', parameters] as const,
  sellerSummaries: () => [...payoutQueryKey.all(), 'seller-summaries'] as const,
  sellerPayments: () => [...payoutQueryKey.all(), 'seller-payments'] as const,
  sellerPaymentList: (parameters: SellerPaymentListParams) =>
    [...payoutQueryKey.sellerPayments(), 'list', parameters] as const,
};

export function getAdminSellerPayableOptions(sellerId: string) {
  return queryOptions({
    enabled: Boolean(sellerId),
    queryFn: () => getAdminSellerPayable(sellerId),
    queryKey: payoutQueryKey.sellerPayable(sellerId),
  });
}

export function useRecordAdminSellerPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      sellerId,
    }: {
      payload: RecordAdminSellerPaymentPayload;
      sellerId: string;
    }) => recordAdminSellerPayment(sellerId, payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: payoutQueryKey.all() });
    },
  });
}

export function getAdminPayoutSellerSummariesOptions(parameters: SellerPayoutSummaryListParams) {
  return queryOptions({
    queryFn: () => listAdminPayoutSellers(parameters),
    queryKey: payoutQueryKey.sellerSummaryList(parameters),
  });
}

export function getAdminSellerPaymentsOptions(parameters: SellerPaymentListParams) {
  return queryOptions({
    queryFn: () => listAdminSellerPayments(parameters),
    queryKey: payoutQueryKey.sellerPaymentList(parameters),
  });
}

export function getEligibleSellerPayoutItemsOptions(parameters: EligibleSellerPayoutItemsParams) {
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

export function useRecordSellerPayoutCyclePaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      runId,
      sellerId,
    }: {
      payload: RecordSellerPayoutCyclePaymentPayload;
      runId: string;
      sellerId: string;
    }) => recordSellerPayoutCyclePayment(runId, sellerId, payload),

    onSuccess: async (_response, { runId }) => {
      await queryClient.invalidateQueries({ queryKey: payoutQueryKey.runItems(runId) });
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

export function getAdminBuyerRefundsOptions(parameters: AdminBuyerRefundsParams) {
  return queryOptions({
    queryFn: () => listAdminBuyerRefunds(parameters),
    queryKey: payoutQueryKey.buyerRefundList(parameters),
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
    mutationFn: (payload: CreateSellerPayoutPayload) => createSellerPayout(payload),

    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: payoutQueryKey.sellerPayouts(),
      });
      void queryClient.invalidateQueries({ queryKey: payoutQueryKey.runs() });
    },
  });
}
