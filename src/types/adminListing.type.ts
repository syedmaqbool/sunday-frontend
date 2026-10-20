import type { ApiRequestBody, ApiResponseData, ApiResponseItem } from './api.type';
import type {
  GetAdminListingsResponses,
  ModerateAdminListingData,
  RemoveAdminListingData,
  ReorderAdminListingMediaData,
  ReorderAdminListingMediaResponses,
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
export type ReorderListingMediaPayload = ApiRequestBody<ReorderAdminListingMediaData>;
export type ReorderedAdminListing = ApiResponseData<ReorderAdminListingMediaResponses>;
export interface RemoveAdminListingVariables {
  listingId: RemoveAdminListingData['path']['listingId'];
  reason: RemoveAdminListingData['body']['reason'];
}
export interface RestoreAdminListingVariables {
  listingId: RestoreAdminListingData['path']['listingId'];
}
