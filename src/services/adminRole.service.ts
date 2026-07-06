import type { AdminPermission, AdminRole } from '@/types/adminRole.type';
import type { Response } from '@/types/response.type';
import { authInstance } from '@/services/ky.instance';

export function listAdminRoles() {
  return authInstance.get('/api/v1/admin/roles').json<Response<AdminRole[]>>();
}

export function createAdminRole(payload: {
  name: string;
  permissions: string[];
}) {
  return authInstance
    .post('/api/v1/admin/roles', { json: payload })
    .json<Response<AdminRole>>();
}

export function updateAdminRole(roleId: string, payload: { name: string }) {
  return authInstance
    .patch(`/api/v1/admin/roles/${roleId}`, { json: payload })
    .json<Response<AdminRole>>();
}

export function deleteAdminRole(roleId: string) {
  return authInstance.delete(`/api/v1/admin/roles/${roleId}`).json<Response>();
}

export function updateAdminRolePermissions(
  roleId: string,
  payload: { permissions: string[] },
) {
  return authInstance
    .put(`/api/v1/admin/roles/${roleId}/permissions`, { json: payload })
    .json<Response<AdminRole>>();
}

export function listAdminPermissions() {
  return authInstance
    .get('/api/v1/admin/permissions')
    .json<Response<AdminPermission[]>>();
}
