import type {
  CreateDiscountCodePayload,
  UpdateDiscountCodePayload,
} from '@/types/discountCode.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createDiscountCode,
  deleteDiscountCode,
  listDiscountCodes,
  updateDiscountCode,
} from '@/services/discountCode.service';

export const discountCodesQueryKey = {
  all: () => ['discount-codes'] as const,
  list: () => [...discountCodesQueryKey.all(), 'list'] as const,
};

export function getDiscountCodesOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await listDiscountCodes();
      return response.data;
    },
    queryKey: discountCodesQueryKey.list(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateDiscountCodeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDiscountCodePayload) =>
      createDiscountCode(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: discountCodesQueryKey.all(),
      });
    },
  });
}

export function useUpdateDiscountCodeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      discountCodeId,
      payload,
    }: {
      discountCodeId: string;
      payload: UpdateDiscountCodePayload;
    }) => updateDiscountCode(discountCodeId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: discountCodesQueryKey.all(),
      });
    },
  });
}

export function useDeleteDiscountCodeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (discountCodeId: string) => deleteDiscountCode(discountCodeId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: discountCodesQueryKey.all(),
      });
    },
  });
}

