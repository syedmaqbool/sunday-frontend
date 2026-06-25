import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
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
  categories: () => ['admin-categories'] as const,
  subcategories: () => ['admin-subcategories'] as const,
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

export const useAdminCategories = () => useQuery(getAdminCategoriesOptions());

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      icon?: string;
      label: string;
      sortOrder?: number;
      value: string;
    }) => createCategory(payload),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: categoryManagementQueryKey.categories(),
      }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { icon?: string; label?: string; sortOrder?: number };
    }) => updateCategory(id, payload),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: categoryManagementQueryKey.categories(),
      }),
  });
}

export function useDeleteCategory() {
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

export function useAdminSubcategories() {
  return useQuery(getAdminSubcategoriesOptions());
}

export function useCreateSubcategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      categoryId: string;
      icon?: string;
      label: string;
      sortOrder?: number;
      value: string;
    }) => createSubcategory(payload),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: categoryManagementQueryKey.subcategories(),
      }),
  });
}

export function useUpdateSubcategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        categoryId?: string;
        icon?: string;
        label?: string;
        sortOrder?: number;
      };
    }) => updateSubcategory(id, payload),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: categoryManagementQueryKey.subcategories(),
      }),
  });
}

export function useDeleteSubcategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSubcategory(id),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: categoryManagementQueryKey.subcategories(),
      }),
  });
}
