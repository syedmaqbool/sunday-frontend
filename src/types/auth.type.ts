import type { Response } from './response.type';

export interface AuthUser {
  id: string;
  [key: string]: unknown;
  email: string;
  permissions: Array<{ id: string; name: string }>;
  roleName?: string | null;
}

export interface AuthProfile {
  [key: string]: unknown;
}

export interface AuthPreferences {
  [key: string]: unknown;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterData {
  address?: string;
  dateOfBirth: string;
  email: string;
  fullName: string;
  marketingEmailConsent?: boolean;
  otp: string;
  password: string;
  phone: string;
  termsAccepted: true;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  password: string;
}

export interface AuthSessionData extends AuthSession {
  preferences: AuthPreferences;
  profile: AuthProfile;
  user: AuthUser;
}

export type AuthSessionResponse = Response<AuthSessionData>;

export type AuthMeResponse = Response<{
  preferences: AuthPreferences;
  profile: AuthProfile;
  user: AuthUser;
}>;
