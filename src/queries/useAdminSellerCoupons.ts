import type {
  CreateSellerCouponPayload,
  UpdateSellerCouponPayload,
} from '@/types/seller-coupon';
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createSellerCoupon,
  deleteSellerCoupon,
  listSellerCoupons,
  updateSellerCoupon,
} from '@/services/sellerCoupon.service';
import { authInstance } from '@/services/ky.instance';

export const sellerCouponsQueryKey = {
  all: () => ['seller-coupons'] as const,
  adminUsers: () => ['admin-users-list'] as const,
  list: () => [...sellerCouponsQueryKey.all(), 'list'] as const,
  sellerListings: (sellerId?: string) => ['seller-listings', sellerId] as const,
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

export function getAdminUsersListOptions() {
  return queryOptions({
    queryFn: () =>
      authInstance.get('/api/v1/admin/users?size=100').json<{ data: any[] }>(),
    queryKey: sellerCouponsQueryKey.adminUsers(),
  });
}

export function getAdminSellerListingsOptions(
  sellerId?: string,
  enabled = false,
) {
  return queryOptions({
    enabled,
    queryFn: () =>
      authInstance
        .get(`/api/v1/listings?sellerId=${sellerId}&status=approved&size=100`)
        .json<{ data: any[] }>(),
    queryKey: sellerCouponsQueryKey.sellerListings(sellerId),
  });
}

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
