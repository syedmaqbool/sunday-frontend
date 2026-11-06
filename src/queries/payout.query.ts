import type {
  AdminBuyerRefundsParams,
  AdminPayoutTransactionListParams,
  RecordAdminSellerPaymentPayload,
  SellerPayoutSummaryListParams,
  SellerPaymentListParams,
} from '@/types/payout.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAdminSellerPayable,
  listAdminBuyerRefunds,
  listAdminPayoutSellers,
  listAdminSellerPayments,
  getAdminSellerPayment,
  listAdminPayoutTransactions,
  recordAdminSellerPayment,
} from '@/services/payout.service';

// ─── Query keys ───────────────────────────────────────────────────────────────

export const payoutQueryKey = {
  all: () => ['payouts'] as const,
  buyerRefundList: (parameters: AdminBuyerRefundsParams) =>
    [...payoutQueryKey.buyerRefunds(), 'list', parameters] as const,
  buyerRefunds: () => [...payoutQueryKey.all(), 'buyer-refunds'] as const,
  sellerPayable: (sellerId: string) =>
    [...payoutQueryKey.all(), 'seller-payable', 'detail', sellerId] as const,
  sellerSummaryList: (parameters: SellerPayoutSummaryListParams) =>
    [...payoutQueryKey.sellerSummaries(), 'list', parameters] as const,
  sellerSummaries: () => [...payoutQueryKey.all(), 'seller-summaries'] as const,
  sellerPayments: () => [...payoutQueryKey.all(), 'seller-payments'] as const,
  sellerPaymentList: (parameters: SellerPaymentListParams) =>
    [...payoutQueryKey.sellerPayments(), 'list', parameters] as const,
  sellerPaymentDetail: (paymentId: string) =>
    [...payoutQueryKey.sellerPayments(), 'detail', paymentId] as const,
  transactions: () => [...payoutQueryKey.all(), 'transactions'] as const,
  transactionList: (parameters: AdminPayoutTransactionListParams) =>
    [...payoutQueryKey.transactions(), 'list', parameters] as const,
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

export function getAdminSellerPaymentOptions(paymentId: string) {
  return queryOptions({
    enabled: Boolean(paymentId),
    queryFn: () => getAdminSellerPayment(paymentId),
    queryKey: payoutQueryKey.sellerPaymentDetail(paymentId),
  });
}

export function getAdminPayoutTransactionsOptions(parameters: AdminPayoutTransactionListParams) {
  return queryOptions({
    queryFn: () => listAdminPayoutTransactions(parameters),
    queryKey: payoutQueryKey.transactionList(parameters),
  });
}

export function getAdminBuyerRefundsOptions(parameters: AdminBuyerRefundsParams) {
  return queryOptions({
    queryFn: () => listAdminBuyerRefunds(parameters),
    queryKey: payoutQueryKey.buyerRefundList(parameters),
  });
}
