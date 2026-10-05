import type {
  AdminUser,
  AdminUserAuditHistoryParameters,
  AdminUserAuditHistoryResponse,
  AdminUserDetails,
  AdminUsersParameters,
  CreateAdminUserInput,
  UpdateAdminUserProfileInput,
  UpdateAdminUserProfileResponse,
  UpdateAdminUserRolePayload,
} from '@/types/adminUser.type';
import type { PaginatedResponse, Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listAdminUsers(
  parameters: AdminUsersParameters = {},
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

export function getAdminUserById(userId: string) {
  return authInstance
    .get(`/api/v1/admin/users/${userId}`)
    .json<Response<AdminUserDetails>>();
}

export function getAdminUserAuditHistory(
  userId: string,
  parameters: AdminUserAuditHistoryParameters = {},
) {
  return authInstance
    .get(`/api/v1/admin/users/${userId}/audit-history`, {
      searchParams: {
        page: parameters.page ?? 1,
        size: parameters.size ?? 10,
      },
    })
    .json<AdminUserAuditHistoryResponse>();
}

export function createAdminUser(payload: CreateAdminUserInput) {
  return authInstance
    .post('/api/v1/admin/users', { json: payload })
    .json<Response<AdminUser>>();
}

export function updateUserRole(userId: string, roleId: UpdateAdminUserRolePayload['roleId']) {
  return authInstance
    .patch(`/api/v1/admin/users/${userId}/role`, { json: { roleId } satisfies UpdateAdminUserRolePayload })
    .json<Response<AdminUser>>();
}

export function updateAdminUserProfile(userId: string, payload: UpdateAdminUserProfileInput) {
  return authInstance
    .patch(`/api/v1/admin/users/${userId}`, { json: payload })
    .json<UpdateAdminUserProfileResponse>();
}
