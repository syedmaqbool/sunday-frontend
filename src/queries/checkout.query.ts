import type {
  CheckoutQuotePayload,
  CreateOrderPayload,
  ResubmitManualPaymentPayload,
} from '@/types/checkout.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceQueryKey } from '@/queries/marketplace.query';
import { myOrdersQueryKey } from '@/queries/myOrders.query';
import {
  cancelOrder,
  createOrder,
  getPaymentInstructions,
  quoteCheckout,
  resubmitManualPayment,
  uploadPaymentProof,
} from '@/services/checkout.service';

export const checkoutQueryKey = {
  all: () => ['checkout'] as const,
  paymentInstructions: () => [...checkoutQueryKey.all(), 'payment-instructions'] as const,
};

export function getPaymentInstructionsOptions() {
  return queryOptions({
    queryFn: () => getPaymentInstructions(),
    queryKey: checkoutQueryKey.paymentInstructions(),
  });
}

export function useCheckoutQuoteMutation() {
  return useMutation({
    mutationFn: (payload: CheckoutQuotePayload) => quoteCheckout(payload),
  });
}

export function useCreateCheckoutMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateOrderPayload) => createOrder(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myOrdersQueryKey.all() });
      queryClient.invalidateQueries({ queryKey: marketplaceQueryKey.all() });
    },
  });
}

export function useUploadPaymentProofMutation() {
  return useMutation({
    mutationFn: (file: File) => uploadPaymentProof(file),
  });
}

export function useCancelOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: (_response, orderId) => {
      queryClient.invalidateQueries({ queryKey: myOrdersQueryKey.all() });
      queryClient.invalidateQueries({ queryKey: myOrdersQueryKey.detail(orderId) });
      queryClient.invalidateQueries({ queryKey: marketplaceQueryKey.all() });
    },
  });
}

export function useResubmitManualPaymentMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      orderId,
      payload,
    }: {
      orderId: string;
      payload: ResubmitManualPaymentPayload;
    }) => resubmitManualPayment(orderId, payload),
    onSuccess: (_response, { orderId }) => {
      queryClient.invalidateQueries({ queryKey: myOrdersQueryKey.all() });
      queryClient.invalidateQueries({ queryKey: myOrdersQueryKey.detail(orderId) });
    },
  });
}
