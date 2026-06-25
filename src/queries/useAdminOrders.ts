import { queryOptions, useQuery } from '@tanstack/react-query';
import {
  listAdminOrders,
  listReservedListings,
} from '@/services/adminOrders.service';

export const adminOrdersQueryKey = {
  orders: () => ['admin-orders'] as const,
  reservedListings: () => ['admin-reserved-listings'] as const,
};

export function getAdminOrdersOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await listAdminOrders({
        size: 100,
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });
      return response.data;
    },
    queryKey: adminOrdersQueryKey.orders(),
  });
}

export const useAdminOrders = () => useQuery(getAdminOrdersOptions());

export function getAdminReservedListingsOptions(isEnabled: boolean) {
  return queryOptions({
    enabled: isEnabled,
    queryFn: async () => {
      const response = await listReservedListings({ size: 100 });
      return response.data;
    },
    queryKey: adminOrdersQueryKey.reservedListings(),
  });
}

export function useAdminReservedListings(isEnabled: boolean) {
  return useQuery(getAdminReservedListingsOptions(isEnabled));
}
