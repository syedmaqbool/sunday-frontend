import type {
  AdminOrderListParameters,
  ManualPaymentReviewPayload,
} from '@/types/adminOrder.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  approveAdminManualPayment,
  getAdminOrder,
  getPaymentProofFile,
  listAdminOrders,
  listReservedListings,
  rejectAdminManualPayment,
  requestAdminManualPaymentResubmission,
} from '@/services/adminOrders.service';

export const adminOrdersQueryKey = {
  all: () => ['admin-orders'] as const,
  detail: (orderId: string) =>
    [...adminOrdersQueryKey.all(), 'orders', 'detail', orderId] as const,
  orders: (parameters: AdminOrderListParameters = {}) =>
    [...adminOrdersQueryKey.all(), 'orders', 'list', parameters] as const,
  proof: (fileId: string) =>
    [...adminOrdersQueryKey.all(), 'payment-proof', 'detail', fileId] as const,
  reservedListings: () =>
    [...adminOrdersQueryKey.all(), 'reserved-listings', 'list'] as const,
};

export function getAdminOrdersOptions(
  parameters: AdminOrderListParameters = {},
) {
  return queryOptions({
    queryFn: () => listAdminOrders(parameters),
    queryKey: adminOrdersQueryKey.orders(parameters),
  });
}

export function getAdminOrderOptions(orderId: string, isEnabled = true) {
  return queryOptions({
    enabled: isEnabled,
    queryFn: () => getAdminOrder(orderId),
    queryKey: adminOrdersQueryKey.detail(orderId),
  });
}

export function getAdminPaymentProofOptions(fileId: string | undefined) {
  return queryOptions({
    enabled: Boolean(fileId),
    queryFn: () => getPaymentProofFile(fileId!),
    queryKey: adminOrdersQueryKey.proof(fileId ?? 'missing'),
    retry: false,
  });
}

export function getAdminReservedListingsOptions(isEnabled: boolean) {
  return queryOptions({
    enabled: isEnabled,
    queryFn: () => listReservedListings({ size: 100 }),
    queryKey: adminOrdersQueryKey.reservedListings(),
  });
}

async function invalidateAdminOrderQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  orderId: string,
) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: adminOrdersQueryKey.all() }),
    queryClient.invalidateQueries({ queryKey: adminOrdersQueryKey.detail(orderId) }),
  ]);
}

export function useApproveAdminManualPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: approveAdminManualPayment,
    onSuccess: (_response, orderId) => invalidateAdminOrderQueries(queryClient, orderId),
  });
}

export function useRejectAdminManualPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: ManualPaymentReviewPayload }) =>
      rejectAdminManualPayment(orderId, payload),
    onSuccess: (_response, { orderId }) => invalidateAdminOrderQueries(queryClient, orderId),
  });
}

export function useRequestAdminManualPaymentResubmissionMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: ManualPaymentReviewPayload }) =>
      requestAdminManualPaymentResubmission(orderId, payload),
    onSuccess: (_response, { orderId }) => invalidateAdminOrderQueries(queryClient, orderId),
  });
}
