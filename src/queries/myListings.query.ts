import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceQueryKey } from '@/queries/marketplace.query';
import {
  cancelMyListingReservation,
  deleteMyListing,
  listMyListings,
  resubmitMyListing,
} from '@/services/listing.service';

export type MyListing = Awaited<
  ReturnType<typeof listMyListings>
>['data'][number];

export const myListingsQueryKey = {
  all: () => ['my-listings'] as const,
  list: () => [...myListingsQueryKey.all(), 'list'] as const,
};

export function getMyListingsOptions(enabled = true) {
  return queryOptions({
    enabled,
    queryFn: async () => await listMyListings({ page: 1, size: 100 }),
    queryKey: myListingsQueryKey.list(),
  });
}

export function useDeleteMyListingMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (listingId: string) => deleteMyListing(listingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: myListingsQueryKey.all() });
      qc.invalidateQueries({ queryKey: marketplaceQueryKey.all() });
    },
  });
}

export function useResubmitMyListingMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (listingId: string) => resubmitMyListing(listingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: myListingsQueryKey.all() });
    },
  });
}

export function useCancelMyListingReservationMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (listingId: string) => cancelMyListingReservation(listingId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: myListingsQueryKey.all() });
      qc.invalidateQueries({ queryKey: marketplaceQueryKey.all() });
    },
  });
}
