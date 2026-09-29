import type { ApiRequestBody, ApiRequestQuery, ApiResponseData, ApiResponseItem } from './api.type';
import type {
  AcceptCounterOfferResponses,
  AcceptOfferResponses,
  CounterOfferData,
  CreateOfferData,
  CreateOfferReviewData,
  CreateReviewData,
  GetMyOffersData,
  GetMyOffersResponses,
  GetMyReviewsData,
  GetMyReviewsResponses,
  GetReceivedOffersData,
  GetReceivedOffersResponses,
  GetReviewsData,
  GetReviewsResponses,
  GetReviewStatsData,
  GetReviewStatsResponses,
  RejectOfferResponses,
  WithdrawOfferResponses,
} from '@/types/generated-api';

export type Offer = ApiResponseItem<GetMyOffersResponses> | ApiResponseItem<GetReceivedOffersResponses>;
export type OfferStatus = Offer['status'];
export type OfferListingStatus = Offer['listingStatus'];
export type OfferCoverImage = NonNullable<Offer['coverImage']>;
export type CreateOfferPayload = ApiRequestBody<CreateOfferData>;
export type CounterOfferPayload = ApiRequestBody<CounterOfferData>;
export type MyOffersParameters = Partial<ApiRequestQuery<GetMyOffersData>>;
export type ReceivedOffersParameters = Partial<ApiRequestQuery<GetReceivedOffersData>>;

export type Review = ApiResponseItem<GetMyReviewsResponses> | ApiResponseItem<GetReviewsResponses>;
export type ReviewMedia = NonNullable<Review['imageUrls']>[number];
export type ReviewStat = ApiResponseItem<GetReviewStatsResponses>;
export type CreateReviewPayload = ApiRequestBody<CreateReviewData>;
export type CreateOfferReviewPayload = ApiRequestBody<CreateOfferReviewData>;
export type MyReviewsParameters = Partial<ApiRequestQuery<GetMyReviewsData>>;
export type ReviewsParameters = Partial<ApiRequestQuery<GetReviewsData>>;
export type ReviewStatsParameters = Array<ApiRequestQuery<GetReviewStatsData>['reviewedIds']>;

export type OfferActionResponse
  = | ApiResponseData<AcceptCounterOfferResponses>
    | ApiResponseData<AcceptOfferResponses>
    | ApiResponseData<RejectOfferResponses>
    | ApiResponseData<WithdrawOfferResponses>;
