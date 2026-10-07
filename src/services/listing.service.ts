import type {
  AdminListing,
  ModerateListingPayload,
} from '@/types/adminListing.type';
import type {
  AdminListingFeedbackEntry,
  AdminListingFeedbackParameters,
  AdminListingFeedbackPayload,
  AdminListingParameters,
  CancelledListingReservation,
  CreatedListing,
  CreateListingPayload,
  ModeratedListing,
  MyListing,
  MyListingFeedbackEntry,
  MyListingFeedbackParameters,
  MyListingParameters,
  UpdatedMyListing,
  UpdateListingPayload,
} from '@/types/listing.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function createListing(payload: CreateListingPayload): Promise<Response<CreatedListing>> {
  return authInstance
    .post('/api/v1/listings', { json: payload })
    .json<Response<CreatedListing>>();
}

export function updateMyListing(listingId: string, payload: UpdateListingPayload): Promise<Response<UpdatedMyListing>> {
  return authInstance
    .patch(`/api/v1/me/listings/${listingId}`, { json: payload })
    .json<Response<UpdatedMyListing>>();
}

export function listAdminListings(
  parameters: AdminListingParameters = {},
): Promise<PaginatedResponse<AdminListing>> {
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
): Promise<Response<ModeratedListing>> {
  return authInstance
    .patch(`/api/v1/admin/listings/${listingId}/moderate`, { json: payload })
    .json<Response<ModeratedListing>>();
}

export function listMyListings(
  parameters: MyListingParameters = {},
): Promise<PaginatedResponse<MyListing>> {
  return authInstance
    .get('/api/v1/me/listings', {
      searchParams: {
        page: parameters.page ?? 1,
        size: parameters.size ?? 100,
      },
    })
    .json<PaginatedResponse<MyListing>>();
}

export function deleteMyListing(listingId: string): Promise<Response> {
  return authInstance
    .delete(`/api/v1/me/listings/${listingId}`)
    .json<Response>();
}

export function cancelMyListingReservation(listingId: string): Promise<Response<CancelledListingReservation>> {
  return authInstance
    .post(`/api/v1/me/listings/${listingId}/cancel-reservation`)
    .json<Response<CancelledListingReservation>>();
}

export function listMyListingFeedback(
  listingId: string,
  parameters: MyListingFeedbackParameters = {},
): Promise<PaginatedResponse<MyListingFeedbackEntry>> {
  return authInstance
    .get(`/api/v1/me/listings/${listingId}/feedback`, {
      searchParams: {
        page: parameters.page ?? 1,
        size: parameters.size ?? 100,
      },
    })
    .json<PaginatedResponse<MyListingFeedbackEntry>>();
}

export function listAdminListingFeedback(
  listingId: string,
  parameters: AdminListingFeedbackParameters = {},
): Promise<PaginatedResponse<AdminListingFeedbackEntry>> {
  return authInstance
    .get(`/api/v1/admin/listings/${listingId}/feedback`, {
      searchParams: {
        page: parameters.page ?? 1,
        size: parameters.size ?? 100,
      },
    })
    .json<PaginatedResponse<AdminListingFeedbackEntry>>();
}

export function createAdminListingFeedback(
  listingId: string,
  payload: AdminListingFeedbackPayload,
): Promise<Response<AdminListingFeedbackEntry>> {
  return authInstance
    .post(`/api/v1/admin/listings/${listingId}/feedback`, { json: payload })
    .json<Response<AdminListingFeedbackEntry>>();
}
