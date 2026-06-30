import type { AdminUser, AdminUserStatus } from '@/types/adminUser.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listAdminUsers(
  parameters: {
    page?: number;
    search?: string;
    size?: number;
    status?: AdminUserStatus;
  } = {},
) {
  return authInstance
    .get('/api/v1/admin/users', {
      searchParams: {
        page: parameters.page ?? 1,
        search: parameters.search?.trim() || undefined,
        size: parameters.size ?? 100,
        status: parameters.status,
      },
    })
    .json<PaginatedResponse<AdminUser>>();
}

export function updateUserRole(userId: string, roleId: string) {
  return authInstance
    .patch(`/api/v1/admin/users/${userId}/role`, { json: { roleId } })
    .json<Response<AdminUser>>();
}
