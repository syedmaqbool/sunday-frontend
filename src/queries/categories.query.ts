import type { PaginatedResponse } from '@/types/response.type';
import { queryOptions } from '@tanstack/react-query';
import { authInstance } from '@/services/ky.instance';

export interface Category {
  id: string;
  icon: string;
  label: string;
  sortOrder: number;
  value: string;
}

export interface Subcategory {
  id: string;
  icon: string;
  label: string;
  sortOrder: number;
  value: string;
}

export const categoriesQueryKey = {
  all: () => ['categories'] as const,
  categories: () => [...categoriesQueryKey.all(), 'list'] as const,
  subcategories: (categoryId?: string) =>
    [...categoriesQueryKey.all(), 'subcategories', 'list', categoryId ?? null] as const,
};

export function getCategoriesOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await authInstance
        .get('/api/v1/categories', { searchParams: { page: 1, size: 100 } })
        .json<PaginatedResponse<Category>>();
      return response.data;
    },
    queryKey: categoriesQueryKey.categories(),
    staleTime: 5 * 60 * 1000,
  });
}

export function getSubcategoriesOptions(categoryId?: string) {
  return queryOptions({
    enabled: !!categoryId,
    queryFn: async () => {
      const response = await authInstance
        .get('/api/v1/subcategories', {
          searchParams: {
            categoryId,
            page: 1,
            size: 100,
          },
        })
        .json<PaginatedResponse<Subcategory>>();

      return response.data;
    },
    queryKey: categoriesQueryKey.subcategories(categoryId),
  });
}
