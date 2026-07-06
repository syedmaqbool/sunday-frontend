import { queryOptions } from '@tanstack/react-query';
import {
  listAdminOrders,
  listReservedListings,
} from '@/services/adminOrders.service';

export const adminOrdersQueryKey = {
  all: () => ['admin-orders'] as const,
  orders: () => [...adminOrdersQueryKey.all(), 'orders', 'list'] as const,
  reservedListings: () =>
    [...adminOrdersQueryKey.all(), 'reserved-listings', 'list'] as const,
};

export function getAdminOrdersOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await listAdminOrders({
        size: 100,
        sortOrder: 'desc',
        sortBy: 'createdAt',
      });
      return response.data;
    },
    queryKey: adminOrdersQueryKey.orders(),
  });
}

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
