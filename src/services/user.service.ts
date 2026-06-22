import { apiClient } from "@/lib/apiClient";

export interface AdminUserImage {
  id: string;
  filename: string;
  mimetype: string;
  size: number;
  url: string;
}

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE";
  username: string;
  image: AdminUserImage | null;
  roleId: string | null;
  roleName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ListResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    lastPage: number;
    nextPage: number | null;
    prevPage: number | null;
    perPage: number;
    total: number;
  };
}

interface ItemResponse<T> {
  data: T;
}

export const userService = {
  list: (params: { page?: number; size?: number; search?: string; status?: "ACTIVE" | "INACTIVE" } = {}) => {
    const query = new URLSearchParams();
    query.set("page", String(params.page ?? 1));
    query.set("size", String(params.size ?? 100));
    if (params.search?.trim()) query.set("search", params.search.trim());
    if (params.status) query.set("status", params.status);
    return apiClient.get<ListResponse<AdminUser>>(`/api/v1/admin/users?${query.toString()}`);
  },

  updateRole: (userId: string, roleId: string) =>
    apiClient.patch<ItemResponse<AdminUser>>(`/api/v1/admin/users/${userId}/role`, { roleId }),
};

