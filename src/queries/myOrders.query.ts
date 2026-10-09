import type { UpdateOrderItemStatusPayload } from '@/types/order.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOrder,
  listOrders,
  listSales,
  updateItemStatus,
} from '@/services/myorders.service';

export const myOrdersQueryKey = {
  all: () => ['my-orders'] as const,
  detail: (orderId: string) => [...myOrdersQueryKey.all(), 'detail', orderId] as const,
  list: () => [...myOrdersQueryKey.all(), 'list'] as const,
  sales: () => [...myOrdersQueryKey.all(), 'sales', 'list'] as const,
  salesOrder: (orderId: string, orderItemId?: string) =>
    [...myOrdersQueryKey.all(), 'sales', 'order', orderId, orderItemId ?? null] as const,
};

export function getMyOrdersOptions(enabled = true) {
  return queryOptions({
    enabled,
    queryFn: async () => {
      return listOrders();
    },
    queryKey: myOrdersQueryKey.list(),
  });
}

export function getMyOrderOptions(orderId: string) {
  return queryOptions({
    queryFn: async () => {
      return getOrder(orderId);
    },
    queryKey: myOrdersQueryKey.detail(orderId),
  });
}

export function getMySalesOptions() {
  return queryOptions({
    queryFn: async () => {
      return listSales();
    },
    queryKey: myOrdersQueryKey.sales(),
  });
}

export function getMySalesOrderOptions(orderId: string, orderItemId?: string) {
  return queryOptions({
    enabled: Boolean(orderId),
    queryFn: async () => {
      let page = 1;
      let response = await listSales(page);

      while (
        page < response.pagination.lastPage
        && response.data.every(item => !(item.orderId === orderId && (!orderItemId || item.id === orderItemId)))
      ) {
        response = await listSales(++page);
      }

      return response;
    },
    queryKey: myOrdersQueryKey.salesOrder(orderId, orderItemId),
    retry: false,
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
      payload: UpdateOrderItemStatusPayload;
    }) => updateItemStatus(orderId, orderItemId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: myOrdersQueryKey.all() });
      qc.invalidateQueries({ queryKey: myOrdersQueryKey.sales() });
    },
  });
}
