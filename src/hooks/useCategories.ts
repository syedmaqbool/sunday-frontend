import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Category = { id: string; label: string; value: string; icon: string; sort_order: number };
export type Subcategory = Category;

export const useCategories = () =>
  useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as Category[];
    },
    staleTime: 5 * 60 * 1000,
  });

export const useSubcategories = () =>
  useQuery<Subcategory[]>({
    queryKey: ["subcategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subcategories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as Subcategory[];
    },
    staleTime: 5 * 60 * 1000,
  });
