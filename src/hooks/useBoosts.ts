import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { NEXT_PUBLIC_USE_MOCK_DATA } from "@/lib/mockConfig";

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

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_BOOST_PACKAGES: BoostPackage[] = [
  { id: "pkg-1", name: "Trending Boost · 3 Days",  placement: "trending", duration_days: 3,  price: 500,  description: "Show up in Trending Now for 3 days.",     active: true },
  { id: "pkg-2", name: "Trending Boost · 7 Days",  placement: "trending", duration_days: 7,  price: 1000, description: "Show up in Trending Now for a week.",     active: true },
  { id: "pkg-3", name: "For You Boost · 3 Days",   placement: "for_you",  duration_days: 3,  price: 450,  description: "Get featured in personalized feeds.",     active: true },
  { id: "pkg-4", name: "Search Boost · 3 Days",    placement: "search",   duration_days: 3,  price: 400,  description: "Rank higher in search & browse results.", active: true },
  { id: "pkg-5", name: "Search Boost · 7 Days",    placement: "search",   duration_days: 7,  price: 850,  description: "Rank higher in search for a full week.",  active: true },
];

const now = Date.now();
const MOCK_MY_BOOSTS: ListingBoost[] = [
  {
    id: "boost-1",
    listing_id: "mock-listing-1",
    seller_id: "mock-user-id",
    placement: "trending",
    starts_at: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(now + 1 * 24 * 60 * 60 * 1000).toISOString(),
    price_paid: 500,
    payment_status: "mock",
  },
  {
    id: "boost-2",
    listing_id: "mock-listing-5",
    seller_id: "mock-user-id",
    placement: "search",
    starts_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
    price_paid: 400,
    payment_status: "mock",
  },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

/** All active boosts across the marketplace, used to rank listings. */
export const useActiveBoosts = (placement?: BoostPlacement) => {
  return useQuery({
    queryKey: ["active-boosts", placement ?? "all"],
    queryFn: async (): Promise<ListingBoost[]> => {
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        const activeOnly = MOCK_MY_BOOSTS.filter((b) => new Date(b.ends_at).getTime() > Date.now());
        return placement ? activeOnly.filter((b) => b.placement === placement) : activeOnly;
      }
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
      if (NEXT_PUBLIC_USE_MOCK_DATA) return MOCK_BOOST_PACKAGES;
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
      if (NEXT_PUBLIC_USE_MOCK_DATA) return MOCK_MY_BOOSTS;
      const { data, error } = await supabase
        .from("listing_boosts" as any)
        .select("*")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as any[]) ?? [];
    },
    enabled: !!user || NEXT_PUBLIC_USE_MOCK_DATA,
  });
};