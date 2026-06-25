import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SellerRating {
  avgRating: number;
  totalReviews: number;
}

export const sellerRatingQueryKey = {
  detail: (sellerId?: string) => ['seller-rating', sellerId] as const,
  list: (sellerIds: string[]) =>
    ['seller-ratings', sellerIds.toSorted((a, b) => a.localeCompare(b)).join(',')] as const,
};

export function getSellerRatingOptions(sellerId: string | undefined) {
  return queryOptions({
    enabled: !!sellerId,
    queryFn: async (): Promise<SellerRating> => {
      const { data, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_id', sellerId!);
      if (error)
        throw error;
      const ratings = data ?? [];
      return {
        avgRating: ratings.length > 0
          ? ratings.reduce((sum, row) => sum + row.rating, 0) / ratings.length
          : 0,
        totalReviews: ratings.length,
      };
    },
    queryKey: sellerRatingQueryKey.detail(sellerId),
    staleTime: 60_000,
  });
}

export function getSellerRatingsOptions(sellerIds: string[]) {
  const uniqueIds = [...new Set(sellerIds.filter(Boolean))];
  return queryOptions({
    enabled: uniqueIds.length > 0,
    queryFn: async (): Promise<Map<string, SellerRating>> => {
      if (uniqueIds.length === 0)
        return new Map();
      const { data, error } = await supabase
        .from('reviews')
        .select('reviewed_id, rating')
        .in('reviewed_id', uniqueIds);
      if (error)
        throw error;

      const map = new Map<string, SellerRating>();
      for (const id of uniqueIds) {
        const ratings = (data ?? []).filter(row => row.reviewed_id === id);
        map.set(id, {
          avgRating: ratings.length > 0
            ? ratings.reduce((sum, row) => sum + row.rating, 0) / ratings.length
            : 0,
          totalReviews: ratings.length,
        });
      }
      return map;
    },
    queryKey: sellerRatingQueryKey.list(uniqueIds),
    staleTime: 60_000,
  });
}
