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

// A API REST é versionada por URI (`VersioningType.URI`, defaultVersion "1"):
// toda rota de negócio existe apenas sob /v1 — sem o prefixo, a resposta é 404.
// O prefixo fica aqui, e não dentro de `API_URL`, porque `API_URL` também é a
// base dos gateways WebSocket (`io(`${API_URL}/desk`)`), que NÃO são versionados.
export const API_VERSION_PREFIX = "/v1";

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

type RespostaRenovacao = {
  accessToken: string;
  refreshToken: string;
  usuario: { id: string; nome: string; email: string };
  acesso: { permissoes: Array<{ nome: string }> } | null;
};

/**
 * Renovação em voo. Se várias chamadas tomarem 401 ao mesmo tempo (uma tela
 * costuma disparar vários fetches juntos), todas esperam a MESMA renovação —
 * senão a primeira rotacionaria o refresh token e as demais tentariam renovar
 * com um token já revogado, derrubando a sessão justamente quando ela
 * acabou de ser salva.
 */
/**
 * - `renovado`: há um access token novo, a chamada pode ser repetida.
 * - `recusado`: o servidor rejeitou o refresh token — a sessão morreu.
 * - `indisponivel`: não deu para perguntar (rede fora). A sessão pode estar
 *   perfeitamente válida, então **não** é motivo para deslogar.
 */
type ResultadoRenovacao = "renovado" | "recusado" | "indisponivel";

let renovacaoEmVoo: Promise<ResultadoRenovacao> | null = null;

async function renovarSessao(): Promise<ResultadoRenovacao> {
  const refresh = session.refreshToken;
  if (!refresh) return "recusado";

  let res: Response;
  try {
    res = await fetch(`${API_URL}${API_VERSION_PREFIX}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: refresh }),
    });
  } catch {
    return "indisponivel";
  }

  if (!res.ok) return "recusado";

  try {
    const dados = (await res.json()) as RespostaRenovacao;
    session.set(
      dados.accessToken,
      dados.usuario,
      (dados.acesso?.permissoes ?? []).map((p) => p.nome),
      dados.refreshToken,
    );
    return "renovado";
  } catch {
    return "recusado";
  }
}

async function enviar(
  path: string,
  init: { method?: string; headers?: Record<string, string>; body?: BodyInit; signal?: AbortSignal },
): Promise<Response> {
  const headers: Record<string, string> = { ...init.headers };
  if (session.token) headers["Authorization"] = `Bearer ${session.token}`;

  try {
    return await fetch(`${API_URL}${API_VERSION_PREFIX}${path}`, {
      method: init.method ?? "GET",
      headers,
      body: init.body,
      signal: init.signal,
    });
  } catch (err) {
    throw new ApiUnavailableError(err);
  }
}

async function send(path: string, init: { method?: string; headers?: Record<string, string>; body?: BodyInit; signal?: AbortSignal }): Promise<Response> {
  let res = await enviar(path, init);
  let renovacao: ResultadoRenovacao | null = null;

  // Access token expirado (8h): tenta renovar uma vez com o refresh token e
  // repete a chamada. Só então, se ainda falhar, a sessão é considerada perdida.
  if (res.status === 401 && session.refreshToken) {
    renovacaoEmVoo = renovacaoEmVoo ?? renovarSessao().finally(() => (renovacaoEmVoo = null));
    renovacao = await renovacaoEmVoo;
    if (renovacao === "renovado") res = await enviar(path, init);
  }

  if (!res.ok) {
    const data = await parse(res.clone());
    const message =
      (data && typeof data === "object" && "message" in data
        ? Array.isArray((data as { message: unknown }).message)
          ? ((data as { message: string[] }).message).join(", ")
          : String((data as { message: unknown }).message)
        : undefined) ?? `Erro ${res.status}`;
    // Token inválido e sem renovação possível: a sessão não vale mais em lugar
    // nenhum do app — limpa aqui para toda tela reagir. A exceção é a rede ter
    // caído durante a renovação: aí não se sabe se a sessão morreu, e derrubar
    // o login por uma oscilação seria pior do que deixar a chamada falhar.
    if (res.status === 401 && session.token && renovacao !== "indisponivel") session.clear();
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

/**
 * Envia um arquivo grande (ex.: vídeo de aula, até 2GB) reportando progresso
 * de upload via `onProgress` (0-100). `fetch`/`uploadFile` não expõem esse
 * progresso de forma confiável entre navegadores — `XMLHttpRequest.upload`
 * é o único jeito cross-browser de saber quantos bytes já foram enviados,
 * essencial numa barra de progresso que pode levar minutos num arquivo grande.
 *
 * Simplificação deliberada em relação a `uploadFile`: não tenta renovar a
 * sessão automaticamente num 401. Um upload de minutos que falhasse por
 * expiração no meio e precisasse recomeçar do zero seria pior do que só
 * avisar — o usuário tenta de novo já com a sessão renovada pela navegação normal.
 */
export function uploadFileWithProgress<T>(path: string, formData: FormData, onProgress?: (percent: number) => void): Promise<T> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}${API_VERSION_PREFIX}${path}`);
    if (session.token) xhr.setRequestHeader("Authorization", `Bearer ${session.token}`);

    xhr.upload.onprogress = (evento) => {
      if (onProgress && evento.lengthComputable) onProgress(Math.round((evento.loaded / evento.total) * 100));
    };

    xhr.onload = () => {
      let corpo: unknown;
      try {
        corpo = xhr.responseText ? JSON.parse(xhr.responseText) : undefined;
      } catch {
        corpo = xhr.responseText;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(corpo as T);
        return;
      }
      const mensagem =
        corpo && typeof corpo === "object" && "message" in corpo
          ? Array.isArray((corpo as { message: unknown }).message)
            ? ((corpo as { message: string[] }).message).join(", ")
            : String((corpo as { message: unknown }).message)
          : `Erro ${xhr.status}`;
      if (xhr.status === 401 && session.token) session.clear();
      reject(new ApiError(xhr.status, mensagem));
    };
    xhr.onerror = () => reject(new ApiUnavailableError());
    xhr.send(formData);
  });
}