// Placeholder for the future real HTTP client.
//
// When the backend (NestJS REST API) is ready, replace the mock services in
// `src/services/mock-api/*` with implementations that call this client instead
// of reading from `src/mock/database`. The public method signatures
// (getAll/getById/create/update/remove/search) were designed to map 1:1 onto
// REST endpoints, so screens should not need to change.
//
// Example of the intended shape:
//
// export const http = {
//   get:    <T>(path: string, params?: Record<string, unknown>) => fetch(...).then(r => r.json() as Promise<T>),
//   post:   <T>(path: string, body: unknown) => fetch(...).then(r => r.json() as Promise<T>),
//   patch:  <T>(path: string, body: unknown) => fetch(...).then(r => r.json() as Promise<T>),
//   delete: <T>(path: string) => fetch(...).then(r => r.json() as Promise<T>),
// };
//
// const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export const API_BASE_URL = "http://localhost:3000/api";

export interface HttpClient {
  get<T>(path: string, params?: Record<string, unknown>): Promise<T>;
  post<T>(path: string, body: unknown): Promise<T>;
  patch<T>(path: string, body: unknown): Promise<T>;
  delete<T>(path: string): Promise<T>;
}

/** Not implemented yet — mock services are used instead. Swap this in once the NestJS API exists. */
export const httpClient: HttpClient = {
  get() { throw new Error("httpClient is a placeholder. Implement it when the real REST API is available."); },
  post() { throw new Error("httpClient is a placeholder. Implement it when the real REST API is available."); },
  patch() { throw new Error("httpClient is a placeholder. Implement it when the real REST API is available."); },
  delete() { throw new Error("httpClient is a placeholder. Implement it when the real REST API is available."); },
};
