import type {
  AdminListing,
  ListingStatus,
  ModerateListingPayload,
} from '@/types/admin/listing';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export interface ListingFeedbackEntry {
  id: string;
  adminId: string;
  listingId: string;
  adminFullName: string | null;
  feedback: string;
  createdAt: string;
}

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

export function listMyListings(
  parameters: { page?: number; size?: number } = {},
) {
  return authInstance
    .get('/api/v1/me/listings', {
      searchParams: {
        page: parameters.page ?? 1,
        size: parameters.size ?? 100,
      },
    })
    .json<PaginatedResponse<AdminListing>>();
}

export function deleteMyListing(listingId: string) {
  return authInstance
    .delete(`/api/v1/me/listings/${listingId}`)
    .json<Response>();
}

export function resubmitMyListing(listingId: string) {
  return authInstance
    .post(`/api/v1/me/listings/${listingId}/resubmit`)
    .json<Response<AdminListing>>();
}

export function cancelMyListingReservation(listingId: string) {
  return authInstance
    .post(`/api/v1/me/listings/${listingId}/cancel-reservation`)
    .json<Response<AdminListing>>();
}

export function listMyListingFeedback(
  listingId: string,
  parameters: { page?: number; size?: number } = {},
) {
  return authInstance
    .get(`/api/v1/me/listings/${listingId}/feedback`, {
      searchParams: {
        page: parameters.page ?? 1,
        size: parameters.size ?? 100,
      },
    })
    .json<PaginatedResponse<ListingFeedbackEntry>>();
}

export function listAdminListingFeedback(
  listingId: string,
  parameters: { page?: number; size?: number } = {},
) {
  return authInstance
    .get(`/api/v1/admin/listings/${listingId}/feedback`, {
      searchParams: {
        page: parameters.page ?? 1,
        size: parameters.size ?? 100,
      },
    })
    .json<PaginatedResponse<ListingFeedbackEntry>>();
}

export function createAdminListingFeedback(
  listingId: string,
  payload: { feedback: string },
) {
  return authInstance
    .post(`/api/v1/admin/listings/${listingId}/feedback`, { json: payload })
    .json<Response<ListingFeedbackEntry>>();
}
