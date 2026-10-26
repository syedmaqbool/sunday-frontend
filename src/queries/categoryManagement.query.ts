import type {
  CreateCategoryPayload,
  CreateClothingTypePayload,
  CreateSubcategoryPayload,
  UpdateCategoryPayload,
  UpdateClothingTypePayload,
  UpdateSubcategoryPayload,
} from '@/types/adminCategory.type';
import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createCategory,
  createClothingType,
  createSubcategory,
  deleteCategory,
  deleteClothingType,
  deleteSubcategory,
  listCategories,
  listClothingTypes,
  listSubcategories,
  updateCategory,
  updateClothingType,
  updateSubcategory,
} from '@/services/adminCategoryManagement.service';

const CLOTHING_TYPE_PAGE_SIZE = 100;

export const categoryManagementQueryKey = {
  all: () => ['admin-category-management'] as const,
  categories: () => [...categoryManagementQueryKey.all(), 'categories', 'list'] as const,
  clothingTypes: () => [...categoryManagementQueryKey.all(), 'clothing-types', 'list'] as const,
  subcategories: () => [...categoryManagementQueryKey.all(), 'subcategories', 'list'] as const,
};

export function getAdminClothingTypesOptions() {
  return queryOptions({
    queryFn: async () => {
      const firstPage = await listClothingTypes({ page: 1, size: CLOTHING_TYPE_PAGE_SIZE });
      const pages = [firstPage];

      for (let page = 2; page <= firstPage.pagination.lastPage; page += 1) {
        const response = await listClothingTypes({ page, size: CLOTHING_TYPE_PAGE_SIZE });
        pages.push(response);
      }

      return pages;
    },
    queryKey: categoryManagementQueryKey.clothingTypes(),
  });
}

export function useCreateClothingTypeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateClothingTypePayload) => createClothingType(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryManagementQueryKey.clothingTypes() }),
  });
}

export function useUpdateClothingTypeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateClothingTypePayload }) =>
      updateClothingType(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryManagementQueryKey.clothingTypes() }),
  });
}

export function useDeleteClothingTypeMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteClothingType(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: categoryManagementQueryKey.clothingTypes() }),
  });
}

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
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCategoryPayload }) =>
      updateCategory(id, payload),
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
    mutationFn: ({ id, payload }: { id: string; payload: UpdateSubcategoryPayload }) =>
      updateSubcategory(id, payload),
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
