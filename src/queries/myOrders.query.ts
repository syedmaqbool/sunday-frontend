import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOrder,
  listOrders,
  listSales,
  updateItemStatus,
} from '@/services/myOrders.service';

export const myOrdersQueryKey = {
  all: () => ['my-orders'] as const,
  detail: (orderId: string) => [...myOrdersQueryKey.all(), 'detail', orderId] as const,
  list: () => [...myOrdersQueryKey.all(), 'list'] as const,
  sales: () => ['my-sales', 'list'] as const,
};

export function getMyOrdersOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await listOrders();
      return response.data;
    },
    queryKey: myOrdersQueryKey.list(),
  });
}

export function getMyOrderOptions(orderId: string) {
  return queryOptions({
    queryFn: async () => {
      const response = await getOrder(orderId);
      return response.data;
    },
    queryKey: myOrdersQueryKey.detail(orderId),
  });
}

export function getMySalesOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await listSales();
      return response.data;
    },
    queryKey: myOrdersQueryKey.sales(),
  });
}

export function useUpdateOrderItemStatusMutation() {
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
        expectedDelivery?: string;
        shippingMethod?: string;
        status: 'DELIVERED' | 'SHIPPED';
        trackingNumber?: string;
      };
    }) => updateItemStatus(orderId, orderItemId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: myOrdersQueryKey.all() });
      qc.invalidateQueries({ queryKey: myOrdersQueryKey.sales() });
    },
  });
}
