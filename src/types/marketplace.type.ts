import type { ApiResponseData, ApiResponseItem } from './api.type';
import type {
  GetAuthenticatedPublicListingByIdResponses,
  GetMarketplaceSellerProfileResponses,
  GetMyListingByIdResponses,
  GetPublicListingByIdResponses,
  GetPublicListingsResponses,
} from '@/types/generated-api';

type PublicListing = ApiResponseItem<GetPublicListingsResponses>;
type AuthenticatedPublicListing = ApiResponseData<GetAuthenticatedPublicListingByIdResponses>;

export type MarketplaceAsset = NonNullable<PublicListing['coverImage']>;
export type MarketplaceMediaItem = PublicListing['media'][number];
export type MarketplaceSellerSummary = NonNullable<PublicListing['seller']>;
export type MarketplaceListing = PublicListing & Partial<AuthenticatedPublicListing>;
export type MarketplaceEditableListing = ApiResponseData<GetMyListingByIdResponses>;
export type MarketplaceSellerProfile = ApiResponseData<GetMarketplaceSellerProfileResponses>;
export type MarketplaceListingMediaSource = Partial<Pick<MarketplaceListing, 'coverImageUrl' | 'imageUrls' | 'media'>>;
export type PublicListingDetail = ApiResponseData<GetPublicListingByIdResponses>;
