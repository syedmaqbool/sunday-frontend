import type {
  ModerateListingPayload,
  RemoveAdminListingVariables,
  ReorderListingMediaPayload,
  RestoreAdminListingVariables,
  UpdateAdminListingTitleVariables,
} from '@/types/adminListing.type';
import type { GetAdminListingsData } from '@/types/generated-api';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminListingFeedbackQueryKey } from '@/queries/adminListingFeedback.query';
import { myListingFeedbackQueryKey } from '@/queries/myListingFeedback.query';
import {
  createAdminListingFeedback,
  listAdminListings,
  moderateListing,
  removeAdminListing,
  reorderAdminListingMedia,
  restoreAdminListing,
  updateAdminListingTitle,
} from '@/services/listing.service';

export const adminListingsQueryKey = {
  all: () => ['admin-listings'] as const,
  list: (query: GetAdminListingsData['query']) =>
    [
      ...adminListingsQueryKey.all(),
      'list',
      query.status,
      query.isDeleted,
      query.page,
      query.size,
    ] as const,
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
    mutationFn: ({ listingId, ...payload }: { listingId: string } & ModerateListingPayload) =>
      moderateListing(listingId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminListingsQueryKey.all() });
      void queryClient.invalidateQueries({
        queryKey: adminListingFeedbackQueryKey.list(),
      });
      void queryClient.invalidateQueries({
        queryKey: myListingFeedbackQueryKey.list(),
      });
    },
  });
}

export function useRemoveAdminListingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, reason }: RemoveAdminListingVariables) =>
      removeAdminListing(listingId, { reason }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminListingsQueryKey.all() });
    },
  });
}

export function useRestoreAdminListingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId }: RestoreAdminListingVariables) => restoreAdminListing(listingId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminListingsQueryKey.all() });
    },
  });
}

export function useUpdateAdminListingTitleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, title }: UpdateAdminListingTitleVariables) =>
      updateAdminListingTitle(listingId, { title }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminListingsQueryKey.all() });
    },
  });
}

export function useReorderAdminListingMediaMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, ...payload }: { listingId: string } & ReorderListingMediaPayload) =>
      reorderAdminListingMedia(listingId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: adminListingsQueryKey.all() }),
  });
}

export function useCreateAdminListingFeedbackMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, feedback }: { listingId: string; feedback: string }) =>
      createAdminListingFeedback(listingId, { feedback }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: adminListingsQueryKey.all() });
      void queryClient.invalidateQueries({
        queryKey: adminListingFeedbackQueryKey.list(),
      });
      void queryClient.invalidateQueries({
        queryKey: myListingFeedbackQueryKey.list(),
      });
    },
  });
}
