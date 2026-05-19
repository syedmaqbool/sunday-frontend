import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CommissionTier } from "@/lib/commission";

export const useCommissionTiers = (opts?: { onlyActive?: boolean }) =>
  useQuery<CommissionTier[]>({
    queryKey: ["commission-tiers", opts?.onlyActive ?? false],
    queryFn: async () => {
      let q = supabase.from("commission_tiers" as any).select("*").order("sort_order");
      if (opts?.onlyActive) q = q.eq("active", true);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as CommissionTier[];
    },
    staleTime: 60_000,
  });
