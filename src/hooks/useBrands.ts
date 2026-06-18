import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NEXT_PUBLIC_USE_MOCK_DATA } from "@/lib/mockConfig";

export interface Brand {
  id: string;
  name: string;
  active: boolean;
  sort_order: number;
}

//mock data
const MOCK_BRANDS: Brand[] = [
  { id: "brand-1", name: "Zara",    active: true,  sort_order: 1 },
  { id: "brand-2", name: "Nike",    active: true,  sort_order: 2 },
  { id: "brand-3", name: "H&M",     active: true,  sort_order: 3 },
  { id: "brand-4", name: "Mango",   active: true,  sort_order: 4 },
  { id: "brand-5", name: "Uniqlo",  active: true,  sort_order: 5 },
  { id: "brand-6", name: "Coach",   active: true,  sort_order: 6 },
  { id: "brand-7", name: "Levi's",  active: false, sort_order: 7 },
];

export const useBrands = (includeInactive = false) =>
  useQuery({
    queryKey: ["brands", includeInactive],
    queryFn: async (): Promise<Brand[]> => {
      if (NEXT_PUBLIC_USE_MOCK_DATA) {
        return includeInactive ? MOCK_BRANDS : MOCK_BRANDS.filter((b) => b.active);
      }
      let query = supabase.from("brands").select("id, name, active, sort_order");
      if (!includeInactive) query = query.eq("active", true);
      const { data, error } = await query.order("sort_order").order("name");
      if (error) throw error;
      return (data ?? []) as Brand[];
    },
  });