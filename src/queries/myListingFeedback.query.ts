import { queryOptions } from '@tanstack/react-query';
import { listMyListingFeedback } from '@/services/listing.service';

export type MyListingFeedbackEntry = Awaited<
  ReturnType<typeof listMyListingFeedback>
>['data'][number];

export const myListingFeedbackQueryKey = {
  all: () => ['my-listing-feedback'] as const,
  list: (listingId?: string) =>
    [...myListingFeedbackQueryKey.all(), 'list', listingId ?? null] as const,
};

export function getMyListingFeedbackOptions(listingId: string | undefined) {
  return queryOptions({
    enabled: !!listingId,
    queryFn: async () => {
      const response = await listMyListingFeedback(listingId!, {
        page: 1,
        size: 100,
      });

      return response.data;
    },
    queryKey: myListingFeedbackQueryKey.list(listingId),
  });
}
