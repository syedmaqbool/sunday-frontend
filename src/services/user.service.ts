import type {
  AdminUser,
  AdminUserRoleType,
  AdminUserStatus,
  CreateAdminUserInput,
} from '@/types/adminUser.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listAdminUsers(
  parameters: {
    page?: number;
    roleType?: AdminUserRoleType;
    search?: string;
    size?: number;
    status?: AdminUserStatus;
  } = {},
) {
  return authInstance
    .get('/api/v1/admin/users', {
      searchParams: {
        page: parameters.page ?? 1,
        roleType: parameters.roleType,
        search: parameters.search?.trim() || undefined,
        size: parameters.size ?? 100,
        status: parameters.status,
      },
    })
    .json<PaginatedResponse<AdminUser>>();
}

export function createAdminUser(payload: CreateAdminUserInput) {
  return authInstance
    .post('/api/v1/admin/users', { json: payload })
    .json<Response<AdminUser>>();
}

export function updateUserRole(userId: string, roleId: string) {
  return authInstance
    .patch(`/api/v1/admin/users/${userId}/role`, { json: { roleId } })
    .json<Response<AdminUser>>();
}
