import type { Response } from "./response.type";

export interface AuthUser {
  id: string;
  email: string;
  permissions: Array<{ id: string; name: string }>;
  [key: string]: unknown;
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
  fullName: string;
  email: string;
  password: string;
  phone: string;
  dateOfBirth: string;
  address?: string;
  marketingEmailConsent?: boolean;
  termsAccepted: true;
}

export interface AuthSessionData extends AuthSession {
  user: AuthUser;
  profile: AuthProfile;
  preferences: AuthPreferences;
}

export type AuthSessionResponse = Response<AuthSessionData>;

export type AuthMeResponse = Response<{
  user: AuthUser;
  profile: AuthProfile;
  preferences: AuthPreferences;
}>;
