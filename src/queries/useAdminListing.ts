import type { ListingStatus } from '@/types/admin/listing';
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { adminListingFeedbackQueryKey } from '@/queries/useAdminListingFeedback';
import { myListingFeedbackQueryKey } from '@/queries/useMyListingFeedback';
import {
  createAdminListingFeedback,
  listAdminListings,
  moderateListing,
} from '@/services/listing.service';

export const adminListingsQueryKey = {
  all: () => ['admin-listings'] as const,
  list: (status?: 'all' | ListingStatus) =>
    [...adminListingsQueryKey.all(), 'list', status] as const,
};

export function getAdminListingsOptions(status?: 'all' | ListingStatus) {
  return queryOptions({
    queryFn: async () => {
      const response = await listAdminListings({
        size: 100,
        status: status && status !== 'all' ? status : undefined,
      });
      return response.data;
    },
    queryKey: adminListingsQueryKey.list(status),
  });
}

export function useModerateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      listingId,
      status,
    }: {
      listingId: string;
      status: 'APPROVED' | 'NEEDS_REVISION' | 'REJECTED';
    }) => moderateListing(listingId, { status }),
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

export function useCreateAdminListingFeedback() {
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
