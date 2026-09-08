export const API_BASE_URL = (import.meta.env["VITE_API_URL"] as string | undefined) ?? "http://localhost:3000";
let apiToken: string | null = null;

export function setApiToken(token: string | null) {
  apiToken = token;
  if (typeof window !== "undefined") {
    if (token) localStorage.setItem("rooster.jwt", token);
    else localStorage.removeItem("rooster.jwt");
  }
}

export function setApiUserId(userId: string | null) {
  if (typeof window === "undefined") return;
  if (userId) localStorage.setItem("rooster.user-id", userId);
  else localStorage.removeItem("rooster.user-id");
}

export function getApiUserId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("rooster.user-id");
}

export async function getApiToken() {
  if (!apiToken && typeof window !== "undefined") apiToken = localStorage.getItem("rooster.jwt");
  if (apiToken) return apiToken;
  const email = (import.meta.env["VITE_API_EMAIL"] as string | undefined) ?? "admin@rooster.local";
  const senha = (import.meta.env["VITE_API_PASSWORD"] as string | undefined) ?? "Admin123!";
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, senha }),
  });
  if (!response.ok) throw new Error("Não foi possível autenticar na API.");
  const data = (await response.json()) as { accessToken: string };
  apiToken = data.accessToken;
  return apiToken;
}

export interface HttpClient {
  get<T>(path: string, params?: Record<string, unknown>, headers?: HeadersInit): Promise<T>;
  post<T>(path: string, body: unknown, headers?: HeadersInit): Promise<T>;
  patch<T>(path: string, body: unknown, headers?: HeadersInit): Promise<T>;
  delete<T>(path: string, headers?: HeadersInit): Promise<T>;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getApiToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
    body: init.body && typeof init.body !== "string" ? JSON.stringify(init.body) : init.body,
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : undefined;
  if (!response.ok) {
    const message = data && typeof data === "object" && "message" in data ? String(data.message) : `Erro ${response.status}`;
    throw new Error(message);
  }
  return data as T;
}

export const httpClient: HttpClient = {
  get: (path, params, headers) => {
    const query = params
      ? `?${new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined).map(([key, value]) => [key, String(value)]))}`
      : "";
    return request(path + query, { headers });
  },
  post: (path, body, headers) => request(path, { method: "POST", body, headers }),
  patch: (path, body, headers) => request(path, { method: "PATCH", body, headers }),
  delete: (path, headers) => request(path, { method: "DELETE", headers }),
};
