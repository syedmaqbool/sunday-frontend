import type {
  ActiveBoostParameters,
  ActiveListingBoost,
  BoostableListingItem,
  BoostableListingsParameters,
  BoostPackage,
  BoostWithCampaignPayload,
  BoostWithPackagePayload,
  ListingBoost,
  MyBoostParameters,
} from '@/types/boost.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listActiveBoosts(parameters: ActiveBoostParameters = {}): Promise<Response<ActiveListingBoost[]>> {
  return authInstance
    .get('/api/v1/boosts/active', { searchParams: parameters })
    .json<Response<ActiveListingBoost[]>>();
}

export function listBoostPackages(): Promise<Response<BoostPackage[]>> {
  return authInstance
    .get('/api/v1/boost-packages')
    .json<Response<BoostPackage[]>>();
}

export function listMyBoosts(parameters: MyBoostParameters = {}): Promise<PaginatedResponse<ListingBoost>> {
  return authInstance
    .get('/api/v1/me/boosts', { searchParams: parameters })
    .json<PaginatedResponse<ListingBoost>>();
}

export function listBoostableListings(
  parameters: BoostableListingsParameters = {},
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
