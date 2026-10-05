import type {
  ApiRequestBody,
  ApiRequestQuery,
  ApiResponseData,
  ApiResponseItem,
  ApiSuccessResponse,
} from './api.type';
import type {
  CreateAdminUserData,
  GetAdminUserAuditHistoryData,
  GetAdminUserAuditHistoryResponses,
  GetAdminUserByIdResponses,
  GetAdminUsersData,
  GetAdminUsersResponses,
  UpdateAdminUserProfileData,
  UpdateAdminUserProfileResponses,
  UpdateAdminUserRoleData,
} from '@/types/generated-api';

export type AdminUser = ApiResponseItem<GetAdminUsersResponses>;
export type AdminUserDetails = ApiResponseData<GetAdminUserByIdResponses>;
export type AdminUserImage = AdminUser['image'];
export type AdminUserStatus = AdminUser['status'];
export type AdminUserAuditEvent = ApiResponseItem<GetAdminUserAuditHistoryResponses>;
export type AdminUserAuditHistoryResponse = ApiSuccessResponse<GetAdminUserAuditHistoryResponses>;
export type AdminUserAuditHistoryParameters = Partial<ApiRequestQuery<GetAdminUserAuditHistoryData>>;
export type UpdateAdminUserProfileResponse = ApiSuccessResponse<UpdateAdminUserProfileResponses>;
export type AdminUserRoleType = NonNullable<ApiRequestQuery<GetAdminUsersData>['roleType']>;
export type CreateAdminUserInput = ApiRequestBody<CreateAdminUserData>;
export type UpdateAdminUserProfileInput = ApiRequestBody<UpdateAdminUserProfileData>;
export type UpdateAdminUserRolePayload = ApiRequestBody<UpdateAdminUserRoleData>;
export type AdminUsersParameters = Partial<ApiRequestQuery<GetAdminUsersData>>;
