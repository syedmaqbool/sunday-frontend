import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SellerRating {
  avgRating: number;
  totalReviews: number;
}

export const useSellerRating = (sellerId: string | undefined) => {
  return useQuery({
    queryKey: ["seller-rating", sellerId],
    queryFn: async (): Promise<SellerRating> => {
      const { data, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("reviewed_id", sellerId!);
      if (error) throw error;
      const ratings = data ?? [];
      return {
        avgRating: ratings.length
          ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
          : 0,
        totalReviews: ratings.length,
      };
    },
    enabled: !!sellerId,
    staleTime: 60_000,
  });
};

// Batch version for listing cards
export const useSellerRatings = (sellerIds: string[]) => {
  const uniqueIds = [...new Set(sellerIds.filter(Boolean))];
  return useQuery({
    queryKey: ["seller-ratings", uniqueIds.sort().join(",")],
    queryFn: async (): Promise<Map<string, SellerRating>> => {
      if (!uniqueIds.length) return new Map();
      const { data, error } = await supabase
        .from("reviews")
        .select("reviewed_id, rating")
        .in("reviewed_id", uniqueIds);
      if (error) throw error;

      const map = new Map<string, SellerRating>();
      for (const id of uniqueIds) {
        const ratings = (data ?? []).filter((r) => r.reviewed_id === id);
        map.set(id, {
          avgRating: ratings.length
            ? ratings.reduce((s, r) => s + r.rating, 0) / ratings.length
            : 0,
          totalReviews: ratings.length,
        });
      }
      return map;
    },
    enabled: uniqueIds.length > 0,
    staleTime: 60_000,
  });
};
