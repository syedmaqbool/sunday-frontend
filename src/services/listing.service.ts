import type {
  AdminListing,
  ListingStatus,
  ModerateListingPayload,
} from '@/types/admin/listing';
import type { UploadedFile } from '@/types/profile';
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

export function uploadListingMedia(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return authInstance
    .post('/api/v1/listings/media', { body: formData })
    .json<Response<UploadedFile>>();
}

export function createListing(payload: CreateListingPayload) {
  return authInstance
    .post('/api/v1/listings', { json: payload })
    .json<Response<AdminListing>>();
}

export function updateMyListing(listingId: string, payload: UpdateListingPayload) {
  return authInstance
    .patch(`/api/v1/me/listings/${listingId}`, { json: payload })
    .json<Response<AdminListing>>();
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
