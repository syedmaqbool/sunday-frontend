import {
  queryOptions,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getBrands,
  getCategories,
  getPreferences,
  getSubcategories,
  putPreferences,
} from "@/services/buyer/preferences.service";
import type { PutPreferencesPayload } from "@/types/buyer-preferences";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// ── QUERY KEYS ───────────────────────────────────────────────────────────────
export const buyerPreferencesQueryKey = {
  all: ["preferences"] as const,
  current: () => [...buyerPreferencesQueryKey.all, "current"] as const,
  categories: () => [...buyerPreferencesQueryKey.all, "categories"] as const,
  subcategories: () =>
    [...buyerPreferencesQueryKey.all, "subcategories"] as const,
  brands: () => [...buyerPreferencesQueryKey.all, "brands"] as const,
};

// ── 1. GET USER PREFERENCES QUERY ───────────────────────────────────────────
export const getPreferencesOptions = () =>
  queryOptions({
    queryKey: buyerPreferencesQueryKey.current(),
    queryFn: async () => {
      const res = await getPreferences();
      return res.data;
    },
    retry: false, // Signup ke foran baad agar data na ho to bar bar network requests bhej kar console bhar na de
  });

export const useGetPreferences = () => useQuery(getPreferencesOptions());

// ── 2. GET CATEGORIES QUERY ──────────────────────────────────────────────────
export const getBackendCategoriesOptions = () =>
  queryOptions({
    queryKey: buyerPreferencesQueryKey.categories(),
    queryFn: async () => {
      const res = await getCategories();
      return res.data;
    },
    staleTime: 10 * 60 * 1000, // 10 mins tak cache fresh rahegi
  });

export const useBackendCategories = () =>
  useQuery(getBackendCategoriesOptions());

// ── 3. GET SUBCATEGORIES QUERY ───────────────────────────────────────────────
export const getBackendSubcategoriesOptions = () =>
  queryOptions({
    queryKey: buyerPreferencesQueryKey.subcategories(),
    queryFn: async () => {
      const res = await getSubcategories();
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
  });

export const useBackendSubcategories = () =>
  useQuery(getBackendSubcategoriesOptions());

// ── 4. GET BRANDS QUERY (With Pagination & Aggregates Support) ───────────────
export const getBackendBrandsOptions = () =>
  queryOptions({
    queryKey: buyerPreferencesQueryKey.brands(),
    queryFn: async () => {
      const res = await getBrands();
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
  });

export const useBackendBrands = () => useQuery(getBackendBrandsOptions());

// ── 5. PUT/SAVE PREFERENCES MUTATION ─────────────────────────────────────────
export const useSavePreferences = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: PutPreferencesPayload) => putPreferences(payload),
    onSuccess: () => {
      toast({
        title: "Preferences saved!",
        description: "Your feed is now personalized.",
      });

      // Preferences save hote hi cache data invalidate hoga taake home page par updated feed dikhe
      queryClient.invalidateQueries({
        queryKey: buyerPreferencesQueryKey.current(),
      });

      // Direct redirect to main route
      navigate("/");
    },
    onError: (error: any) => {
      toast({
        title: "Error saving preferences",
        description: error?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });
};
