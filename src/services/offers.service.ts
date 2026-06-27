import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export type OfferStatus =
  | 'ACCEPTED'
  | 'COUNTERED'
  | 'EXPIRED'
  | 'PENDING'
  | 'REJECTED'
  | 'WITHDRAWN';

export type OfferListingStatus =
  | 'APPROVED'
  | 'NEEDS_REVISION'
  | 'PENDING'
  | 'REJECTED'
  | 'RESERVED'
  | 'SOLD';

export interface Offer {
  id: string;
  buyerId: string;
  conversationId: string | null;
  listingId: string;
  sellerId: string;
  amount: number;
  buyerFullName: string;
  counterAmount: number | null;
  listingPrice: number;
  listingStatus: OfferListingStatus;
  listingTitle: string;
  reservedUntil: string | null;
  sellerFullName: string;
  status: OfferStatus;
  createdAt: string;
  updatedAt: string;
}

export function createOffer(listingId: string, payload: { amount: number }) {
  return authInstance
    .post(`/api/v1/listings/${listingId}/offers`, { json: payload })
    .json<Response<Offer>>();
}

export function listMyOffers(
  parameters: { page?: number; size?: number } = {},
) {
  return authInstance
    .get('/api/v1/me/offers', {
      searchParams: {
        page: parameters.page ?? 1,
        size: parameters.size ?? 100,
      },
    })
    .json<PaginatedResponse<Offer>>();
}

export function listReceivedOffers(
  parameters: { page?: number; size?: number } = {},
) {
  return authInstance
    .get('/api/v1/me/offers/received', {
      searchParams: {
        page: parameters.page ?? 1,
        size: parameters.size ?? 100,
      },
    })
    .json<PaginatedResponse<Offer>>();
}

export function acceptOffer(offerId: string) {
  return authInstance
    .post(`/api/v1/me/offers/${offerId}/accept`)
    .json<Response<Offer>>();
}

export function counterOffer(
  offerId: string,
  payload: { counterAmount: number },
) {
  return authInstance
    .post(`/api/v1/me/offers/${offerId}/counter`, { json: payload })
    .json<Response<Offer>>();
}

export function rejectOffer(offerId: string) {
  return authInstance
    .post(`/api/v1/me/offers/${offerId}/reject`)
    .json<Response<Offer>>();
}

export function withdrawOffer(offerId: string) {
  return authInstance
    .post(`/api/v1/me/offers/${offerId}/withdraw`)
    .json<Response<Offer>>();
}

export function acceptCounterOffer(offerId: string) {
  return authInstance
    .post(`/api/v1/me/offers/${offerId}/accept-counter`)
    .json<Response<Offer>>();
}

export interface Review {
  id: string;
  listingId: string;
  offerId: string | null;
  orderId: string;
  reviewedId: string;
  reviewerId: string;
  comment: string;
  imageUrls: string[];
  listingTitle: string;
  rating: number;
  reviewedFullName: string;
  reviewerFullName: string;
  role: 'BUYER' | 'SELLER';
  videoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export function listMyReviews(
  parameters: { page?: number; size?: number } = {},
) {
  return authInstance
    .get('/api/v1/me/reviews', {
      searchParams: {
        page: parameters.page ?? 1,
        size: parameters.size ?? 100,
      },
    })
    .json<PaginatedResponse<Review>>();
}
