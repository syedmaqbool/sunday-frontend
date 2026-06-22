import { useQuery } from "@tanstack/react-query";
import { adminOrdersService } from "@/services/adminOrders.service";

export const useAdminOrders = () =>
  useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const res = await adminOrdersService.list({
        size: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
      });
      return res.data;
    },
  });

export const useAdminReservedListings = (enabled: boolean) =>
  useQuery({
    queryKey: ["admin-reserved-listings"],
    queryFn: async () => {
      const res = await adminOrdersService.reservedListings({ size: 100 });
      return res.data;
    },
    enabled,
  });