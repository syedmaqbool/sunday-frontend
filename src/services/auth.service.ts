import type {
  AuthMeResponse,
  AuthSessionResponse,
  RegisterData,
  ResetPasswordData,
} from '@/types/auth.type';
import type { Response } from '@/types/response.type';
import { authInstance } from './ky.instance';

export function login(payload: { email: string; password: string }) {
  return authInstance
    .post('api/v1/auth/login', {
      context: { skipAuthRefresh: true },
      json: payload,
    })
    .json<AuthSessionResponse>();
}

export function sendRegisterOtp(payload: { email: string }) {
  return authInstance.post('api/v1/auth/register-otp', {
    context: { skipAuthRefresh: true },
    json: payload,
  });
}

export function forgotPassword(payload: { email: string }) {
  return authInstance
    .post('api/v1/auth/forgot-password', {
      context: { skipAuthRefresh: true },
      json: payload,
    })
    .json<Response>();
}

export function register(payload: RegisterData) {
  return authInstance
    .post('api/v1/auth/register', {
      context: { skipAuthRefresh: true },
      json: payload,
    })
    .json<AuthSessionResponse>();
}

export function resetPassword(payload: ResetPasswordData) {
  return authInstance
    .post('api/v1/auth/reset-password', {
      context: { skipAuthRefresh: true },
      json: payload,
    })
    .json<Response>();
}

export function fetchAuthMe() {
  return authInstance.get('api/v1/auth/me').json<AuthMeResponse>();
}

export function logout() {
  return authInstance.post('api/v1/auth/logout').json<Response>();
}
