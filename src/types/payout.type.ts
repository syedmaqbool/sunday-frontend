import type { ApiRequestBody, ApiRequestQuery, ApiResponseItem, ApiSuccessResponse } from './api.type';
import type {
  CreateAdminPayoutRunData,
  CreateSellerPayoutData,
  GetAdminBuyerRefundReportData,
  GetAdminEligibleSellerPayoutItemsData,
  GetAdminEligibleSellerPayoutItemsResponses,
  GetAdminPayoutRunItemsData,
  GetAdminPayoutRunItemsResponses,
  GetAdminPayoutRunsData,
  GetAdminPayoutRunsResponses,
  GetAdminPayoutsData,
  GetAdminPayoutsResponses,
  UpdateAdminPayoutRunItemStatusData,
} from '@/types/generated-api';

export type PayoutRun = ApiResponseItem<GetAdminPayoutRunsResponses>;
export type PayoutRunItem = ApiResponseItem<GetAdminPayoutRunItemsResponses>;
export type SellerPayout = ApiResponseItem<GetAdminPayoutsResponses>;
export type EligibleSellerPayoutItem = ApiResponseItem<GetAdminEligibleSellerPayoutItemsResponses>;
export type EligibleSellerPayoutItemsResponse = ApiSuccessResponse<GetAdminEligibleSellerPayoutItemsResponses>;
export type CreatePayoutRunPayload = ApiRequestBody<CreateAdminPayoutRunData>;
export type CreateSellerPayoutPayload = ApiRequestBody<CreateSellerPayoutData>;
export type UpdatePayoutRunItemStatusPayload = ApiRequestBody<UpdateAdminPayoutRunItemStatusData>;
export type PayoutRunListParams = Partial<ApiRequestQuery<GetAdminPayoutRunsData>>;
export type EligibleSellerPayoutItemsParams = ApiRequestQuery<GetAdminEligibleSellerPayoutItemsData>;
export type PayoutRunItemListParams = Partial<ApiRequestQuery<GetAdminPayoutRunItemsData>>;
export type AdminRefundReportParams = Partial<ApiRequestQuery<GetAdminBuyerRefundReportData>>;
export type AdminSellerPayoutListParams = Partial<ApiRequestQuery<GetAdminPayoutsData>>;
