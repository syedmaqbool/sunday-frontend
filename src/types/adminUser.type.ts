import type { ApiRequestBody, ApiRequestQuery, ApiResponseItem } from './api.type';
import type {
  CreateAdminUserData,
  GetAdminUsersData,
  GetAdminUsersResponses,
  UpdateAdminUserRoleData,
} from '@/types/generated-api';

export type AdminUser = ApiResponseItem<GetAdminUsersResponses>;
export type AdminUserImage = AdminUser['image'];
export type AdminUserStatus = AdminUser['status'];
export type AdminUserRoleType = NonNullable<ApiRequestQuery<GetAdminUsersData>['roleType']>;
export type CreateAdminUserInput = ApiRequestBody<CreateAdminUserData>;
export type UpdateAdminUserRolePayload = ApiRequestBody<UpdateAdminUserRoleData>;
export type AdminUsersParameters = Partial<ApiRequestQuery<GetAdminUsersData>>;
