import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { sellerRatingQueryKey } from '@/queries/sellerRating.query';
import {
  createOfferReview,
  createReview,
  listMyReviews,
  listReviews,
} from '@/services/offers.service';

export type { Review as ReviewListItem } from '@/services/offers.service';

export const reviewQueryKey = {
  all: () => ['reviews'] as const,
  orderItem: (orderId: string, listingId: string, userId?: string) =>
    [...reviewQueryKey.all(), 'order-item', orderId, listingId, userId ?? null] as const,
  userReviews: (userId: string) =>
    [...reviewQueryKey.all(), 'user', 'list', userId] as const,
};

export function getOrderItemReviewOptions(
  orderId: string,
  listingId: string,
  userId?: string,
  sellerId?: string,
) {
  return queryOptions({
    enabled: !!userId && !!sellerId,
    queryFn: async () => await listMyReviews({ orderId, page: 1, size: 10 }),
    queryKey: reviewQueryKey.orderItem(orderId, listingId, userId),
  });
}

export function getUserReviewsOptions(userId: string, limit = 10) {
  return queryOptions({
    enabled: !!userId,
    queryFn: async () => await listReviews({ reviewedId: userId, page: 1, size: limit }),
    queryKey: reviewQueryKey.userReviews(userId),
  });
}

export function useCreateOrderItemReviewMutation(userId?: string, sellerId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      listingId: string;
      orderId: string;
      orderItemId: string;
      comment?: string;
      imageUrls?: string[];
      rating: number;
      videoUrl?: string;
    }) => createReview(payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: reviewQueryKey.orderItem(
          variables.orderId,
          variables.listingId,
          userId,
        ),
      });
      qc.invalidateQueries({ queryKey: reviewQueryKey.all() });
      if (sellerId) {
        qc.invalidateQueries({
          queryKey: sellerRatingQueryKey.detail(sellerId),
        });
      }
    },
  });
}

export function useCreateOfferReviewMutation() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      listingId: string;
      offerId: string;
      reviewedId: string;
      comment?: string;
      rating: number;
      role: 'BUYER' | 'SELLER';
    }) => createOfferReview(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewQueryKey.all() });
    },
  });
}
