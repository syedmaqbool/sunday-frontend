import { queryOptions, useQuery } from "@tanstack/react-query";
import {
  listAdminOrders,
  listReservedListings,
} from "@/services/adminOrders.service";

export const adminOrdersQueryKey = {
  orders: () => ["admin-orders"] as const,
  reservedListings: () => ["admin-reserved-listings"] as const,
};

export const getAdminOrdersOptions = () =>
  queryOptions({
    queryKey: adminOrdersQueryKey.orders(),
    queryFn: async () => {
      const res = await listAdminOrders({
        size: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      return res.data;
    },
  });

export const useAdminOrders = () => useQuery(getAdminOrdersOptions());

export const getAdminReservedListingsOptions = (enabled: boolean) =>
  queryOptions({
    queryKey: adminOrdersQueryKey.reservedListings(),
    queryFn: async () => {
      const res = await listReservedListings({ size: 100 });
      return res.data;
    },
    enabled,
  });

export const useAdminReservedListings = (enabled: boolean) =>
  useQuery(getAdminReservedListingsOptions(enabled));
