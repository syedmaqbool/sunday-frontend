import { useQuery } from '@tanstack/react-query';
import {
  getSellerRatingOptions,
  getSellerRatingsOptions,
} from '@/queries/useSellerRating';

export type { SellerRating } from '@/queries/useSellerRating';

export function useSellerRating(sellerId: string | undefined) {
  return useQuery(getSellerRatingOptions(sellerId));
}

// Batch version for listing cards
export function useSellerRatings(sellerIds: string[]) {
  return useQuery(getSellerRatingsOptions(sellerIds));
}
