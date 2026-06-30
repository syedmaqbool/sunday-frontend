import type { ReviewStat } from '@/services/offers.service';
import { queryOptions } from '@tanstack/react-query';
import { getReviewStats } from '@/services/offers.service';

export type { ReviewStat as SellerRating } from '@/services/offers.service';

export const sellerRatingQueryKey = {
  detail: (sellerId?: string) => ['seller-rating', sellerId] as const,
  list: (sellerIds: string[]) =>
    ['seller-ratings', sellerIds.toSorted((a, b) => a.localeCompare(b)).join(',')] as const,
};

export function getSellerRatingOptions(sellerId: string | undefined) {
  return queryOptions({
    enabled: !!sellerId,
    queryFn: async (): Promise<ReviewStat | undefined> => {
      const response = await getReviewStats([sellerId!]);
      return response.data?.[0];
    },
    queryKey: sellerRatingQueryKey.detail(sellerId),
    staleTime: 60_000,
  });
}

export function getSellerRatingsOptions(sellerIds: string[]) {
  const uniqueIds = [...new Set(sellerIds.filter(Boolean))];
  return queryOptions({
    enabled: uniqueIds.length > 0,
    queryFn: async (): Promise<Map<string, ReviewStat>> => {
      if (uniqueIds.length === 0)
        return new Map();
      const response = await getReviewStats(uniqueIds);
      return new Map((response.data ?? []).map(stat => [stat.reviewedId, stat]));
    },
    queryKey: sellerRatingQueryKey.list(uniqueIds),
    staleTime: 60_000,
  });
}
