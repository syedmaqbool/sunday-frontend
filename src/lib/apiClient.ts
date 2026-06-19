import { tokenStorage } from "./tokenStorage";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";

let isRefreshing = false;
let waitingQueue: Array<(newToken: string | null) => void> = [];

async function runRefresh(): Promise<string | null> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { Authorization: `Bearer ${refreshToken}` },
    });
    if (!res.ok) return null;
    const body = await res.json();
    const { accessToken, refreshToken: newRefresh } = body.data;
    tokenStorage.set(accessToken, newRefresh);
    return accessToken;
  } catch {
    return null;
  }
}

async function attemptRefresh(): Promise<string | null> {
  if (isRefreshing) {
    return new Promise((resolve) => waitingQueue.push(resolve));
  }
  isRefreshing = true;
  const newToken = await runRefresh();
  isRefreshing = false;
  waitingQueue.forEach((cb) => cb(newToken));
  waitingQueue = [];
  return newToken;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const hasBody = options.body !== undefined && options.body !== null;

  const makeHeaders = (token: string | null): Record<string, string> => ({
    // ← Fix: Content-Type sirf tab jab body ho (logout jaisi empty POST pe nahi)
    ...(hasBody ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string> | undefined),
  });

  let token = tokenStorage.getAccess();

  let res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: makeHeaders(token),
  });

  if (res.status === 401) {
    const newToken = await attemptRefresh();
    if (!newToken) {
      tokenStorage.clear();
      window.location.href = "/auth";
      throw new Error("Session expired. Please login again.");
    }
    token = newToken;
    res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: makeHeaders(token),
    });
  }

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message ?? `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

export const apiClient = {
  get:    <T>(path: string)                 => request<T>(path),
  post:   <T>(path: string, data?: unknown) => request<T>(path, { method: "POST",   body: data !== undefined ? JSON.stringify(data) : undefined }),
  patch:  <T>(path: string, data: unknown)  => request<T>(path, { method: "PATCH",  body: JSON.stringify(data) }),
  put:    <T>(path: string, data: unknown)  => request<T>(path, { method: "PUT",    body: JSON.stringify(data) }),
  delete: <T>(path: string)                 => request<T>(path, { method: "DELETE" }),
};