import { authInstance } from "@/services/ky.instance";
import type {
  BoostPackage,
  BoostableListingItem,
  BoostWithCampaignPayload,
  BoostWithPackagePayload,
  ListingBoost,
} from "@/types/boost";
import type { PaginatedResponse, Response } from "@/types/response.type";

export function listBoostPackages() {
  return authInstance
    .get("/api/v1/boost-packages")
    .json<Response<BoostPackage[]>>();
}

export function listMyBoosts(params: { page?: number; size?: number } = {}) {
  return authInstance
    .get("/api/v1/me/boosts", { searchParams: params })
    .json<PaginatedResponse<ListingBoost>>();
}

export function listBoostableListings(
  params: { page?: number; size?: number } = {},
) {
  return authInstance
    .get("/api/v1/me/listings/boostable", { searchParams: params })
    .json<PaginatedResponse<BoostableListingItem>>();
}

export function boostWithPackage(
  listingId: string,
  body: BoostWithPackagePayload,
) {
  return authInstance
    .post(`/api/v1/me/listings/${listingId}/boosts/package`, { json: body })
    .json<Response<ListingBoost>>();
}

export function boostWithCampaign(
  listingId: string,
  body: BoostWithCampaignPayload,
) {
  return authInstance
    .post(`/api/v1/me/listings/${listingId}/boosts/campaign`, { json: body })
    .json<Response<ListingBoost>>();
}
