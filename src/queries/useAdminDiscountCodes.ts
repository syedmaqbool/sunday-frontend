import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createDiscountCode,
  deleteDiscountCode,
  listDiscountCodes,
  updateDiscountCode,
} from "@/services/discountCode.service";
import type {
  CreateDiscountCodePayload,
  UpdateDiscountCodePayload,
} from "@/types/discount-code";

export const discountCodesQueryKey = {
  all: () => ["discount-codes"] as const,
  list: () => [...discountCodesQueryKey.all(), "list"] as const,
};

export const getDiscountCodesOptions = () =>
  queryOptions({
    queryKey: discountCodesQueryKey.list(),
    queryFn: async () => {
      const res = await listDiscountCodes();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useDiscountCodes = () => useQuery(getDiscountCodesOptions());

export const useCreateDiscountCode = () => {
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
    }) => updateDiscountCode(discountCodeId, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: discountCodesQueryKey.all(),
      });
    },
  });
};

export const useDeleteDiscountCode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (discountCodeId: string) => deleteDiscountCode(discountCodeId),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: discountCodesQueryKey.all(),
      });
    },
  });
};
