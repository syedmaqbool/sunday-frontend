import type {
  CounterOfferPayload,
  CreateOfferPayload,
  CreateOfferReviewPayload,
  CreateReviewPayload,
  MyOffersParameters,
  MyReviewsParameters,
  Offer,
  ReceivedOffersParameters,
  Review,
  ReviewsParameters,
  ReviewStat,
  ReviewStatsParameters,
} from '@/types/offer.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export type { Offer, OfferStatus, Review, ReviewStat } from '@/types/offer.type';

export function createOffer(listingId: string, payload: CreateOfferPayload): Promise<Response<Offer>> {
  return authInstance
    .post(`/api/v1/listings/${listingId}/offers`, { json: payload })
    .json<Response<Offer>>();
}

export function listMyOffers(
  parameters: MyOffersParameters = {},
): Promise<PaginatedResponse<Offer>> {
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
  parameters: ReceivedOffersParameters = {},
): Promise<PaginatedResponse<Offer>> {
  return authInstance
    .get('/api/v1/me/offers/received', {
      searchParams: {
        page: parameters.page ?? 1,
        size: parameters.size ?? 100,
      },
    })
    .json<PaginatedResponse<Offer>>();
}

export function acceptOffer(offerId: string): Promise<Response<Offer>> {
  return authInstance
    .post(`/api/v1/me/offers/${offerId}/accept`)
    .json<Response<Offer>>();
}

export function counterOffer(
  offerId: string,
  payload: CounterOfferPayload,
): Promise<Response<Offer>> {
  return authInstance
    .post(`/api/v1/me/offers/${offerId}/counter`, { json: payload })
    .json<Response<Offer>>();
}

export function rejectOffer(offerId: string): Promise<Response<Offer>> {
  return authInstance
    .post(`/api/v1/me/offers/${offerId}/reject`)
    .json<Response<Offer>>();
}

export function withdrawOffer(offerId: string): Promise<Response<Offer>> {
  return authInstance
    .post(`/api/v1/me/offers/${offerId}/withdraw`)
    .json<Response<Offer>>();
}

export function acceptCounterOffer(offerId: string): Promise<Response<Offer>> {
  return authInstance
    .post(`/api/v1/me/offers/${offerId}/accept-counter`)
    .json<Response<Offer>>();
}

export function listMyReviews(
  parameters: MyReviewsParameters = {},
): Promise<PaginatedResponse<Review>> {
  return authInstance
    .get('/api/v1/me/reviews', { searchParams: parameters })
    .json<PaginatedResponse<Review>>();
}

export function listReviews(
  parameters: ReviewsParameters = {},
): Promise<PaginatedResponse<Review>> {
  return authInstance
    .get('/api/v1/reviews', { searchParams: parameters })
    .json<PaginatedResponse<Review>>();
}

export function createReview(payload: CreateReviewPayload): Promise<Response<Review>> {
  return authInstance
    .post('/api/v1/reviews', { json: payload })
    .json<Response<Review>>();
}

export function createOfferReview(payload: CreateOfferReviewPayload): Promise<Response<Review>> {
  return authInstance
    .post('/api/v1/reviews/offer', { json: payload })
    .json<Response<Review>>();
}

export function getReviewStats(reviewedIds: ReviewStatsParameters): Promise<Response<ReviewStat[]>> {
  return authInstance
    .get('/api/v1/reviews/stats', {
      searchParams: { reviewedIds: reviewedIds.join(',') },
    })
    .json<Response<ReviewStat[]>>();
}
