import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceQueryKey } from '@/queries/marketplace.query';
import { myListingsQueryKey } from '@/queries/myListings.query';
import {
  acceptCounterOffer,
  acceptOffer,
  counterOffer,
  createOffer,
  listMyOffers,
  listMyReviews,
  listReceivedOffers,
  rejectOffer,
  withdrawOffer,
} from '@/services/offers.service';

export type { Offer } from '@/services/offers.service';

export const offersQueryKey = {
  all: () => ['offers'] as const,
  buyerListing: (listingId: string, userId?: string) =>
    [...offersQueryKey.all(), 'buyer-listing', 'list', listingId, userId ?? null] as const,
  mine: (userId?: string) =>
    [...offersQueryKey.all(), 'mine', 'list', userId ?? null] as const,
  received: (userId?: string, listingId?: string) =>
    [...offersQueryKey.all(), 'received', 'list', userId ?? null, listingId ?? 'all'] as const,
  reviewedIds: (userId?: string) =>
    [...offersQueryKey.all(), 'reviewed-ids', 'list', userId ?? null] as const,
};

export function getBuyerListingOffersOptions(listingId: string, userId?: string) {
  return queryOptions({
    enabled: !!userId,
    queryFn: async () => {
      try {
        const response = await listMyOffers({ page: 1, size: 100 });
        return (response?.data ?? []).filter(offer => offer.listingId === listingId);
      } catch {
        return [];
      }
    },
    queryKey: offersQueryKey.buyerListing(listingId, userId),
  });
}


export function getSentOffersOptions(userId?: string) {
  return queryOptions({
    enabled: !!userId,
    queryFn: async () => await listMyOffers({ page: 1, size: 100 }),
    queryKey: offersQueryKey.mine(userId),
  });
}

export function getReceivedOffersOptions(userId?: string, listingId?: string) {
  return queryOptions({
    enabled: !!userId,
    queryFn: async () => await listReceivedOffers({ page: 1, size: 100 }),
    queryKey: offersQueryKey.received(userId, listingId),
  });
}

export function getMyReviewedOfferIdsOptions(userId?: string) {
  return queryOptions({
    enabled: !!userId,
    queryFn: async () => await listMyReviews({ page: 1, size: 100 }),
    queryKey: offersQueryKey.reviewedIds(userId),
  });
}

export function useCreateOfferMutation(listingId: string, userId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (variables: { amount: number; message?: string }) =>
      createOffer(listingId, variables),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: offersQueryKey.buyerListing(listingId, userId),
      });
    },
  });
}

export function useAcceptCounterOfferMutation(listingId: string, userId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (offerId: string) => acceptCounterOffer(offerId),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: offersQueryKey.buyerListing(listingId, userId),
      });
    },
  });
}

export function useWithdrawOfferMutation(listingId: string, userId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (offerId: string) => withdrawOffer(offerId),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: offersQueryKey.buyerListing(listingId, userId),
      });
    },
  });
}

export function useRespondToOfferMutation(userId?: string, listingId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      action,
      counterAmount,
    }: {
      id: string;
      action: 'accept' | 'counter' | 'reject';
      counterAmount?: number;
    }) => {
      if (action === 'accept')
        return acceptOffer(id);
      if (action === 'reject')
        return rejectOffer(id);
      return counterOffer(id, { counterAmount: counterAmount! });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: offersQueryKey.received(userId, listingId) });
      qc.invalidateQueries({ queryKey: myListingsQueryKey.all() });
      qc.invalidateQueries({ queryKey: marketplaceQueryKey.all() });
    },
  });
}
