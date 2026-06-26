import { useQuery } from '@tanstack/react-query';
import { getMyListingFeedbackOptions } from '@/queries/useMyListingFeedback';

export type { MyListingFeedbackEntry as FeedbackEntry } from '@/queries/useMyListingFeedback';

export function useMyListingFeedback(listingId: string | undefined) {
  return useQuery(getMyListingFeedbackOptions(listingId));
}
