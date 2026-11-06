import type {
  ApiRequestBody,
  ApiRequestQuery,
  ApiResponseItem,
  ApiSuccessResponse,
} from './api.type';
import type {
  CreateAdminPayoutRunData,
  CreateSellerPayoutData,
  GetAdminBuyerRefundReportData,
  GetAdminBuyerRefundsData,
  GetAdminBuyerRefundsResponses,
  GetAdminEligibleSellerPayoutItemsData,
  GetAdminEligibleSellerPayoutItemsResponses,
  GetAdminPayoutRunItemsData,
  GetAdminPayoutRunItemsResponses,
  GetAdminPayoutRunsData,
  GetAdminPayoutRunsResponses,
  GetAdminPayoutsData,
  GetAdminPayoutsResponses,
  GetAdminPayoutSellersData,
  GetAdminPayoutSellersResponses,
  GetAdminSellerPaymentsData,
  GetAdminSellerPaymentsResponses,
  GetAdminSellerPaymentResponses,
  GetAdminSellerPayableResponses,
  RecordAdminSellerPaymentData,
  RecordAdminSellerPaymentErrors,
  RecordAdminSellerPaymentResponses,
  RecordAdminSellerPayoutCyclePaymentData,
  RecordAdminSellerPayoutCyclePaymentResponses,
} from '@/types/generated-api';

export type PayoutRun = ApiResponseItem<GetAdminPayoutRunsResponses>;
export type PayoutRunItem = ApiResponseItem<GetAdminPayoutRunItemsResponses>;
export type AdminBuyerRefundsResponse = ApiSuccessResponse<GetAdminBuyerRefundsResponses>;
export type SellerPayout = ApiResponseItem<GetAdminPayoutsResponses>;
export type SellerPayoutSummaryResponse = ApiSuccessResponse<GetAdminPayoutSellersResponses>;
export type SellerPayoutReviewReason = NonNullable<
  ApiResponseItem<GetAdminPayoutSellersResponses>['reviewReason']
>;
export type SellerPayment = ApiResponseItem<GetAdminSellerPaymentsResponses>;
export type SellerPaymentDetailResponse = ApiSuccessResponse<GetAdminSellerPaymentResponses>;
export type SellerPaymentListParams = ApiRequestQuery<GetAdminSellerPaymentsData>;
export type SellerPayablePreviewResponse = ApiSuccessResponse<GetAdminSellerPayableResponses>;
export type EligibleSellerPayoutItem = ApiResponseItem<GetAdminEligibleSellerPayoutItemsResponses>;
export type EligibleSellerPayoutItemsResponse =
  ApiSuccessResponse<GetAdminEligibleSellerPayoutItemsResponses>;
export type CreatePayoutRunPayload = ApiRequestBody<CreateAdminPayoutRunData>;
export type CreateSellerPayoutPayload = ApiRequestBody<CreateSellerPayoutData>;
export type RecordSellerPayoutCyclePaymentPayload =
  ApiRequestBody<RecordAdminSellerPayoutCyclePaymentData>;
export type RecordSellerPayoutCyclePaymentResponse =
  ApiSuccessResponse<RecordAdminSellerPayoutCyclePaymentResponses>;
export type RecordAdminSellerPaymentPayload = ApiRequestBody<RecordAdminSellerPaymentData>;
export type RecordAdminSellerPaymentResponse =
  ApiSuccessResponse<RecordAdminSellerPaymentResponses>;
export type RecordAdminSellerPaymentReviewError = RecordAdminSellerPaymentErrors[422];
export type PayoutRunListParams = Partial<ApiRequestQuery<GetAdminPayoutRunsData>>;
export type EligibleSellerPayoutItemsParams =
  ApiRequestQuery<GetAdminEligibleSellerPayoutItemsData>;
export type PayoutRunItemListParams = Partial<ApiRequestQuery<GetAdminPayoutRunItemsData>>;
export type AdminRefundReportParams = Partial<ApiRequestQuery<GetAdminBuyerRefundReportData>>;
export type AdminBuyerRefundsParams = ApiRequestQuery<GetAdminBuyerRefundsData>;
export type AdminSellerPayoutListParams = Partial<ApiRequestQuery<GetAdminPayoutsData>>;
export type SellerPayoutSummaryListParams = ApiRequestQuery<GetAdminPayoutSellersData>;
