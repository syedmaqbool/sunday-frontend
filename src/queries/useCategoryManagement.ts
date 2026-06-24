import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createCategory,
  createSubcategory,
  deleteCategory,
  deleteSubcategory,
  listCategories,
  listSubcategories,
  updateCategory,
  updateSubcategory,
} from "@/services/adminCategoryManagement.service";

export const categoryManagementQueryKey = {
  categories: () => ["admin-categories"] as const,
  subcategories: () => ["admin-subcategories"] as const,
};

// ── Categories ────────────────────────────────────────────────────────────────
export const getAdminCategoriesOptions = () =>
  queryOptions({
    queryKey: categoryManagementQueryKey.categories(),
    queryFn: async () => {
      const res = await listCategories();
      return res.data;
    },
  });

export const useAdminCategories = () => useQuery(getAdminCategoriesOptions());

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      label: string;
      value: string;
      icon?: string;
      sortOrder?: number;
    }) => createCategory(payload),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: categoryManagementQueryKey.categories(),
      }),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: { label?: string; icon?: string; sortOrder?: number };
    }) => updateCategory(id, payload),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: categoryManagementQueryKey.categories(),
      }),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: categoryManagementQueryKey.categories(),
      }),
  });
};

// ── Subcategories ─────────────────────────────────────────────────────────────
export const getAdminSubcategoriesOptions = () =>
  queryOptions({
    queryKey: categoryManagementQueryKey.subcategories(),
    queryFn: async () => {
      const res = await listSubcategories();
      return res.data;
    },
  });

export const useAdminSubcategories = () =>
  useQuery(getAdminSubcategoriesOptions());

export const useCreateSubcategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      categoryId: string;
      label: string;
      value: string;
      icon?: string;
      sortOrder?: number;
    }) => createSubcategory(payload),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: categoryManagementQueryKey.subcategories(),
      }),
  });
};

export const useUpdateSubcategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        label?: string;
        icon?: string;
        sortOrder?: number;
        categoryId?: string;
      };
    }) => updateSubcategory(id, payload),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: categoryManagementQueryKey.subcategories(),
      }),
  });
};

export const useDeleteSubcategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSubcategory(id),
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: categoryManagementQueryKey.subcategories(),
      }),
  });
};
