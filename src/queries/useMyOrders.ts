import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { myOrdersService } from "@/services/myorders.service";

const ORDERS_KEY = ["my-orders"];
const SALES_KEY  = ["my-sales"];

export const useMyOrders = () =>
  useQuery({
    queryKey: ORDERS_KEY,
    queryFn: async () => {
      const res = await myOrdersService.listOrders();
      return res.data;
    },
  });

export const useMySales = () =>
  useQuery({
    queryKey: SALES_KEY,
    queryFn: async () => {
      const res = await myOrdersService.listSales();
      return res.data;
    },
  });

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
    }) => myOrdersService.updateItemStatus(orderId, orderItemId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ORDERS_KEY });
      qc.invalidateQueries({ queryKey: SALES_KEY });
    },
  });
};