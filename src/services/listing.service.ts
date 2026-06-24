import { authInstance } from "@/services/ky.instance";
import type {
  AdminListing,
  ListingStatus,
  ModerateListingPayload,
} from "@/types/admin/listing";
import type { PaginatedResponse, Response } from "@/types/response.type";

export function listAdminListings(
  params: { status?: ListingStatus; page?: number; size?: number } = {},
) {
  return authInstance
    .get("/api/v1/admin/listings", {
      searchParams: {
        status: params.status,
        page: params.page ?? 1,
        size: params.size ?? 100,
      },
    })
    .json<PaginatedResponse<AdminListing>>();
}

export function moderateListing(
  listingId: string,
  payload: ModerateListingPayload,
) {
  return authInstance
    .patch(`/api/v1/admin/listings/${listingId}/moderate`, { json: payload })
    .json<Response<AdminListing>>();
}
