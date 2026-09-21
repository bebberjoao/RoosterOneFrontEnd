// Cliente HTTP do Rooster One (Hub, Desk, Rooms e Assets).
//
// Aponta para a API NestJS real via `VITE_API_URL`. Quando a API não está
// acessível (preview sem backend rodando), cada recurso cai automaticamente
// para um armazenamento em memória com os mesmos contratos, e a interface
// exibe o aviso de "modo offline". Toda chamada envia o JWT da sessão
// (ver session.ts); um 401 limpa a sessão para o app voltar à tela de login.
import { session } from "./session";

export const API_URL: string =
  (import.meta.env["VITE_API_URL"] as string | undefined) ?? "http://localhost:3000";

export class ApiUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("API indisponível");
    this.name = "ApiUnavailableError";
    this.cause = cause;
  }
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function parse(res: Response) {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function send(path: string, init: { method?: string; headers?: Record<string, string>; body?: BodyInit; signal?: AbortSignal }): Promise<Response> {
  const headers: Record<string, string> = { ...init.headers };
  if (session.token) headers["Authorization"] = `Bearer ${session.token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method: init.method ?? "GET", headers, body: init.body, signal: init.signal });
  } catch (err) {
    throw new ApiUnavailableError(err);
  }
  if (!res.ok) {
    const data = await parse(res.clone());
    const message =
      (data && typeof data === "object" && "message" in data
        ? Array.isArray((data as { message: unknown }).message)
          ? ((data as { message: string[] }).message).join(", ")
          : String((data as { message: unknown }).message)
        : undefined) ?? `Erro ${res.status}`;
    // Token ausente/expirado/inválido: a sessão não é mais válida em lugar
    // nenhum do app — limpa aqui para toda tela reagir (ver auth-context).
    if (res.status === 401 && session.token) session.clear();
    throw new ApiError(res.status, message);
  }
  return res;
}

export async function request<T>(
  path: string,
  init?: { method?: string; body?: unknown; signal?: AbortSignal },
): Promise<T> {
  const res = await send(path, {
    method: init?.method,
    headers: init?.body ? { "Content-Type": "application/json" } : undefined,
    body: init?.body ? JSON.stringify(init.body) : undefined,
    signal: init?.signal,
  });
  return (await parse(res)) as T;
}

/** Envia um arquivo (multipart/form-data) — sem Content-Type manual, o browser define o boundary. */
export async function uploadFile<T>(path: string, formData: FormData): Promise<T> {
  const res = await send(path, { method: "POST", body: formData });
  return (await parse(res)) as T;
}

/** Baixa um recurso protegido por JWT como Blob (não dá pra usar um <a href> puro — não carrega o Authorization). */
export async function requestBlob(path: string): Promise<Blob> {
  const res = await send(path, {});
  return res.blob();
}