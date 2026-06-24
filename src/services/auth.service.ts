import type {
  AuthMeResponse,
  AuthSessionResponse,
  RegisterData,
} from "@/types/auth";
import type { Response } from "@/types/response.type";
import { authInstance } from "./ky.instance";

export function login(payload: { email: string; password: string }) {
  return authInstance
    .post("api/v1/auth/login", {
      context: { skipAuthRefresh: true },
      json: payload,
    })
    .json<AuthSessionResponse>();
}

export function register(payload: RegisterData) {
  return authInstance
    .post("api/v1/auth/register", {
      context: { skipAuthRefresh: true },
      json: payload,
    })
    .json<AuthSessionResponse>();
}

export function fetchAuthMe() {
  return authInstance.get("api/v1/auth/me").json<AuthMeResponse>();
}

export function logout() {
  return authInstance.post("api/v1/auth/logout").json<Response>();
}
