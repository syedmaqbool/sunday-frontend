import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CommissionTier } from "@/lib/commission";
import { NEXT_PUBLIC_USE_MOCK_DATA } from "@/lib/mockConfig";

const MOCK_COMMISSION_TIERS: CommissionTier[] = [
  { id: "tier-1", name: "Standard",       categories: [],                     min_price: 0,    max_price: 5000,  rate: 5,  active: true,  sort_order: 1 },
  { id: "tier-2", name: "Mid-range",      categories: [],                     min_price: 5001, max_price: 15000, rate: 7,  active: true,  sort_order: 2 },
  { id: "tier-3", name: "Premium",        categories: [],                     min_price: 15001,max_price: null,  rate: 10, active: true,  sort_order: 3 },
  { id: "tier-4", name: "Kids Wear",      categories: ["children", "kids"],   min_price: 0,    max_price: null,  rate: 3,  active: true,  sort_order: 4 },
  { id: "tier-5", name: "Luxury Brands",  categories: ["luxury", "designer"], min_price: 0,    max_price: null,  rate: 12, active: false, sort_order: 5 },
];

let mockCommissionStore = [...MOCK_COMMISSION_TIERS];

export const useCommissionTiers = (opts?: { onlyActive?: boolean }) =>
  useQuery<CommissionTier[]>({
    queryKey: ["commission-tiers", opts?.onlyActive ?? false],
    queryFn: async () => {
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        return opts?.onlyActive ? mockCommissionStore.filter((t) => t.active) : mockCommissionStore;
      }
      let q = supabase.from("commission_tiers" as any).select("*").order("sort_order");
      if (opts?.onlyActive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as CommissionTier[];
    },
    staleTime: 60_000,
  });

export const __mockCommissionStore = {
  get: () => mockCommissionStore,
  set: (next: CommissionTier[]) => {
    mockCommissionStore = next;
  },
};