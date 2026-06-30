import type { Offer } from '@/services/offers.service';
import { queryOptions } from '@tanstack/react-query';
import { listMyOffers, listMyReviews, listReceivedOffers } from '@/services/offers.service';

export type { Offer } from '@/services/offers.service';

export const offersQueryKey = {
  buyerListing: (listingId: string, userId?: string) => ['my-offers', listingId, userId] as const,
  mine: (userId?: string) => ['offers-sent', userId] as const,
  received: (userId?: string, listingId?: string) =>
    ['offers-received', userId, listingId ?? 'all'] as const,
  reviewedIds: (userId?: string) => ['reviews', 'mine', userId] as const,
};

export function getBuyerListingOffersOptions(listingId: string, userId?: string) {
  return queryOptions({
    enabled: !!userId,
    queryFn: async (): Promise<Offer[]> => {
      const response = await listMyOffers({ page: 1, size: 100 });
      return (response.data ?? []).filter(offer => offer.listingId === listingId);
    },
    queryKey: offersQueryKey.buyerListing(listingId, userId),
  });
}

export function getSentOffersOptions(userId?: string) {
  return queryOptions({
    enabled: !!userId,
    queryFn: async (): Promise<Offer[]> => {
      const response = await listMyOffers({ page: 1, size: 100 });
      return response.data ?? [];
    },
    queryKey: offersQueryKey.mine(userId),
  });
}

export function getReceivedOffersOptions(userId?: string, listingId?: string) {
  return queryOptions({
    enabled: !!userId,
    queryFn: async (): Promise<Offer[]> => {
      const response = await listReceivedOffers({ page: 1, size: 100 });
      const data = response.data ?? [];
      return listingId
        ? data.filter(offer => offer.listingId === listingId)
        : data;
    },
    queryKey: offersQueryKey.received(userId, listingId),
  });
}

export function getMyReviewedOfferIdsOptions(userId?: string) {
  return queryOptions({
    enabled: !!userId,
    queryFn: async () => {
      const response = await listMyReviews({ page: 1, size: 100 });
      return (response.data ?? [])
        .map(review => review.offerId)
        .filter((id): id is string => id !== null);
    },
    queryKey: offersQueryKey.reviewedIds(userId),
  });
}




