import type {
  CreateCategoryPayload,
  CreateSubcategoryPayload,
  UpdateCategoryPayload,
  UpdateSubcategoryPayload,
} from '@/types/adminCategory.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  listCategories,
  listSubcategories,
  updateCategory,
  updateSubcategory,
} from '@/services/adminCategoryManagement.service';

export const categoryManagementQueryKey = {
  all: () => ['admin-category-management'] as const,
  categories: () => [...categoryManagementQueryKey.all(), 'categories', 'list'] as const,
  subcategories: () =>
    [...categoryManagementQueryKey.all(), 'subcategories', 'list'] as const,
};

// ── Categories ────────────────────────────────────────────────────────────────
export function getAdminCategoriesOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await listCategories();
      return response.data;
    },
    queryKey: categoryManagementQueryKey.categories(),
  });
}

export function useCreateCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCategoryPayload) => createCategory(payload),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: categoryManagementQueryKey.categories(),
      }),
  });
}

export function useUpdateCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateCategoryPayload;
    }) => updateCategory(id, payload),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: categoryManagementQueryKey.categories(),
      }),
  });
}

export function useDeleteCategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: categoryManagementQueryKey.categories(),
      }),
  });
}

// ── Subcategories ─────────────────────────────────────────────────────────────
export function getAdminSubcategoriesOptions() {
  return queryOptions({
    queryFn: async () => {
      const response = await listSubcategories();
      return response.data;
    },
    queryKey: categoryManagementQueryKey.subcategories(),
  });
}

export function useCreateSubcategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSubcategoryPayload) => createSubcategory(payload),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: categoryManagementQueryKey.subcategories(),
      }),
  });
}

export function useUpdateSubcategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateSubcategoryPayload;
    }) => updateSubcategory(id, payload),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: categoryManagementQueryKey.subcategories(),
      }),
  });
}

export function useDeleteSubcategoryMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSubcategory(id),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: categoryManagementQueryKey.subcategories(),
      }),
  });
}
