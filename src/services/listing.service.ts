import type {
  AdminListing,
  ListingStatus,
  ModerateListingPayload,
} from '@/types/admin/listing';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listAdminListings(
  parameters: { page?: number; size?: number; status?: ListingStatus } = {},
) {
  return authInstance
    .get('/api/v1/admin/listings', {
      searchParams: {
        page: parameters.page ?? 1,
        size: parameters.size ?? 100,
        status: parameters.status,
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
