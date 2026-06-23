import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { preferencesService, PutPreferencesPayload } from "@/services/buyer/preferences.service";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

// ── QUERY KEYS ───────────────────────────────────────────────────────────────
const PREFS_KEYS = {
  all: ["preferences"] as const,
  current: () => [...PREFS_KEYS.all, "current"] as const,
  categories: () => [...PREFS_KEYS.all, "categories"] as const,
  subcategories: () => [...PREFS_KEYS.all, "subcategories"] as const,
  brands: () => [...PREFS_KEYS.all, "brands"] as const,
};

// ── 1. GET USER PREFERENCES QUERY ───────────────────────────────────────────
export const useGetPreferences = () => {
  return useQuery({
    queryKey: PREFS_KEYS.current(),
    queryFn: async () => {
      const res = await preferencesService.getPreferences();
      return res.data;
    },
    retry: false, // Signup ke foran baad agar data na ho to bar bar network requests bhej kar console bhar na de
  });
};

// ── 2. GET CATEGORIES QUERY ──────────────────────────────────────────────────
export const useBackendCategories = () => {
  return useQuery({
    queryKey: PREFS_KEYS.categories(),
    queryFn: async () => {
      const res = await preferencesService.getCategories();
      return res.data;
    },
    staleTime: 10 * 60 * 1000, // 10 mins tak cache fresh rahegi
  });
};

// ── 3. GET SUBCATEGORIES QUERY ───────────────────────────────────────────────
export const useBackendSubcategories = () => {
  return useQuery({
    queryKey: PREFS_KEYS.subcategories(),
    queryFn: async () => {
      const res = await preferencesService.getSubcategories();
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
  });
};

// ── 4. GET BRANDS QUERY (With Pagination & Aggregates Support) ───────────────
export const useBackendBrands = () => {
  return useQuery({
    queryKey: PREFS_KEYS.brands(),
    queryFn: async () => {
      const res = await preferencesService.getBrands();
      // Aapke naye JSON schema ke mutabik res.data.data se main brands array milegi
      return res.data;
    },
    staleTime: 10 * 60 * 1000,
  });
};

// ── 5. PUT/SAVE PREFERENCES MUTATION ─────────────────────────────────────────
export const useSavePreferences = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: PutPreferencesPayload) => preferencesService.putPreferences(payload),
    onSuccess: () => {
      toast({ title: "Preferences saved!", description: "Your feed is now personalized." });
      
      // Preferences save hote hi cache data invalidate hoga taake home page par updated feed dikhe
      queryClient.invalidateQueries({ queryKey: PREFS_KEYS.current() });
      
      // Direct redirect to main route
      navigate("/");
    },
    onError: (error: any) => {
      toast({ 
        title: "Error saving preferences", 
        description: error?.response?.data?.message || "Something went wrong", 
        variant: "destructive" 
      });
    },
  });
};