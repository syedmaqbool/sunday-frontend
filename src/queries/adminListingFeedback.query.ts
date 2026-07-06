import { queryOptions } from '@tanstack/react-query';
import { listAdminListingFeedback } from '@/services/listing.service';

export type AdminListingFeedbackEntry = Awaited<
  ReturnType<typeof listAdminListingFeedback>
>['data'][number];

export const adminListingFeedbackQueryKey = {
  all: () => ['admin-listing-feedback'] as const,
  list: (listingId?: string) =>
    [...adminListingFeedbackQueryKey.all(), 'list', listingId ?? null] as const,
};

export function getAdminListingFeedbackOptions(listingId: string | undefined) {
  return queryOptions({
    enabled: !!listingId,
    queryFn: async () => {
      const response = await listAdminListingFeedback(listingId!, {
        page: 1,
        size: 100,
      });

      return response.data;
    },
    queryKey: adminListingFeedbackQueryKey.list(listingId),
  });
}
