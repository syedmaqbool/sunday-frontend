import type { ApiResponseData } from '@/types/api.type';
import type { GetMyOfferAmountByIdResponses } from '@/types/generated-api';
import type {
  MarketplaceEditableListing,
  MarketplaceListing,
  MarketplaceListingMediaSource,
  MarketplaceSellerProfile,
} from '@/types/marketplace.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { queryOptions } from '@tanstack/react-query';
import { tokenStorage } from '@/lib/tokenStorage';
import base, { API_BASE_URL } from '@/services/ky-base-instance';
import { authInstance } from '@/services/ky.instance';

export type {
  MarketplaceAsset,
  MarketplaceEditableListing,
  MarketplaceListing,
  MarketplaceSellerProfile,
  MarketplaceSellerSummary,
} from '@/types/marketplace.type';

const publicApi = base.extend({
  baseUrl: API_BASE_URL,
});

async function fetchAllMarketplaceListings(
  searchParams: Record<string, number | string | undefined>,
) {
  const firstPage = await publicApi.get('/api/v1/listings', {
    searchParams: {
      page: 1,
      size: 100,
      ...searchParams,
    },
  }).json<PaginatedResponse<MarketplaceListing>>();

  let data = firstPage.data ?? [];
  const lastPage = firstPage.pagination?.lastPage ?? 1;

  for (let page = 2; page <= lastPage; page++) {
    const response = await publicApi.get('/api/v1/listings', {
      searchParams: {
        page,
        size: 100,
        ...searchParams,
      },
    }).json<PaginatedResponse<MarketplaceListing>>();
    data = [...data, ...response.data ?? []];
  }

  return data;
}

export const marketplaceQueryKey = {
  all: () => ['marketplace'] as const,
  editListing: (listingId?: string) =>
    [...marketplaceQueryKey.all(), 'edit-listing', 'detail', listingId ?? null] as const,
  featuredListings: () =>
    [...marketplaceQueryKey.all(), 'featured-listings', 'list'] as const,
  listing: (listingId?: string, isAuthenticated?: boolean) =>
    [...marketplaceQueryKey.all(), 'listing', 'detail', listingId ?? null, isAuthenticated ? 'auth' : 'public'] as const,
  listings: () => [...marketplaceQueryKey.all(), 'listings', 'list'] as const,
  reservedOfferAmount: (offerId?: string | null) =>
    [...marketplaceQueryKey.all(), 'reserved-offer-amount', 'detail', offerId ?? null] as const,
  sellerListings: (sellerId?: string) =>
    [...marketplaceQueryKey.all(), 'seller-listings', 'list', sellerId ?? null] as const,
  sellerProfile: (sellerId?: string) =>
    [...marketplaceQueryKey.all(), 'seller-profile', 'detail', sellerId ?? null] as const,
  trendingListings: () =>
    [...marketplaceQueryKey.all(), 'trending-listings', 'list'] as const,
};

export async function fetchMarketplaceListings(): Promise<MarketplaceListing[]> {
  return fetchAllMarketplaceListings({
    sortOrder: 'desc',
    sortBy: 'createdAt',
  });
}

export async function fetchMarketplaceListing(listingId: string): Promise<MarketplaceListing | null> {
  try {
    const hasAccessToken = !!tokenStorage.getAccess();
    const response = hasAccessToken
      ? await authInstance
          .get(`/api/v1/listings/${listingId}/me`)
          .json<Response<MarketplaceListing>>()
      : await publicApi
          .get(`/api/v1/listings/${listingId}`)
          .json<Response<MarketplaceListing>>();
    return response.data ?? null;
  }
  catch {
    return null;
  }
}

export function getMarketplaceListingsOptions() {
  return queryOptions({
    queryFn: fetchMarketplaceListings,
    queryKey: marketplaceQueryKey.listings(),
  });
}

export function getMarketplaceListingOptions(listingId?: string) {
  const hasAccessToken = !!tokenStorage.getAccess();
  return queryOptions({
    enabled: !!listingId,
    queryFn: () => fetchMarketplaceListing(listingId!),
    queryKey: marketplaceQueryKey.listing(listingId, hasAccessToken),
  });
}

export function getReservedOfferAmountOptions(
  offerId?: string | null,
  enabled = false,
) {
  return queryOptions({
    enabled,
    queryFn: async () => {
      if (!offerId)
        return null;

      try {
        const response = await authInstance
          .get(`/api/v1/me/offers/${offerId}`)
          .json<Response<ApiResponseData<GetMyOfferAmountByIdResponses>>>();
        return Number(response.data.amount);
      }
      catch {
        return null;
      }
    },
    queryKey: marketplaceQueryKey.reservedOfferAmount(offerId),
  });
}

export function getFeaturedListingsOptions() {
  return queryOptions({
    queryFn: async (): Promise<MarketplaceListing[]> => {
      const response = await publicApi.get('/api/v1/listings/featured', {
        searchParams: {
          page: 1,
          size: 12,
        },
      }).json<PaginatedResponse<MarketplaceListing>>();

      return response.data ?? [];
    },
    queryKey: marketplaceQueryKey.featuredListings(),
  });
}

export function getTrendingListingsOptions() {
  return queryOptions({
    queryFn: async (): Promise<MarketplaceListing[]> => {
      const response = await publicApi.get('/api/v1/listings/trending', {
        searchParams: {
          page: 1,
          size: 6,
        },
      }).json<PaginatedResponse<MarketplaceListing>>();

      return response.data ?? [];
    },
    queryKey: marketplaceQueryKey.trendingListings(),
  });
}

export function getEditListingOptions(listingId?: string, _userId?: string) {
  return queryOptions({
    enabled: !!listingId,
    queryFn: async () => {
      const response = await authInstance
        .get(`/api/v1/me/listings/${listingId!}`)
        .json<Response<MarketplaceEditableListing>>();

      return response.data;
    },
    queryKey: marketplaceQueryKey.editListing(listingId),
  });
}

export function getSellerProfileOptions(sellerId?: string) {
  return queryOptions({
    enabled: !!sellerId,
    queryFn: async (): Promise<MarketplaceSellerProfile | null> => {
      try {
        const response = await publicApi
          .get(`/api/v1/users/${sellerId!}`)
          .json<Response<MarketplaceSellerProfile>>();
        return response.data ?? null;
      }
      catch {
        return null;
      }
    },
    queryKey: marketplaceQueryKey.sellerProfile(sellerId),
  });
}

export function getSellerListingsOptions(
  sellerId?: string,
  _sellerName?: string | null,
  enabled = false,
) {
  return queryOptions({
    enabled,
    queryFn: async (): Promise<MarketplaceListing[]> =>
      fetchAllMarketplaceListings({
        sellerId,
        sortOrder: 'desc',
        sortBy: 'createdAt',
      }),
    queryKey: marketplaceQueryKey.sellerListings(sellerId),
  });
}

export function getListingMediaUrls(listing?: MarketplaceListingMediaSource | null) {
  if (!listing)
    return [];

  const mediaUrls = (listing.media ?? [])
    .toSorted((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map(item => item.url)
    .filter((url): url is string => !!url);

  if (mediaUrls.length > 0)
    return mediaUrls;
  if (listing.imageUrls?.length)
    return listing.imageUrls.filter((url): url is string => !!url);
  if (listing.coverImageUrl)
    return [listing.coverImageUrl];
  return [];
}
