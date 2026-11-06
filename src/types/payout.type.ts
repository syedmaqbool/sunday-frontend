import type {
  ApiRequestBody,
  ApiRequestQuery,
  ApiResponseItem,
  ApiSuccessResponse,
} from './api.type';
import type {
  GetAdminBuyerRefundsData,
  GetAdminBuyerRefundsResponses,
  GetAdminPayoutSellersData,
  GetAdminPayoutSellersResponses,
  GetAdminPayoutTransactionsData,
  GetAdminPayoutTransactionsResponses,
  GetAdminSellerPaymentsData,
  GetAdminSellerPaymentsResponses,
  GetAdminSellerPaymentResponses,
  GetAdminSellerPayableResponses,
  RecordAdminSellerPaymentData,
  RecordAdminSellerPaymentErrors,
  RecordAdminSellerPaymentResponses,
} from '@/types/generated-api';

export type AdminBuyerRefundsResponse = ApiSuccessResponse<GetAdminBuyerRefundsResponses>;
export type SellerPayoutSummaryResponse = ApiSuccessResponse<GetAdminPayoutSellersResponses>;
export type SellerPayoutReviewReason = NonNullable<
  ApiResponseItem<GetAdminPayoutSellersResponses>['reviewReason']
>;
export type SellerPayment = ApiResponseItem<GetAdminSellerPaymentsResponses>;
export type SellerPaymentDetailResponse = ApiSuccessResponse<GetAdminSellerPaymentResponses>;
export type AdminPayoutTransaction = ApiResponseItem<GetAdminPayoutTransactionsResponses>;
export type AdminPayoutTransactionListParams = ApiRequestQuery<GetAdminPayoutTransactionsData>;
export type SellerPaymentListParams = ApiRequestQuery<GetAdminSellerPaymentsData>;
export type SellerPayablePreviewResponse = ApiSuccessResponse<GetAdminSellerPayableResponses>;
export type RecordAdminSellerPaymentPayload = ApiRequestBody<RecordAdminSellerPaymentData>;
export type RecordAdminSellerPaymentResponse =
  ApiSuccessResponse<RecordAdminSellerPaymentResponses>;
export type RecordAdminSellerPaymentReviewError = RecordAdminSellerPaymentErrors[422];
export type AdminBuyerRefundsParams = ApiRequestQuery<GetAdminBuyerRefundsData>;
export type SellerPayoutSummaryListParams = ApiRequestQuery<GetAdminPayoutSellersData>;
