import type { ModerateListingPayload } from '@/types/adminListing.type';
import type { GetAdminListingsData } from '@/types/generated-api';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminListingFeedbackQueryKey } from '@/queries/adminListingFeedback.query';
import { myListingFeedbackQueryKey } from '@/queries/myListingFeedback.query';
import {
  createAdminListingFeedback,
  listAdminListings,
  moderateListing,
} from '@/services/listing.service';

export const adminListingsQueryKey = {
  all: () => ['admin-listings'] as const,
  list: (query: GetAdminListingsData['query']) =>
    [...adminListingsQueryKey.all(), 'list', query.status, query.page, query.size] as const,
};

export function getAdminListingsOptions(query: GetAdminListingsData['query']) {
  return queryOptions({
    queryFn: () => listAdminListings(query),
    queryKey: adminListingsQueryKey.list(query),
  });
}

export function useModerateListingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      listingId,
      ...payload
    }: { listingId: string } & ModerateListingPayload) => moderateListing(listingId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminListingsQueryKey.all() });
      queryClient.invalidateQueries({
        queryKey: adminListingFeedbackQueryKey.list(),
      });
      queryClient.invalidateQueries({
        queryKey: myListingFeedbackQueryKey.list(),
      });
    },
  });
}

export function useCreateAdminListingFeedbackMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      listingId,
      feedback,
    }: {
      listingId: string;
      feedback: string;
    }) => createAdminListingFeedback(listingId, { feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminListingsQueryKey.all() });
      queryClient.invalidateQueries({
        queryKey: adminListingFeedbackQueryKey.list(),
      });
      queryClient.invalidateQueries({
        queryKey: myListingFeedbackQueryKey.list(),
      });
    },
  });
}
