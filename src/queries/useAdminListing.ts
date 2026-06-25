import type { ListingStatus } from '@/types/admin/listing';
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { listAdminListings, moderateListing } from '@/services/listing.service';

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

export function useAdminListings(status?: 'all' | ListingStatus) {
  return useQuery(getAdminListingsOptions(status));
}

export function useModerateListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      listingId,
      feedback,
      status,
    }: {
      listingId: string;
      feedback?: string;
      status: 'APPROVED' | 'NEEDS_REVISION' | 'REJECTED';
    }) => moderateListing(listingId, { feedback, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminListingsQueryKey.all() });
      queryClient.invalidateQueries({ queryKey: ['listing-feedback'] });
    },
  });
}
