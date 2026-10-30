import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { marketplaceQueryKey } from '@/queries/marketplace.query';
import {
  cancelMyListingReservation,
  deleteMyListing,
  listMyListings,
} from '@/services/listing.service';
import type { MyListingStatuses } from '@/types/listing.type';

export const myListingsQueryKey = {
  all: () => ['my-listings'] as const,
  list: (statuses?: MyListingStatuses) =>
    [...myListingsQueryKey.all(), 'list', statuses ?? null] as const,
};

export function getMyListingsOptions(enabled = true, statuses?: MyListingStatuses) {
  return queryOptions({
    enabled,
    queryFn: async () => await listMyListings({ page: 1, size: 100, status: statuses }),
    queryKey: myListingsQueryKey.list(statuses),
  });
}

export function useDeleteMyListingMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (listingId: string) => deleteMyListing(listingId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: myListingsQueryKey.all() });
      void qc.invalidateQueries({ queryKey: marketplaceQueryKey.all() });
    },
  });
}

export function useCancelMyListingReservationMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (listingId: string) => cancelMyListingReservation(listingId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: myListingsQueryKey.all() });
      void qc.invalidateQueries({ queryKey: marketplaceQueryKey.all() });
    },
  });
}
