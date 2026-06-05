const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000";
const DEFAULT_TOKEN = "dev-local-token-change-me";

function getToken(): string | null {
  return localStorage.getItem("auth_token") ?? null;
}

function getAuthHeaders(): HeadersInit {
  const token = getToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...getAuthHeaders(), ...options?.headers },
    credentials: "include",
  });
  if (res.status === 401) {
    await authWithToken(DEFAULT_TOKEN);
    const retry = await fetch(`${BASE_URL}${path}`, {
      ...options,
      headers: { ...getAuthHeaders(), ...options?.headers },
      credentials: "include",
    });
    if (!retry.ok) {
      const err = await retry.json().catch(() => ({ error: { message: retry.statusText } }));
      throw new Error(err.error?.message ?? retry.statusText);
    }
    return retry.json();
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err.error?.message ?? res.statusText);
  }
  return res.json();
}

export async function authWithToken(token: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/local-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (res.ok) {
    localStorage.setItem("auth_token", token);
  }
}

export async function initAuth(): Promise<void> {
  await authWithToken(DEFAULT_TOKEN);
}

class HttpClient {
  async get<T>(path: string): Promise<T> {
    return apiFetch<T>(path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return apiFetch<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    return apiFetch<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(path: string): Promise<T> {
    return apiFetch<T>(path, { method: "DELETE" });
  }
}

export const http = new HttpClient();

export function getSSEUrl(): string {
  return import.meta.env.VITE_SSE_URL ?? `${BASE_URL}/api/v1/events/stream`;
}
