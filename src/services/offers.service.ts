import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export type OfferStatus
  = | 'ACCEPTED'
    | 'COUNTERED'
    | 'EXPIRED'
    | 'PENDING'
    | 'REJECTED'
    | 'WITHDRAWN';

export type OfferListingStatus
  = | 'APPROVED'
    | 'NEEDS_REVISION'
    | 'PENDING'
    | 'REJECTED'
    | 'RESERVED'
    | 'SOLD';

export interface OfferCoverImage {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
}

export interface Offer {
  id: string;
  buyerId: string;
  conversationId: string | null;
  listingId: string;
  sellerId: string;
  message?: string;
  amount: number;
  buyerFullName: string;
  counterAmount: number | null;
  coverImage: OfferCoverImage | null;
  listingPrice: number;
  listingStatus: OfferListingStatus;
  listingTitle: string;
  reservedUntil: string | null;
  sellerFullName: string;
  status: OfferStatus;
  createdAt: string;
  updatedAt: string;
}

export function createOffer(listingId: string, payload: { amount: number; message?: string }) {
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
  parameters: { listingId?: string; orderId?: string; page?: number; size?: number } = {},
) {
  return authInstance
    .get('/api/v1/me/reviews', { searchParams: parameters })
    .json<PaginatedResponse<Review>>();
}

export function listReviews(
  parameters: { listingId?: string; reviewedId?: string; page?: number; size?: number } = {},
) {
  return authInstance
    .get('/api/v1/reviews', { searchParams: parameters })
    .json<PaginatedResponse<Review>>();
}

export function createReview(payload: {
  orderId: string;
  orderItemId: string;
  comment?: string;
  imageUrls?: string[];
  rating: number;
  videoUrl?: string;
}) {
  return authInstance
    .post('/api/v1/reviews', { json: payload })
    .json<Response<Review>>();
}

export function createOfferReview(payload: {
  listingId: string;
  offerId: string;
  reviewedId: string;
  comment?: string;
  rating: number;
  role: 'BUYER' | 'SELLER';
}) {
  return authInstance
    .post('/api/v1/reviews/offer', { json: payload })
    .json<Response<Review>>();
}

export interface ReviewMedia {
  id: string;
  filename: string;
  mimetype: string;
  size: number | string;
  url: string;
}

export interface ReviewStat {
  reviewedId: string;
  avgRating: number;
  totalReviews: number;
}

export function getReviewStats(reviewedIds: string[]) {
  return authInstance
    .get('/api/v1/reviews/stats', {
      searchParams: { reviewedIds: reviewedIds.join(',') },
    })
    .json<Response<ReviewStat[]>>();
}
