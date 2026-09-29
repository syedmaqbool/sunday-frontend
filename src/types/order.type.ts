import type { ApiRequestBody, ApiResponseItem } from './api.type';
import type {
  GetMyOrdersResponses,
  GetMySalesResponses,
  UpdateOrderItemStatusData,
  UploadOrderItemShippingProofData,
} from '@/types/generated-api';

export type Order = ApiResponseItem<GetMyOrdersResponses>;
export type OrderItem = Order['items'][number];
export type OrderShipmentInfo = Pick<OrderItem, 'expectedDelivery' | 'shippedAt'>;
export type Sale = ApiResponseItem<GetMySalesResponses>;
export type ManualPaymentSubmission = NonNullable<Order['manualPaymentSubmission']>;
export type ManualPaymentSubmissionStatus = ManualPaymentSubmission['status'];
export type UpdateOrderItemStatusPayload = ApiRequestBody<UpdateOrderItemStatusData>;
export type UploadShippingProofPayload = ApiRequestBody<UploadOrderItemShippingProofData>;
