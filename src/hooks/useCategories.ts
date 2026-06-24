import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { NEXT_PUBLIC_USE_MOCK_DATA } from "@/lib/mockConfig";

export type Category = {
  id: string;
  label: string;
  value: string;
  icon: string;
  sort_order: number;
};
export type Subcategory = Category;

const MOCK_CATEGORIES: Category[] = [
  {
    id: "mock-cat-1",
    label: "Women",
    value: "women",
    icon: "👗",
    sort_order: 1,
  },
  { id: "mock-cat-2", label: "Men", value: "men", icon: "👔", sort_order: 2 },
  {
    id: "mock-cat-3",
    label: "Children",
    value: "children",
    icon: "🧸",
    sort_order: 3,
  },
];

const MOCK_SUBCATEGORIES: Subcategory[] = [
  { id: "mock-sub-1", label: "Tops", value: "tops", icon: "👕", sort_order: 1 },
  {
    id: "mock-sub-2",
    label: "Bottoms",
    value: "bottoms",
    icon: "👖",
    sort_order: 2,
  },
  {
    id: "mock-sub-3",
    label: "Dresses",
    value: "dresses",
    icon: "👗",
    sort_order: 3,
  },
  {
    id: "mock-sub-4",
    label: "Shoes",
    value: "shoes",
    icon: "👟",
    sort_order: 4,
  },
  {
    id: "mock-sub-5",
    label: "Jackets",
    value: "jackets",
    icon: "🧥",
    sort_order: 5,
  },
];

export const useCategories = () =>
  useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      if (NEXT_PUBLIC_USE_MOCK_DATA) return MOCK_CATEGORIES;
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
      if (NEXT_PUBLIC_USE_MOCK_DATA) return MOCK_SUBCATEGORIES;
      const { data, error } = await supabase
        .from("subcategories")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data as Subcategory[];
    },
    staleTime: 5 * 60 * 1000,
  });
