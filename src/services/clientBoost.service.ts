import type {
  BoostableListingItem,
  BoostPackage,
  BoostWithCampaignPayload,
  BoostWithPackagePayload,
  ListingBoost,
} from '@/types/boost.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listActiveBoosts(parameters: { placement?: string } = {}): Promise<Response<ListingBoost[]>> {
  return authInstance
    .get('/api/v1/boosts/active', { searchParams: parameters })
    .json<Response<ListingBoost[]>>();
}

export function listBoostPackages(): Promise<Response<BoostPackage[]>> {
  return authInstance
    .get('/api/v1/boost-packages')
    .json<Response<BoostPackage[]>>();
}

export function listMyBoosts(parameters: { page?: number; size?: number } = {}): Promise<PaginatedResponse<ListingBoost>> {
  return authInstance
    .get('/api/v1/me/boosts', { searchParams: parameters })
    .json<PaginatedResponse<ListingBoost>>();
}

export function listBoostableListings(
  parameters: { page?: number; size?: number } = {},
): Promise<PaginatedResponse<BoostableListingItem>> {
  return authInstance
    .get('/api/v1/me/listings/boostable', { searchParams: parameters })
    .json<PaginatedResponse<BoostableListingItem>>();
}

export function boostWithPackage(
  listingId: string,
  body: BoostWithPackagePayload,
): Promise<Response<ListingBoost[]>> {
  return authInstance
    .post(`/api/v1/me/listings/${listingId}/boosts/package`, { json: body })
    .json<Response<ListingBoost[]>>();
}

export function boostWithCampaign(
  listingId: string,
  body: BoostWithCampaignPayload,
): Promise<Response<ListingBoost>> {
  return authInstance
    .post(`/api/v1/me/listings/${listingId}/boosts/campaign`, { json: body })
    .json<Response<ListingBoost>>();
}
