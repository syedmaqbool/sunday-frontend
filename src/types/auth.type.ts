import type { ApiRequestBody, ApiResponseData, ApiSuccessResponse } from './api.type';
import type {
  ForgotUserPasswordData,
  GetCurrentUserResponses,
  LoginUserData,
  LoginUserResponses,
  ProcessUnsubscribeTokenData,
  RefreshUserTokenResponses,
  RegisterUserData,
  ResetUserPasswordData,
  SendRegisterOtpData,
} from '@/types/generated-api';

export type AuthSessionData = ApiResponseData<LoginUserResponses>;
export type LoginPayload = ApiRequestBody<LoginUserData>;
export type RegisterOtpPayload = ApiRequestBody<SendRegisterOtpData>;
export type ForgotPasswordPayload = ApiRequestBody<ForgotUserPasswordData>;
export type ProcessUnsubscribePayload = ApiRequestBody<ProcessUnsubscribeTokenData>;
export type AuthSession = Pick<AuthSessionData, 'accessToken' | 'refreshToken'>;
export type AuthUser = AuthSessionData['user'];
export type AuthProfile = AuthSessionData['profile'];
export type AuthPreferences = AuthSessionData['preferences'];
export type RegisterData = ApiRequestBody<RegisterUserData>;
export type ResetPasswordData = ApiRequestBody<ResetUserPasswordData>;
export type AuthSessionResponse = ApiSuccessResponse<LoginUserResponses | RefreshUserTokenResponses>;
export type AuthMeResponse = ApiSuccessResponse<GetCurrentUserResponses>;
