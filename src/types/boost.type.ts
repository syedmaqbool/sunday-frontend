import type {
  ApiRequestBody,
  ApiRequestQuery,
  ApiResponseData,
  ApiResponseItem,
  ApiSuccessResponse,
} from './api.type';
import type {
  CreateListingBoostCampaignData,
  CreateListingBoostCampaignResponses,
  CreateListingPackageBoostsData,
  CreateListingPackageBoostsResponses,
  GetActiveListingBoostsData,
  GetActiveListingBoostsResponses,
  GetAdminBoostsData,
  GetBoostPackagesResponses,
  GetListingBoostCampaignQuoteData,
  GetListingBoostCampaignQuoteResponses,
  GetMyBoostableListingsData,
  GetMyBoostableListingsResponses,
  GetMyBoostPurchasesData,
  GetMyBoostPurchasesResponses,
  GetMyBoostsData,
  GetMyBoostsResponses,
  ResubmitBoostPaymentProofData,
  RetryPayFastBoostCheckoutResponses,
} from '@/types/generated-api';

export type BoostPackage = ApiResponseItem<GetBoostPackagesResponses>;
export type BoostPackageAPI = BoostPackage;
export type ListingBoost = ApiResponseItem<GetMyBoostsResponses>;
export type BoostPurchase = ApiResponseItem<GetMyBoostPurchasesResponses>;
export type BoostCampaignQuote = ApiResponseData<GetListingBoostCampaignQuoteResponses>;
export type ActiveListingBoost = ApiResponseItem<GetActiveListingBoostsResponses>;
export type BoostPlacement = BoostPackage['placement'];
export type BoostableListingItem = ApiResponseItem<GetMyBoostableListingsResponses>;
export type AdminBoostListParameters = Partial<ApiRequestQuery<GetAdminBoostsData>>;
export type ActiveBoostParameters = Partial<ApiRequestQuery<GetActiveListingBoostsData>>;
export type MyBoostParameters = Partial<ApiRequestQuery<GetMyBoostsData>>;
export type MyBoostPurchasesParameters = Partial<ApiRequestQuery<GetMyBoostPurchasesData>>;
export type BoostCampaignQuoteParameters = ApiRequestQuery<GetListingBoostCampaignQuoteData>;
export type ResubmitBoostPaymentProofPayload = ApiRequestBody<ResubmitBoostPaymentProofData>;
export type ResubmitBoostPaymentProofVariables = {
  listingId: string;
  purchaseId: string;
} & ResubmitBoostPaymentProofPayload;
export type BoostableListingsParameters = Partial<ApiRequestQuery<GetMyBoostableListingsData>>;
export type BoostWithPackagePayload = ApiRequestBody<CreateListingPackageBoostsData>;
export type BoostWithCampaignPayload = ApiRequestBody<CreateListingBoostCampaignData>;
export type BoostPurchaseResponse =
  | ApiSuccessResponse<CreateListingBoostCampaignResponses>
  | ApiSuccessResponse<CreateListingPackageBoostsResponses>;
// The generated response name comes from the backend's retry operation, which serves this start call.
export type StartPayFastBoostCheckoutResponse =
  ApiSuccessResponse<RetryPayFastBoostCheckoutResponses>;
export type BoostPayFastCheckoutVariables = {
  listingId: string;
  purchaseId: string;
};
export type BoostActivationWindow = Pick<ListingBoost, 'endsAt' | 'paymentStatus' | 'startsAt'>;
export type BoostPurchaseDisplayStatus =
  | 'ACTIVE'
  | 'ENDED'
  | 'PAYMENT_EXPIRED'
  | BoostPurchase['status'];
// Scalars the purchase status helpers read. The consuming layer derives them from the purchase's
// boosts at a given time, so the helpers themselves never iterate server records.
export type BoostPurchaseStatusSource = Pick<BoostPurchase, 'status'> & {
  // Earliest boost creation time plus the payment window, in epoch ms. Null when there are no boosts.
  paymentDeadline: number | null;
  // Selected end of a custom campaign, in epoch ms. Null for package purchases.
  campaignEndsAt: number | null;
  hasActiveBoost: boolean;
  allBoostsEnded: boolean;
};
