import { useQuery } from '@tanstack/react-query';
import { getAdminListingFeedbackOptions } from '@/queries/useAdminListingFeedback';

export type { AdminListingFeedbackEntry as FeedbackEntry } from '@/queries/useAdminListingFeedback';

export function useAdminListingFeedback(listingId: string | undefined) {
  return useQuery(getAdminListingFeedbackOptions(listingId));
}
