import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  listOrders,
  listSales,
  updateItemStatus,
} from "@/services/myorders.service";

export const myOrdersQueryKey = {
  all: () => ["my-orders"] as const,
  list: () => [...myOrdersQueryKey.all(), "list"] as const,
  sales: () => ["my-sales", "list"] as const,
};

export const getMyOrdersOptions = () =>
  queryOptions({
    queryKey: myOrdersQueryKey.list(),
    queryFn: async () => {
      const res = await listOrders();
      return res.data;
    },
  });

export const getMySalesOptions = () =>
  queryOptions({
    queryKey: myOrdersQueryKey.sales(),
    queryFn: async () => {
      const res = await listSales();
      return res.data;
    },
  });

export const useMyOrders = () => useQuery(getMyOrdersOptions());

export const useMySales = () => useQuery(getMySalesOptions());

export const useUpdateOrderItemStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      orderItemId,
      payload,
    }: {
      orderId: string;
      orderItemId: string;
      payload: {
        status: "SHIPPED" | "DELIVERED";
        shippingMethod?: string;
        trackingNumber?: string;
        expectedDelivery?: string;
      };
    }) => updateItemStatus(orderId, orderItemId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: myOrdersQueryKey.all() });
      qc.invalidateQueries({ queryKey: myOrdersQueryKey.sales() });
    },
  });
};
