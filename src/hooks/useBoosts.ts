import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type BoostPlacement = "trending" | "for_you" | "search";

export interface BoostPackage {
  id: string;
  name: string;
  placement: BoostPlacement;
  duration_days: number;
  price: number;
  description: string;
  active: boolean;
}

export interface ListingBoost {
  id: string;
  listing_id: string;
  seller_id: string;
  placement: BoostPlacement;
  starts_at: string;
  ends_at: string;
  price_paid: number;
  payment_status: string;
}

/** All active boosts across the marketplace, used to rank listings. */
export const useActiveBoosts = (placement?: BoostPlacement) => {
  return useQuery({
    queryKey: ["active-boosts", placement ?? "all"],
    queryFn: async (): Promise<ListingBoost[]> => {
      let q = supabase
        .from("listing_boosts" as any)
        .select("*")
        .gt("ends_at", new Date().toISOString())
        .in("payment_status", ["paid", "mock"]);
      if (placement) q = q.eq("placement", placement);
      const { data, error } = await q;
      if (error) throw error;
      return (data as any[]) ?? [];
    },
    staleTime: 60_000,
  });
};

/** Map of listing_id -> boost score for a given placement. */
export const useBoostScoreMap = (placement: BoostPlacement) => {
  const { data: boosts = [] } = useActiveBoosts(placement);
  const map = new Map<string, number>();
  for (const b of boosts) map.set(b.listing_id, (map.get(b.listing_id) ?? 0) + 1);
  return map;
};

/** Sort: boosted listings first, preserve existing order otherwise. */
export const applyBoostRanking = <T extends { id: string }>(
  listings: T[],
  boostMap: Map<string, number>
): T[] => {
  return [...listings].sort((a, b) => (boostMap.get(b.id) ?? 0) - (boostMap.get(a.id) ?? 0));
};

export const useBoostPackages = () => {
  return useQuery({
    queryKey: ["boost-packages"],
    queryFn: async (): Promise<BoostPackage[]> => {
      const { data, error } = await supabase
        .from("boost_packages" as any)
        .select("*")
        .eq("active", true)
        .order("placement")
        .order("duration_days");
      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });
};

export const useMyBoosts = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["my-boosts", user?.id],
    queryFn: async (): Promise<ListingBoost[]> => {
      const { data, error } = await supabase
        .from("listing_boosts" as any)
        .select("*")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) ?? [];
    },
    enabled: !!user,
  });
};
