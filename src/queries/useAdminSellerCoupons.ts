import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  sellerCouponService,
  type CreateSellerCouponPayload,
  type UpdateSellerCouponPayload,
} from "@/services/sellerCoupon.service";

const SELLER_COUPONS_KEY = ["seller-coupons"];

export const useSellerCoupons = () =>
  useQuery({
    queryKey: SELLER_COUPONS_KEY,
    queryFn: async () => {
      const res = await sellerCouponService.list();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

export const useCreateSellerCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateSellerCouponPayload) =>
      sellerCouponService.create(payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: SELLER_COUPONS_KEY,
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
    }) =>
      sellerCouponService.update(id, payload),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: SELLER_COUPONS_KEY,
      });
    },
  });
};

export const useDeleteSellerCoupon = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      sellerCouponService.delete(id),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: SELLER_COUPONS_KEY,
      });
    },
  });
};

