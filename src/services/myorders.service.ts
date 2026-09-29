import type {
  Order,
  Sale,
  UpdateOrderItemStatusPayload,
  UploadShippingProofPayload,
} from '@/types/order.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listOrders() {
  return authInstance
    .get('/api/v1/me/orders', { searchParams: { size: 100 } })
    .json<PaginatedResponse<Order>>();
}

export function getOrder(orderId: string) {
  return authInstance
    .get(`/api/v1/me/orders/${orderId}`)
    .json<Response<Order>>();
}

export function listSales() {
  return authInstance
    .get('/api/v1/me/sales', { searchParams: { size: 100 } })
    .json<PaginatedResponse<Sale>>();
}

export function updateItemStatus(
  orderId: string,
  orderItemId: string,
  payload: UpdateOrderItemStatusPayload,
) {
  return authInstance
    .patch(`/api/v1/orders/${orderId}/items/${orderItemId}/status`, {
      json: payload,
    })
    .json<Response>();
}

export function uploadShippingProof(
  orderId: string,
  orderItemId: string,
  proofImageUrl: UploadShippingProofPayload['proofImageUrl'],
) {
  return authInstance
    .post(`/api/v1/orders/${orderId}/items/${orderItemId}/shipping-proof`, {
      json: { proofImageUrl } satisfies UploadShippingProofPayload,
    })
    .json<Response>();
}
