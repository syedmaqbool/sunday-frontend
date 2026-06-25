import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface SellerRating {
  avgRating: number;
  totalReviews: number;
}

export function useSellerRating(sellerId: string | undefined) {
  return useQuery({
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
          ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
          : 0,
        totalReviews: ratings.length,
      };
    },
    queryKey: ['seller-rating', sellerId],
    staleTime: 60_000,
  });
}

// Batch version for listing cards
export function useSellerRatings(sellerIds: string[]) {
  const uniqueIds = [...new Set(sellerIds.filter(Boolean))];
  return useQuery({
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
        const ratings = (data ?? []).filter(r => r.reviewed_id === id);
        map.set(id, {
          avgRating: ratings.length > 0
            ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
            : 0,
          totalReviews: ratings.length,
        });
      }
      return map;
    },
    queryKey: ['seller-ratings', uniqueIds.toSorted((a, b) => a.localeCompare(b)).join(',')],
    staleTime: 60_000,
  });
}
