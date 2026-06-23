import { apiClient } from "@/lib/apiClient";

export interface Category {
  id:        string;
  icon:      string;
  label:     string;
  sortOrder: number;
  value:     string;
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  id:             string;
  categoryId:     string;
  categoryLabel:  string;
  categoryValue:  string;
  icon:           string;
  label:          string;
  sortOrder:      number;
  value:          string;
  createdAt:      string;
  updatedAt:      string;
}

interface ListResponse<T> { data: T[]; pagination: unknown; }
interface ItemResponse<T> { data: T; }

export const categoryService = {
  list: () =>
    apiClient.get<ListResponse<Category>>("/api/v1/admin/categories"),

  create: (payload: { label: string; value: string; icon?: string; sortOrder?: number }) =>
    apiClient.post<ItemResponse<Category>>("/api/v1/admin/categories", payload),

  update: (categoryId: string, payload: { label?: string; icon?: string; sortOrder?: number }) =>
    apiClient.patch<ItemResponse<Category>>(
      `/api/v1/admin/categories/${categoryId}`,
      payload,
    ),

  delete: (categoryId: string) =>
    apiClient.delete<void>(`/api/v1/admin/categories/${categoryId}`),
};

export const subcategoryService = {
  list: () =>
    apiClient.get<ListResponse<Subcategory>>("/api/v1/admin/subcategories"),

  create: (payload: { categoryId: string; label: string; value: string; icon?: string; sortOrder?: number }) =>
    apiClient.post<ItemResponse<Subcategory>>("/api/v1/admin/subcategories", payload),

  update: (subcategoryId: string, payload: { label?: string; icon?: string; sortOrder?: number; categoryId?: string }) =>
    apiClient.patch<ItemResponse<Subcategory>>(
      `/api/v1/admin/subcategories/${subcategoryId}`,
      payload,
    ),

  delete: (subcategoryId: string) =>
    apiClient.delete<void>(`/api/v1/admin/subcategories/${subcategoryId}`),
};