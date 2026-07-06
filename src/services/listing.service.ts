import type {
  AdminListing,
  ListingStatus,
  ModerateListingPayload,
} from '@/types/adminListing.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export interface CreateListingPayload {
  categoryId: string;
  subcategoryId: string;
  brand: string;
  condition: string;
  description: string;
  media: Array<{ fileId: string; sortOrder?: number }>;
  price: number;
  size: string;
  title: string;
  weight: number | null;
}

export type UpdateListingPayload = Partial<Omit<CreateListingPayload, 'media'>> & {
  media?: Array<{ fileId: string; sortOrder?: number }>;
};

export interface ListingFeedbackEntry {
  id: string;
  adminId: string;
  listingId: string;
  adminFullName: string | null;
  feedback: string;
  createdAt: string;
}

export function createListing(payload: CreateListingPayload): Promise<Response<AdminListing>> {
  return authInstance
    .post('/api/v1/listings', { json: payload })
    .json<Response<AdminListing>>();
}

export function updateMyListing(listingId: string, payload: UpdateListingPayload): Promise<Response<AdminListing>> {
  return authInstance
    .patch(`/api/v1/me/listings/${listingId}`, { json: payload })
    .json<Response<AdminListing>>();
}

export function listAdminListings(
  parameters: { page?: number; size?: number; status?: ListingStatus } = {},
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
): Promise<Response<AdminListing>> {
  return authInstance
    .patch(`/api/v1/admin/listings/${listingId}/moderate`, { json: payload })
    .json<Response<AdminListing>>();
}

export function listMyListings(
  parameters: { page?: number; size?: number } = {},
): Promise<PaginatedResponse<AdminListing>> {
  return authInstance
    .get('/api/v1/me/listings', {
      searchParams: {
        page: parameters.page ?? 1,
        size: parameters.size ?? 100,
      },
    })
    .json<PaginatedResponse<AdminListing>>();
}

export function deleteMyListing(listingId: string): Promise<Response> {
  return authInstance
    .delete(`/api/v1/me/listings/${listingId}`)
    .json<Response>();
}

export function resubmitMyListing(listingId: string): Promise<Response<AdminListing>> {
  return authInstance
    .post(`/api/v1/me/listings/${listingId}/resubmit`)
    .json<Response<AdminListing>>();
}

export function cancelMyListingReservation(listingId: string): Promise<Response<AdminListing>> {
  return authInstance
    .post(`/api/v1/me/listings/${listingId}/cancel-reservation`)
    .json<Response<AdminListing>>();
}

export function listMyListingFeedback(
  listingId: string,
  parameters: { page?: number; size?: number } = {},
): Promise<PaginatedResponse<ListingFeedbackEntry>> {
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
): Promise<PaginatedResponse<ListingFeedbackEntry>> {
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
): Promise<Response<ListingFeedbackEntry>> {
  return authInstance
    .post(`/api/v1/admin/listings/${listingId}/feedback`, { json: payload })
    .json<Response<ListingFeedbackEntry>>();
}
