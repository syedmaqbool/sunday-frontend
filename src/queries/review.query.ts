import type { InfiniteData } from '@tanstack/react-query';
import type { CreateOfferReviewPayload, CreateReviewPayload, Review } from '@/types/offer.type';
import type { PaginatedResponse } from '@/types/response.type';
import { infiniteQueryOptions, queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
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
  userReviews: (userId: string, limit: number) =>
    [...reviewQueryKey.all(), 'user', 'list', userId, limit] as const,
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
  return infiniteQueryOptions<
    PaginatedResponse<Review>,
    Error,
    InfiniteData<PaginatedResponse<Review>>,
    ReturnType<typeof reviewQueryKey.userReviews>,
    number
  >({
    enabled: !!userId,
    getNextPageParam: page => page.pagination.nextPage ?? undefined,
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => await listReviews({ reviewedId: userId, page: pageParam, size: limit }),
    queryKey: reviewQueryKey.userReviews(userId, limit),
  });
}

export function useCreateOrderItemReviewMutation(userId?: string, sellerId?: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ listingId: _listingId, ...payload }: CreateReviewPayload & { listingId: string }) => createReview(payload),
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
    mutationFn: (payload: CreateOfferReviewPayload) => createOfferReview(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reviewQueryKey.all() });
    },
  });
}
