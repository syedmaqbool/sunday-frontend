import { authInstance } from "@/services/ky.instance";
import type { AdminUser, AdminUserStatus } from "@/types/admin/user";
import type { PaginatedResponse, Response } from "@/types/response.type";

export function listAdminUsers(
  params: {
    page?: number;
    size?: number;
    search?: string;
    status?: AdminUserStatus;
  } = {},
) {
  return authInstance
    .get("/api/v1/admin/users", {
      searchParams: {
        page: params.page ?? 1,
        size: params.size ?? 100,
        search: params.search?.trim() || undefined,
        status: params.status,
      },
    })
    .json<PaginatedResponse<AdminUser>>();
}

export function updateUserRole(userId: string, roleId: string) {
  return authInstance
    .patch(`/api/v1/admin/users/${userId}/role`, { json: { roleId } })
    .json<Response<AdminUser>>();
}
