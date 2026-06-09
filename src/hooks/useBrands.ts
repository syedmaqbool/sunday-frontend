import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Brand {
  id: string;
  name: string;
  active: boolean;
  sort_order: number;
}

export const useBrands = (includeInactive = false) =>
  useQuery({
    queryKey: ["brands", includeInactive],
    queryFn: async (): Promise<Brand[]> => {
      let query = supabase.from("brands").select("id, name, active, sort_order");
      if (!includeInactive) query = query.eq("active", true);
      const { data, error } = await query.order("sort_order").order("name");
      if (error) throw error;
      return (data ?? []) as Brand[];
    },
  });
