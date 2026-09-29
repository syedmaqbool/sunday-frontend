import type { ApiRequestBody, ApiRequestQuery, ApiResponseItem } from './api.type';
import type {
  CreateListingBoostCampaignData,
  CreateListingPackageBoostsData,
  GetActiveListingBoostsData,
  GetActiveListingBoostsResponses,
  GetAdminBoostsData,
  GetBoostPackagesResponses,
  GetMyBoostableListingsData,
  GetMyBoostableListingsResponses,
  GetMyBoostsData,
  GetMyBoostsResponses,
} from '@/types/generated-api';

export type BoostPackage = ApiResponseItem<GetBoostPackagesResponses>;
export type BoostPackageAPI = BoostPackage;
export type ListingBoost = ApiResponseItem<GetMyBoostsResponses>;
export type ActiveListingBoost = ApiResponseItem<GetActiveListingBoostsResponses>;
export type BoostPlacement = BoostPackage['placement'];
export type BoostPaymentStatus = ListingBoost['paymentStatus'];
export type BoostableListingItem = ApiResponseItem<GetMyBoostableListingsResponses>;
export type AdminBoostListParameters = Partial<ApiRequestQuery<GetAdminBoostsData>>;
export type ActiveBoostParameters = Partial<ApiRequestQuery<GetActiveListingBoostsData>>;
export type MyBoostParameters = Partial<ApiRequestQuery<GetMyBoostsData>>;
export type BoostableListingsParameters = Partial<ApiRequestQuery<GetMyBoostableListingsData>>;
export type BoostWithPackagePayload = ApiRequestBody<CreateListingPackageBoostsData>;
export type BoostWithCampaignPayload = ApiRequestBody<CreateListingBoostCampaignData>;
