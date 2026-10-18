import type { ApiRequestBody, ApiRequestQuery, ApiResponseData, ApiResponseItem, ApiSuccessResponse } from './api.type';
import type {
  CreateListingBoostCampaignResponses,
  CreateListingBoostCampaignData,
  CreateListingPackageBoostsData,
  CreateListingPackageBoostsResponses,
  GetListingBoostCampaignQuoteData,
  GetListingBoostCampaignQuoteResponses,
  GetActiveListingBoostsData,
  GetActiveListingBoostsResponses,
  GetAdminBoostsData,
  GetBoostPackagesResponses,
  GetMyBoostableListingsData,
  GetMyBoostableListingsResponses,
  GetMyBoostsData,
  GetMyBoostsResponses,
  GetMyBoostPurchasesData,
  GetMyBoostPurchasesResponses,
  ResubmitBoostPaymentProofData,
} from '@/types/generated-api';

export type BoostPackage = ApiResponseItem<GetBoostPackagesResponses>;
export type BoostPackageAPI = BoostPackage;
export type ListingBoost = ApiResponseItem<GetMyBoostsResponses>;
export type BoostPurchase = ApiResponseItem<GetMyBoostPurchasesResponses>;
export type BoostCampaignQuote = ApiResponseData<GetListingBoostCampaignQuoteResponses>;
export type ActiveListingBoost = ApiResponseItem<GetActiveListingBoostsResponses>;
export type BoostPlacement = BoostPackage['placement'];
export type BoostPaymentStatus = ListingBoost['paymentStatus'];
export type BoostableListingItem = ApiResponseItem<GetMyBoostableListingsResponses>;
export type AdminBoostListParameters = Partial<ApiRequestQuery<GetAdminBoostsData>>;
export type ActiveBoostParameters = Partial<ApiRequestQuery<GetActiveListingBoostsData>>;
export type MyBoostParameters = Partial<ApiRequestQuery<GetMyBoostsData>>;
export type MyBoostPurchasesParameters = Partial<ApiRequestQuery<GetMyBoostPurchasesData>>;
export type BoostCampaignQuoteParameters = ApiRequestQuery<GetListingBoostCampaignQuoteData>;
export type ResubmitBoostPaymentProofPayload = ApiRequestBody<ResubmitBoostPaymentProofData>;
export type BoostableListingsParameters = Partial<ApiRequestQuery<GetMyBoostableListingsData>>;
export type BoostWithPackagePayload = ApiRequestBody<CreateListingPackageBoostsData>;
export type BoostWithCampaignPayload = ApiRequestBody<CreateListingBoostCampaignData>;
export type BoostPurchaseResponse =
  | ApiSuccessResponse<CreateListingBoostCampaignResponses>
  | ApiSuccessResponse<CreateListingPackageBoostsResponses>;
