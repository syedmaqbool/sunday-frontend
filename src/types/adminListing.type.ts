import type { ApiRequestBody, ApiResponseItem } from './api.type';
import type { GetAdminListingsResponses, ModerateAdminListingData } from '@/types/generated-api';

export type AdminListing = ApiResponseItem<GetAdminListingsResponses>;
export type ListingStatus = AdminListing['status'];
export type ListingMediaFile = NonNullable<AdminListing['coverImage']>;
export type ListingMedia = AdminListing['media'][number];
export type ModerateListingPayload = ApiRequestBody<ModerateAdminListingData>;
