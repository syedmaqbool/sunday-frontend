import type { ApiRequestBody, ApiResponseItem } from './api.type';
import type {
  GetAdminListingsResponses,
  ModerateAdminListingData,
  RemoveAdminListingData,
  RestoreAdminListingData,
  UpdateAdminListingTitleData,
} from '@/types/generated-api';

export type AdminListing = ApiResponseItem<GetAdminListingsResponses>;
export type ListingStatus = AdminListing['status'];
export type ListingMediaFile = NonNullable<AdminListing['coverImage']>;
export type ListingMedia = AdminListing['media'][number];
export type ModerateListingPayload = ApiRequestBody<ModerateAdminListingData>;
export type UpdateAdminListingTitlePayload = ApiRequestBody<UpdateAdminListingTitleData>;
export interface UpdateAdminListingTitleVariables {
  listingId: UpdateAdminListingTitleData['path']['listingId'];
  title: UpdateAdminListingTitlePayload['title'];
}
export interface RemoveAdminListingVariables {
  listingId: RemoveAdminListingData['path']['listingId'];
  reason: RemoveAdminListingData['body']['reason'];
}
export interface RestoreAdminListingVariables {
  listingId: RestoreAdminListingData['path']['listingId'];
}
