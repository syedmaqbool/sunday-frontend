import type { ApiRequestBody, ApiRequestQuery, ApiResponseData, ApiResponseItem } from './api.type';
import type {
  GetAdminOrderResponses,
  GetAdminOrdersData,
  GetAdminOrdersResponses,
  GetAdminReservedListingsData,
  GetAdminReservedListingsResponses,
  RejectAdminManualPaymentData,
} from '@/types/generated-api';

export type AdminOrder = ApiResponseItem<GetAdminOrdersResponses>;
export type AdminOrderDetail = ApiResponseData<GetAdminOrderResponses>;
export type AdminOrderItem = AdminOrder['items'][number];
export type AdminManualPaymentSubmission = AdminOrderDetail['manualPaymentSubmissions'][number];
export type AdminOrderItemStatus = AdminOrderItem['status'];
export type AdminOrderStatus = AdminOrder['status'];
export type AdminPaymentStatus = AdminOrder['paymentStatus'];
export type ManualPaymentSubmissionStatus = AdminManualPaymentSubmission['status'];
export type AdminOrderItemStatusCounts = AdminOrder['itemStatusCounts'];
export type ManualPaymentReviewPayload = ApiRequestBody<RejectAdminManualPaymentData>;
export type AdminOrderListParameters = ApiRequestQuery<GetAdminOrdersData>;
export type ReservedListingParameters = Partial<ApiRequestQuery<GetAdminReservedListingsData>>;
export type ReservedListing = ApiResponseItem<GetAdminReservedListingsResponses>;
