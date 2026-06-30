import { useQuery } from '@tanstack/react-query';

import {
  getSellerRatingOptions,
  getSellerRatingsOptions,
} from '@/queries/sellerRating.query';

export type { SellerRating } from '@/queries/sellerRating.query';
export {
  getSellerRatingOptions,
  getSellerRatingsOptions,
} from '@/queries/sellerRating.query';

export function useSellerRatingQuery(sellerId: string | undefined) {
  return useQuery(getSellerRatingOptions(sellerId));
}

// Batch version for listing cards
export function useSellerRatingsQuery(sellerIds: string[]) {
  return useQuery(getSellerRatingsOptions(sellerIds));
}
