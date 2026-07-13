import type {
  CreateOrderPayload,
  ValidateDiscountPayload,
} from '@/types/checkout.type';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceQueryKey } from '@/queries/marketplace.query';
import { myOrdersQueryKey } from '@/queries/myOrders.query';
import {
  createOrder,
  retryPayFastOrder,
  validateDiscount,
  validateSellerCoupon,
} from '@/services/checkout.service';

export const checkoutQueryKey = {
  all: () => ['checkout'] as const,
};

export function useValidateDiscountMutation() {
  return useMutation({
    mutationFn: (payload: ValidateDiscountPayload) => validateDiscount(payload),
  });
}

export function useValidateSellerCouponMutation() {
  return useMutation({
    mutationFn: (payload: ValidateDiscountPayload) => validateSellerCoupon(payload),
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

export function useRetryPayFastOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: string) => retryPayFastOrder(orderId),
    onSuccess: (_response, orderId) => {
      queryClient.invalidateQueries({ queryKey: myOrdersQueryKey.all() });
      queryClient.invalidateQueries({ queryKey: myOrdersQueryKey.detail(orderId) });
    },
  });
}
