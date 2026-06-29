import type { PaginatedResponse } from '@/types/response.type';
import { useQuery } from '@tanstack/react-query';
import { authInstance } from '@/services/ky.instance';

export interface Category {
  id: string;
  icon: string;
  label: string;
  sortOrder: number;
  value: string;
}

export interface Subcategory {
  id:            string;
  icon:          string;
  label:         string;
  sortOrder:     number;
  value:         string;
}

export function useCategories() {
  return useQuery<Category[]>({
    queryFn: async () => {
      const response = await authInstance
        .get('/api/v1/categories', { searchParams: { page: 1, size: 100 } })
        .json<PaginatedResponse<Category>>();
      return response.data;
    },
    queryKey: ['categories'],
    staleTime: 5 * 60 * 1000,
  });
}

export function useSubcategories(categoryId?: string) {
  return useQuery<Subcategory[]>({
    queryKey: ["subcategories", categoryId],
    enabled: !!categoryId,
    queryFn: async () => {
      const response = await authInstance
        .get("/api/v1/subcategories", {
          searchParams: {
            page: 1,
            size: 100,
            categoryId,
          },
        })
        .json<PaginatedResponse<Subcategory>>();

      return response.data;
    },
  });
}