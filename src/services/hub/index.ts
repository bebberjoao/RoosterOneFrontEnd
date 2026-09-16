// Camada de serviços do Rooster Hub.
// Cada recurso expõe list/get/create/update/remove mapeados 1:1 nos endpoints
// REST do backend NestJS. Se a API estiver indisponível, o recurso opera em
// memória com os dados de `seed.ts` (modo offline sinalizado na interface).
import { ApiUnavailableError, request } from "./client";
import * as seed from "./seed";
import type {
  LogAuditoria, Modulo, Notificacao, Permissao,
  Sessao, Setor, Usuario, UsuarioPermissao, UsuarioSetor,
} from "./types";

export * from "./types";
export { API_URL, ApiError, ApiUnavailableError } from "./client";

export type HubResource<T extends { id: string }> = {
  path: string;
  list(): Promise<T[]>;
  get(id: string): Promise<T>;
  create(dto: Partial<T>): Promise<T>;
  update(id: string, dto: Partial<T>): Promise<T>;
  remove(id: string): Promise<void>;
};

/** Sinaliza para a UI que a última operação usou o armazenamento local. */
export const offlineState = {
  offline: false,
  listeners: new Set<(v: boolean) => void>(),
  set(v: boolean) {
    if (this.offline === v) return;
    this.offline = v;
    this.listeners.forEach((l) => l(v));
  },
  subscribe(l: (v: boolean) => void) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  },
};

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 10)}`;

export function createResource<T extends { id: string }>(path: string, prefix: string, initial: T[]): HubResource<T> {
  let local: T[] = initial.map((r) => ({ ...r }));

  async function withFallback<R>(remote: () => Promise<R>, fallback: () => R): Promise<R> {
    try {
      const res = await remote();
      offlineState.set(false);
      return res;
    } catch (err) {
      if (err instanceof ApiUnavailableError) {
        offlineState.set(true);
        return fallback();
      }
      throw err;
    }
  }

  return {
    path,
    list: () => withFallback(() => request<T[]>(path), () => local),
    get: (id) =>
      withFallback(
        () => request<T>(`${path}/${id}`),
        () => {
          const found = local.find((r) => r.id === id);
          if (!found) throw new Error("Registro não encontrado");
          return found;
        },
      ),
    create: (dto) =>
      withFallback(
        () => request<T>(path, { method: "POST", body: dto }),
        () => {
          const created = { ...(dto as T), id: uid(prefix), criadoEm: new Date().toISOString() } as T;
          local = [created, ...local];
          return created;
        },
      ),
    update: (id, dto) =>
      withFallback(
        () => request<T>(`${path}/${id}`, { method: "PATCH", body: dto }),
        () => {
          local = local.map((r) => (r.id === id ? { ...r, ...dto, atualizadoEm: new Date().toISOString() } : r));
          return local.find((r) => r.id === id) as T;
        },
      ),
    remove: (id) =>
      withFallback(
        async () => {
          await request<void>(`${path}/${id}`, { method: "DELETE" });
        },
        () => {
          local = local.filter((r) => r.id !== id);
        },
      ),
  };
}

export const usuariosService = createResource<Usuario>("/usuarios", "u", seed.seedUsuarios);
export const setoresService = createResource<Setor>("/setores", "s", seed.seedSetores);
export const modulosService = createResource<Modulo>("/modulos", "m", seed.seedModulos);
export const permissoesService = createResource<Permissao>("/permissoes", "pm", seed.seedPermissoes);
export const usuariosSetoresService = createResource<UsuarioSetor>("/usuarios-setores", "us", seed.seedUsuariosSetores);
export const usuariosPermissoesService = createResource<UsuarioPermissao>("/usuarios-permissoes", "upm", seed.seedUsuariosPermissoes);
export const notificacoesService = createResource<Notificacao>("/notificacoes", "n", seed.seedNotificacoes);
export const sessoesService = createResource<Sessao>("/sessoes", "se", seed.seedSessoes);
export const logsAuditoriaService = createResource<LogAuditoria>("/logs-auditoria", "lg", seed.seedLogs);

/** Atalhos de associação, conforme a especificação do backend. */
export const createUsuarioSetor = (usuarioId: string, setorId: string) =>
  usuariosSetoresService.create({ usuarioId, setorId });
export const createUsuarioPermissao = (usuarioId: string, permissaoId: string) =>
  usuariosPermissoesService.create({ usuarioId, permissaoId });
/** Remove o vínculo de um usuário com um setor (gerenciado na tela de Setores). */
export const removeUsuarioSetor = (vinculoId: string) => usuariosSetoresService.remove(vinculoId);