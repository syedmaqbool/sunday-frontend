import { queryOptions } from '@tanstack/react-query';
import {
  getOrderItemComplaint,
  listComplaintsAgainstMe,
  listMyRefundComplaints,
} from '@/services/complaints.service';
import { getOrder } from '@/services/myOrders.service';

export const complaintsQueryKey = {
  againstMe: () => [...complaintsQueryKey.all(), 'against-me', 'list'] as const,
  all: () => ['complaints'] as const,
  detail: (orderId: string, orderItemId: string) =>
    [...complaintsQueryKey.all(), 'detail', orderId, orderItemId] as const,
  myRefunds: () => [...complaintsQueryKey.all(), 'my-refunds', 'list'] as const,
  orderShipment: (orderId: string, orderItemId: string) =>
    [...complaintsQueryKey.all(), 'order-shipment', 'detail', orderId, orderItemId] as const,
};

export interface OrderShipmentInfo {
  expectedDelivery?: string | null;
  shippedAt?: string | null;
}

export function getMyRefundComplaintsOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await listMyRefundComplaints();
      return response.data;
    },
    queryKey: complaintsQueryKey.myRefunds(),
  });
}

export function getComplaintsAgainstMeOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await listComplaintsAgainstMe();
      return response.data;
    },
    queryKey: complaintsQueryKey.againstMe(),
  });
}

export function getComplaintDetailsOptions(
  orderId: string,
  orderItemId: string,
) {
  return queryOptions({
    queryFn: async () => {
      const response = await getOrderItemComplaint(orderId, orderItemId);
      return response?.data ?? null;
    },
    queryKey: complaintsQueryKey.detail(orderId, orderItemId),
  });
}

export function getOrderShipmentOptions(orderId: string, orderItemId: string) {
  return queryOptions({
    queryFn: async () => {
      const response = await getOrder(orderId);
      const item = response.data.items.find(item => item.id === orderItemId);

      if (!item) {
        return null;
      }

      return {
        expectedDelivery: item.expectedDelivery,
        shippedAt: item.shippedAt,
      } satisfies OrderShipmentInfo;
    },
    queryKey: complaintsQueryKey.orderShipment(orderId, orderItemId),
  });
}
