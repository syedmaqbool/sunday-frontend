import type {
  CreateSellerCouponPayload,
  UpdateSellerCouponPayload,
} from '@/types/seller-coupon';
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createSellerCoupon,
  deleteSellerCoupon,
  listSellerCoupons,
  updateSellerCoupon,
} from '@/services/sellerCoupon.service';

export const sellerCouponsQueryKey = {
  all: () => ['seller-coupons'] as const,
  list: () => [...sellerCouponsQueryKey.all(), 'list'] as const,
};

export function getSellerCouponsOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await listSellerCoupons();
      return response.data;
    },
    queryKey: sellerCouponsQueryKey.list(),
    staleTime: 5 * 60 * 1000,
  });
}

export const useSellerCoupons = () => useQuery(getSellerCouponsOptions());

export function useCreateSellerCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSellerCouponPayload) =>
      createSellerCoupon(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sellerCouponsQueryKey.all(),
      });
    },
  });
}

export function useUpdateSellerCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateSellerCouponPayload;
    }) => updateSellerCoupon(id, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sellerCouponsQueryKey.all(),
      });
    },
  });
}

export function useDeleteSellerCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSellerCoupon(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sellerCouponsQueryKey.all(),
      });
    },
  });
}
