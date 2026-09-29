import type { AdminUser } from '@/types/adminUser.type';
import type { GetPublicListingsData } from '@/types/generated-api';
import type { MarketplaceListing } from '@/types/marketplace.type';
import type { PaginatedResponse } from '@/types/response.type';
import type {
  CreateSellerCouponPayload,
  UpdateSellerCouponPayload,
} from '@/types/sellerCoupon.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { authInstance } from '@/services/ky.instance';
import {
  createSellerCoupon,
  deleteSellerCoupon,
  listSellerCoupons,
  updateSellerCoupon,
} from '@/services/sellerCoupon.service';

export const sellerCouponsQueryKey = {
  adminUsers: () => ['admin-users-list'] as const,
  all: () => ['seller-coupons'] as const,
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
      authInstance.get('/api/v1/admin/users?size=100').json<PaginatedResponse<AdminUser>>(),
    queryKey: sellerCouponsQueryKey.adminUsers(),
  });
}

export function getAdminSellerListingsOptions(
  sellerId?: string,
  enabled = false,
) {
  return queryOptions({
    enabled,
    queryFn: () => {
      const parameters: GetPublicListingsData['query'] = {
        sellerId,
        page: 1,
        size: 100,
        status: 'APPROVED',
      };

      return authInstance
        .get('/api/v1/listings', { searchParams: parameters })
        .json<PaginatedResponse<MarketplaceListing>>();
    },
    queryKey: sellerCouponsQueryKey.sellerListings(sellerId),
  });
}

export function useCreateSellerCouponMutation() {
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

export function useUpdateSellerCouponMutation() {
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

export function useDeleteSellerCouponMutation() {
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
