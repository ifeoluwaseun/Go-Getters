const rawApiUrl = import.meta.env.VITE_API_URL;
const API_BASE = rawApiUrl 
  ? (rawApiUrl.endsWith("/api") ? rawApiUrl : `${rawApiUrl.replace(/\/$/, "")}/api`) 
  : "/api";

function getToken(): string | null {
  return localStorage.getItem("gg_token");
}

export function setToken(token: string) {
  localStorage.setItem("gg_token", token);
}

export function clearToken() {
  localStorage.removeItem("gg_token");
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  get: <T = unknown>(path: string) => apiFetch<T>(path),
  post: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined }),
  patch: <T = unknown>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined }),
  del: <T = unknown>(path: string) =>
    apiFetch<T>(path, { method: "DELETE" }),
};
