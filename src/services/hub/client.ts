// Cliente HTTP do Rooster Hub.
//
// Aponta para a API NestJS real via `VITE_API_URL`. Quando a API não está
// acessível (preview sem backend rodando), cada recurso cai automaticamente
// para um armazenamento em memória com os mesmos contratos, e a interface
// exibe o aviso de "modo offline".

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

export async function request<T>(
  path: string,
  init?: { method?: string; body?: unknown; signal?: AbortSignal },
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: init?.method ?? "GET",
      headers: init?.body ? { "Content-Type": "application/json" } : undefined,
      body: init?.body ? JSON.stringify(init.body) : undefined,
      signal: init?.signal,
    });
  } catch (err) {
    throw new ApiUnavailableError(err);
  }
  const data = await parse(res);
  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "message" in data
        ? Array.isArray((data as { message: unknown }).message)
          ? ((data as { message: string[] }).message).join(", ")
          : String((data as { message: unknown }).message)
        : undefined) ?? `Erro ${res.status}`;
    throw new ApiError(res.status, message);
  }
  return data as T;
}