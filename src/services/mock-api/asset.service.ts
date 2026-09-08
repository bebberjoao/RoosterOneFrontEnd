import { httpClient } from "@/services/http";
import type { Asset } from "@/mock/database/assets";
import type { AssetMovement } from "@/mock/database/assetMovements";
import type { AssetCategory } from "@/mock/database/assetCategories";
import type { AssetSector } from "@/mock/database/assetSectors";
import type { Filters } from "./utils";

export const assetService = {
  getAll: async (filters?: Filters<Asset>) => (await httpClient.get<ApiAsset[]>("/patrimonio", filters as Record<string, unknown> | undefined)).map(toAsset),
  getById: async (id: string) => {
    try { return toAsset(await httpClient.get<ApiAsset>(`/patrimonio/${id}`)); } catch { return undefined; }
  },
  create: (dto: Omit<Asset, "id" | "createdAt">) => httpClient.post<ApiAsset>("/patrimonio", toApiAsset(dto)).then(toAsset),
  update: async (id: string, dto: Partial<Asset>) => {
    try { return toAsset(await httpClient.patch<ApiAsset>(`/patrimonio/${id}`, toApiAsset(dto))); } catch { return undefined; }
  },
  remove: async (id: string) => {
    try { await httpClient.delete<void>(`/patrimonio/${id}`); return true; } catch { return false; }
  },
  search: (search: string) => httpClient.get<ApiAsset[]>("/patrimonio", { search }).then((rows) => rows.map(toAsset)),
  getCategories: () => httpClient.get<ApiCategory[]>("/patrimonio-categorias").then((rows) => rows.map(toCategory)),
  createCategory: (dto: Omit<AssetCategory, "id">) => httpClient.post<ApiCategory>("/patrimonio-categorias", toApiCategory(dto)).then(toCategory),
  updateCategory: async (id: string, dto: Partial<AssetCategory>) => {
    try { return toCategory(await httpClient.patch<ApiCategory>(`/patrimonio-categorias/${id}`, toApiCategory(dto))); } catch { return undefined; }
  },
  removeCategory: async (id: string) => {
    try { await httpClient.delete<void>(`/patrimonio-categorias/${id}`); return true; } catch { return false; }
  },
  getSectors: () => httpClient.get<ApiSector[]>("/patrimonio-setores").then((rows) => rows.map(toSector)),
  createSector: (dto: Omit<AssetSector, "id">) => httpClient.post<ApiSector>("/patrimonio-setores", toApiSector(dto)).then(toSector),
  updateSector: async (id: string, dto: Partial<AssetSector>) => {
    try { return toSector(await httpClient.patch<ApiSector>(`/patrimonio-setores/${id}`, toApiSector(dto))); } catch { return undefined; }
  },
  removeSector: async (id: string) => {
    try { await httpClient.delete<void>(`/patrimonio-setores/${id}`); return true; } catch { return false; }
  },
  getMovements: async (filters?: Filters<AssetMovement>) => (await httpClient.get<ApiMovement[]>("/patrimonio-movimentacoes", filters as Record<string, unknown> | undefined)).map(toMovement),
  registerMovement: (dto: Omit<AssetMovement, "id">) => httpClient.post<ApiMovement>("/patrimonio-movimentacoes", toApiMovement(dto)).then(toMovement),
};

type ApiAsset = { id: string; nome: string; tag: string; categoriaId: string; marca?: string | null; modelo?: string | null; serial?: string | null; localizacao?: string | null; setor?: string | null; responsavelUserId?: string | null; responsavel?: string | null; status: Asset["status"]; condicao: Asset["condition"]; adquiridoEm: string; valor: number | string; observacoes?: string | null; foto?: string | null; chamadoManutencaoId?: string | null; criadoEm: string };
type ApiCategory = { id: string; nome: string; descricao?: string | null; tom?: string | null; sistema?: boolean };
type ApiSector = { id: string; nome: string; descricao?: string | null; responsavel?: string | null };
type ApiMovement = { id: string; patrimonioId: string; tipo: AssetMovement["type"]; origem?: string | null; destino?: string | null; usuario: string; criadoEm: string; observacoes?: string | null };
const toAsset = (v: ApiAsset): Asset => ({ id: v.id, name: v.nome, tag: v.tag, categoryId: v.categoriaId, brand: v.marca ?? "", model: v.modelo ?? "", serial: v.serial ?? "", location: v.localizacao ?? "", sector: v.setor ?? "", ownerUserId: v.responsavelUserId ?? undefined, owner: v.responsavel ?? "", status: v.status, condition: v.condicao, acquiredAt: v.adquiridoEm, value: Number(v.valor), notes: v.observacoes ?? undefined, photo: v.foto ?? undefined, maintenanceTicketId: v.chamadoManutencaoId ?? undefined, createdAt: v.criadoEm });
const toCategory = (v: ApiCategory): AssetCategory => ({ id: v.id, name: v.nome, description: v.descricao ?? undefined, tone: v.tom ?? "", system: v.sistema });
const toSector = (v: ApiSector): AssetSector => ({ id: v.id, name: v.nome, description: v.descricao ?? undefined, manager: v.responsavel ?? undefined });
const toMovement = (v: ApiMovement): AssetMovement => ({ id: v.id, assetId: v.patrimonioId, type: v.tipo, from: v.origem ?? undefined, to: v.destino ?? undefined, user: v.usuario, date: v.criadoEm, notes: v.observacoes ?? undefined });
const toApiAsset = (v: Partial<Asset>) => ({ nome: v.name, tag: v.tag, categoriaId: v.categoryId, marca: v.brand, modelo: v.model, serial: v.serial, localizacao: v.location, setor: v.sector, responsavelUserId: v.ownerUserId, responsavel: v.owner, status: v.status, condicao: v.condition, adquiridoEm: v.acquiredAt, valor: v.value, observacoes: v.notes, foto: v.photo, chamadoManutencaoId: v.maintenanceTicketId });
const toApiCategory = (v: Partial<AssetCategory>) => ({ nome: v.name, descricao: v.description, tom: v.tone, sistema: v.system });
const toApiSector = (v: Partial<AssetSector>) => ({ nome: v.name, descricao: v.description, responsavel: v.manager });
const toApiMovement = (v: Partial<AssetMovement>) => ({ patrimonioId: v.assetId, tipo: v.type, origem: v.from, destino: v.to, usuario: v.user, observacoes: v.notes });
