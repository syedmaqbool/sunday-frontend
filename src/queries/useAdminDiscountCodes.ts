import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  discountCodeService,
  type CreateDiscountCodePayload,
  type UpdateDiscountCodePayload,
} from "@/services/discountCode.service";

const DISCOUNT_CODES_KEY = ["discount-codes"];

export const useDiscountCodes = () =>
  useQuery({
    queryKey: DISCOUNT_CODES_KEY,
    queryFn: async () => {
      const res = await discountCodeService.list();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useCreateDiscountCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateDiscountCodePayload) =>
      discountCodeService.create(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: DISCOUNT_CODES_KEY,
      });
    },
  });
};

export const useUpdateDiscountCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      discountCodeId,
      payload,
    }: {
      discountCodeId: string;
      payload: UpdateDiscountCodePayload;
    }) =>
      discountCodeService.update(
        discountCodeId,
        payload
      ),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: DISCOUNT_CODES_KEY,
      });
    },
  });
};

export const useDeleteDiscountCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (discountCodeId: string) =>
      discountCodeService.delete(discountCodeId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: DISCOUNT_CODES_KEY,
      });
    },
  });
};
