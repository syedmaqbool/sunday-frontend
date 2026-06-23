import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  categoryService,
  subcategoryService,
} from "@/services/adminCategoryManagement.service";

const CATS_KEY  = ["admin-categories"];
const SUBS_KEY  = ["admin-subcategories"];

// ── Categories ────────────────────────────────────────────────────────────────
export const useAdminCategories = () =>
  useQuery({
    queryKey: CATS_KEY,
    queryFn: async () => {
      const res = await categoryService.list();
      return res.data;
    },
  });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { label: string; value: string; icon?: string; sortOrder?: number }) =>
      categoryService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: CATS_KEY }),
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { label?: string; icon?: string; sortOrder?: number } }) =>
      categoryService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: CATS_KEY }),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoryService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CATS_KEY }),
  });
};

// ── Subcategories ─────────────────────────────────────────────────────────────
export const useAdminSubcategories = () =>
  useQuery({
    queryKey: SUBS_KEY,
    queryFn: async () => {
      const res = await subcategoryService.list();
      return res.data;
    },
  });

export const useCreateSubcategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { categoryId: string; label: string; value: string; icon?: string; sortOrder?: number }) =>
      subcategoryService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUBS_KEY }),
  });
};

export const useUpdateSubcategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { label?: string; icon?: string; sortOrder?: number; categoryId?: string } }) =>
      subcategoryService.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUBS_KEY }),
  });
};

export const useDeleteSubcategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => subcategoryService.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUBS_KEY }),
  });
};