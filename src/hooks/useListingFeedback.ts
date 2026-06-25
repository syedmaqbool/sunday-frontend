import { useQuery } from '@tanstack/react-query';
import { getListingFeedbackOptions } from '@/queries/useListingFeedback';

export type { FeedbackEntry } from '@/queries/useListingFeedback';

export function useListingFeedback(listingId: string | undefined) {
  return useQuery(getListingFeedbackOptions(listingId));
}
