
import { apiClient } from "@/lib/apiClient";

export interface Brand {
  id: string;
  name: string;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBrandPayload {
  name: string;
  active?: boolean;
  sortOrder?: number;
}

export interface UpdateBrandPayload {
  name?: string;
  active?: boolean;
  sortOrder?: number;
}

interface ListResponse<T> {
  data: T[];
  pagination: unknown;
}

interface ItemResponse<T> {
  data: T;
}

export const brandService = {
  list: () =>
    apiClient.get<ListResponse<Brand>>("/api/v1/admin/brands"),

  getById: (brandId: string) =>
    apiClient.get<ItemResponse<Brand>>(`/api/v1/admin/brands/${brandId}`),

  create: (payload: CreateBrandPayload) =>
    apiClient.post<ItemResponse<Brand>>("/api/v1/admin/brands", payload),

  update: (brandId: string, payload: UpdateBrandPayload) =>
    apiClient.patch<ItemResponse<Brand>>(
      `/api/v1/admin/brands/${brandId}`,
      payload
    ),

  delete: (brandId: string) =>
    apiClient.delete<void>(`/api/v1/admin/brands/${brandId}`),
};

