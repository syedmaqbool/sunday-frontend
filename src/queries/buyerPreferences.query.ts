import type { PutPreferencesPayload } from '@/types/buyerPreferences.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
  getBrands,
  getCategories,
  getPreferences,
  getSubcategories,
  putPreferences,
} from '@/services/buyerPreferences.service';

// ── QUERY KEYS ───────────────────────────────────────────────────────────────
export const buyerPreferencesQueryKey = {
  all: ['preferences'] as const,
  brands: () => [...buyerPreferencesQueryKey.all, 'brands'] as const,
  categories: () => [...buyerPreferencesQueryKey.all, 'categories'] as const,
  current: () => [...buyerPreferencesQueryKey.all, 'current'] as const,
  subcategories: () =>
    [...buyerPreferencesQueryKey.all, 'subcategories'] as const,
};

// ── 1. GET USER PREFERENCES QUERY ───────────────────────────────────────────
export function getPreferencesOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await getPreferences();
      return response.data;
    },
    queryKey: buyerPreferencesQueryKey.current(),
    retry: false, // Signup ke foran baad agar data na ho to bar bar network requests bhej kar console bhar na de
  });
}

// ── 2. GET CATEGORIES QUERY ──────────────────────────────────────────────────
export function getBackendCategoriesOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await getCategories();
      return response.data;
    },
    queryKey: buyerPreferencesQueryKey.categories(),
    staleTime: 10 * 60 * 1000, // 10 mins tak cache fresh rahegi
  });
}

// ── 3. GET SUBCATEGORIES QUERY ───────────────────────────────────────────────
export function getBackendSubcategoriesOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await getSubcategories();
      return response.data;
    },
    queryKey: buyerPreferencesQueryKey.subcategories(),
    staleTime: 10 * 60 * 1000,
  });
}

// ── 4. GET BRANDS QUERY (With Pagination & Aggregates Support) ───────────────
export function getBackendBrandsOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await getBrands();
      return response.data;
    },
    queryKey: buyerPreferencesQueryKey.brands(),
    staleTime: 10 * 60 * 1000,
  });
}

// ── 5. PUT/SAVE PREFERENCES MUTATION ─────────────────────────────────────────
export function useSavePreferencesMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (payload: PutPreferencesPayload) => putPreferences(payload),
    onError: (error: any) => {
      toast({
        description: error?.response?.data?.message || 'Something went wrong',
        title: 'Error saving preferences',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        description: 'Your feed is now personalized.',
        title: 'Preferences saved!',
      });

      // Preferences save hote hi cache data invalidate hoga taake home page par updated feed dikhe
      queryClient.invalidateQueries({
        queryKey: buyerPreferencesQueryKey.current(),
      });

      // Direct redirect to main route
      navigate('/');
    },
  });
}




