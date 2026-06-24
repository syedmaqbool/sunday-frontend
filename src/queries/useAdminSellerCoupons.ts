import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createSellerCoupon,
  deleteSellerCoupon,
  listSellerCoupons,
  updateSellerCoupon,
} from "@/services/sellerCoupon.service";
import type {
  CreateSellerCouponPayload,
  UpdateSellerCouponPayload,
} from "@/types/seller-coupon";

export const sellerCouponsQueryKey = {
  all: () => ["seller-coupons"] as const,
  list: () => [...sellerCouponsQueryKey.all(), "list"] as const,
};

export const getSellerCouponsOptions = () =>
  queryOptions({
    queryKey: sellerCouponsQueryKey.list(),
    queryFn: async () => {
      const res = await listSellerCoupons();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useSellerCoupons = () => useQuery(getSellerCouponsOptions());

export const useCreateSellerCoupon = () => {
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
};

export const useUpdateSellerCoupon = () => {
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
};

export const useDeleteSellerCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSellerCoupon(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: sellerCouponsQueryKey.all(),
      });
    },
  });
};
