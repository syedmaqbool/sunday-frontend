import type { Review } from '@/services/offers.service';
import { queryOptions } from '@tanstack/react-query';
import { listMyReviews, listReviews } from '@/services/offers.service';

export type { Review as ReviewListItem } from '@/services/offers.service';

export const reviewQueryKey = {
  orderItem: (orderId: string, listingId: string, userId?: string) =>
    ['order-review', orderId, listingId, userId] as const,
  userReviews: (userId: string) => ['reviews', userId] as const,
};

export function getOrderItemReviewOptions(
  orderId: string,
  listingId: string,
  userId?: string,
  sellerId?: string,
) {
  return queryOptions({
    enabled: !!userId && !!sellerId,
    queryFn: async (): Promise<Review | null> => {
      const response = await listMyReviews({ orderId, page: 1, size: 10 });
      return (response.data ?? []).find(r => r.listingId === listingId) ?? null;
    },
    queryKey: reviewQueryKey.orderItem(orderId, listingId, userId),
  });
}

export function getUserReviewsOptions(userId: string, limit = 10) {
  return queryOptions({
    enabled: !!userId,
    queryFn: async (): Promise<Review[]> => {
      const response = await listReviews({ reviewedId: userId, page: 1, size: limit });
      return response.data ?? [];
    },
    queryKey: reviewQueryKey.userReviews(userId),
  });
}


