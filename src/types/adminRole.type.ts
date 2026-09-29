import type { ApiRequestBody, ApiResponseItem } from './api.type';
import type {
  CreateAdminRoleData,
  GetAdminPermissionsResponses,
  GetAdminRolesResponses,
  UpdateAdminRoleData,
  UpdateAdminRolePermissionsData,
} from '@/types/generated-api';

export type AdminPermission = ApiResponseItem<GetAdminPermissionsResponses>;
export type AdminRole = ApiResponseItem<GetAdminRolesResponses>;
export type AdminPermissionName = AdminRole['permissions'][number]['name'];
export type AssignableAdminPermissionName = ApiRequestBody<CreateAdminRoleData>['permissions'][number];
export type CreateAdminRolePayload = ApiRequestBody<CreateAdminRoleData>;
export type UpdateAdminRolePayload = ApiRequestBody<UpdateAdminRoleData>;
export type UpdateAdminRolePermissionsPayload = ApiRequestBody<UpdateAdminRolePermissionsData>;
