// Cliente HTTP do portal público Rooster Boost (alunos externos).
//
// Espelha src/services/hub/client.ts propositalmente (mesmo shape de
// request/uploadFile/requestBlob), mas lê o token da sessão Boost — nunca da
// sessão do Hub — para as duas ficarem completamente desacopladas. Aponta
// para a mesma API NestJS (mesmo backend, endpoints públicos e
// autenticados-por-Boost-JWT); um 401 limpa só a sessão Boost.
import { boostSession } from "./session";

export const API_URL: string =
  (import.meta.env["VITE_API_URL"] as string | undefined) ?? "http://localhost:3000";

// Mesmo motivo do client do Hub: a API REST só existe sob /v1, mas os gateways
// WebSocket (`io(`${API_URL}/boost`)`) não são versionados — por isso o prefixo
// fica separado de `API_URL`.
export const API_VERSION_PREFIX = "/v1";

export class BoostApiUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("API indisponível");
    this.name = "BoostApiUnavailableError";
    this.cause = cause;
  }
}

export class BoostApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "BoostApiError";
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
  if (boostSession.token) headers["Authorization"] = `Bearer ${boostSession.token}`;

  let res: Response;
  try {
    res = await fetch(`${API_URL}${API_VERSION_PREFIX}${path}`, { method: init.method ?? "GET", headers, body: init.body, signal: init.signal });
  } catch (err) {
    throw new BoostApiUnavailableError(err);
  }
  if (!res.ok) {
    const data = await parse(res.clone());
    const message =
      (data && typeof data === "object" && "message" in data
        ? Array.isArray((data as { message: unknown }).message)
          ? ((data as { message: string[] }).message).join(", ")
          : String((data as { message: unknown }).message)
        : undefined) ?? `Erro ${res.status}`;
    // Token ausente/expirado/inválido: a sessão Boost não é mais válida —
    // limpa aqui para toda tela do portal reagir (ver boost-auth-context).
    if (res.status === 401 && boostSession.token) boostSession.clear();
    throw new BoostApiError(res.status, message);
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

/** Baixa um recurso protegido pelo JWT Boost como Blob (não dá pra usar um <a href> puro — não carrega o Authorization). */
export async function requestBlob(path: string): Promise<Blob> {
  const res = await send(path, {});
  return res.blob();
}
