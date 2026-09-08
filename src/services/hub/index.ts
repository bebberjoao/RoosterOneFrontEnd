// Camada de serviços do Rooster Hub.
// Cada recurso expõe list/get/create/update/remove mapeados 1:1 nos endpoints
// REST do backend NestJS. Não existe fallback local: os dados devem vir da API.
import { request } from "./client";
import type {
  LogAuditoria, Modulo, Notificacao, Perfil, PerfilPermissao, Permissao,
  Sessao, Setor, Usuario, UsuarioPerfil, UsuarioSetor,
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

function createResource<T extends { id: string }>(path: string): HubResource<T> {
  return {
    path,
    list: () => request<T[]>(path),
    get: (id) => request<T>(`${path}/${id}`),
    create: (dto) => request<T>(path, { method: "POST", body: dto }),
    update: (id, dto) => request<T>(`${path}/${id}`, { method: "PATCH", body: dto }),
    remove: async (id) => { await request<void>(`${path}/${id}`, { method: "DELETE" }); },
  };
}

export const usuariosService = createResource<Usuario>("/usuarios");
export const setoresService = createResource<Setor>("/setores");
export const perfisService = createResource<Perfil>("/perfis");
export const modulosService = createResource<Modulo>("/modulos");
export const permissoesService = createResource<Permissao>("/permissoes");
export const usuariosPerfisService = createResource<UsuarioPerfil>("/usuarios-perfis");
export const usuariosSetoresService = createResource<UsuarioSetor>("/usuarios-setores");
export const perfisPermissoesService = createResource<PerfilPermissao>("/perfis-permissoes");
export const notificacoesService = createResource<Notificacao>("/notificacoes");
export const sessoesService = createResource<Sessao>("/sessoes");
export const logsAuditoriaService = createResource<LogAuditoria>("/logs-auditoria");

/** Atalhos de associação, conforme a especificação do backend. */
export const createUsuarioPerfil = (usuarioId: string, perfilId: string) =>
  usuariosPerfisService.create({ usuarioId, perfilId });
export const createUsuarioSetor = (usuarioId: string, setorId: string) =>
  usuariosSetoresService.create({ usuarioId, setorId });
export const createPerfilPermissao = (perfilId: string, permissaoId: string) =>
  perfisPermissoesService.create({ perfilId, permissaoId });