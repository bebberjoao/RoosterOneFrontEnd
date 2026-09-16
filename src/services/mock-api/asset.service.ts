// Rooster Assets — ligado ao backend real (Patrimônio) via client HTTP
// compartilhado. Os tipos de tela continuam em inglês (Asset, AssetCategory,
// ...); os nomes de campo são traduzidos para os DTOs em português do
// NestJS na fronteira do serviço (mapResource), não na UI.
import { db } from "@/mock/database";
import type { Asset, AssetStatus, AssetCondition } from "@/mock/database/assets";
import type { AssetMovement, MovementType } from "@/mock/database/assetMovements";
import type { AssetCategory } from "@/mock/database/assetCategories";
import type { AssetSector } from "@/mock/database/assetSectors";
import { mapResource } from "@/services/hub/mapped-resource";
import { applyFilters, type Filters } from "./utils";

type PatrimonioBack = {
  id: string;
  nome: string;
  tag: string;
  categoriaId: string;
  marca?: string | null;
  modelo?: string | null;
  serial?: string | null;
  localizacaoId?: string | null;
  localizacao?: string | null;
  setorId?: string | null;
  setor?: string | null;
  responsavelUserId?: string | null;
  responsavel?: string | null;
  status: string;
  condicao: string;
  adquiridoEm?: string | null;
  valor: number;
  observacoes?: string | null;
  foto?: string | null;
  chamadoManutencaoId?: string | null;
  criadoEm: string;
};

const assetService_ = mapResource<Asset, PatrimonioBack>(
  "/patrimonio",
  "asset",
  db.assets.map(toBackAsset),
  (b) => ({
    id: b.id,
    name: b.nome,
    tag: b.tag,
    categoryId: b.categoriaId,
    brand: b.marca ?? "",
    model: b.modelo ?? "",
    serial: b.serial ?? "",
    locationId: b.localizacaoId ?? undefined,
    location: b.localizacao ?? "",
    sector: b.setor ?? "",
    ownerUserId: b.responsavelUserId ?? undefined,
    owner: b.responsavel ?? "",
    status: b.status as AssetStatus,
    condition: b.condicao as AssetCondition,
    acquiredAt: b.adquiridoEm ?? "",
    value: b.valor,
    notes: b.observacoes ?? undefined,
    photo: b.foto ?? undefined,
    maintenanceTicketId: b.chamadoManutencaoId ?? undefined,
    createdAt: b.criadoEm,
  }),
  (f) => ({
    ...(f.name !== undefined && { nome: f.name }),
    ...(f.tag !== undefined && { tag: f.tag }),
    ...(f.categoryId !== undefined && { categoriaId: f.categoryId }),
    ...(f.brand !== undefined && { marca: f.brand }),
    ...(f.model !== undefined && { modelo: f.model }),
    ...(f.serial !== undefined && { serial: f.serial }),
    ...(f.location !== undefined && { localizacao: f.location }),
    ...(f.sector !== undefined && { setor: f.sector }),
    ...(f.owner !== undefined && { responsavel: f.owner }),
    ...(f.status !== undefined && { status: f.status }),
    ...(f.condition !== undefined && { condicao: f.condition }),
    ...(f.acquiredAt !== undefined && { adquiridoEm: f.acquiredAt }),
    ...(f.value !== undefined && { valor: f.value }),
    ...(f.notes !== undefined && { observacoes: f.notes }),
  }),
);

function toBackAsset(a: Asset): PatrimonioBack {
  return {
    id: a.id, nome: a.name, tag: a.tag, categoriaId: a.categoryId, marca: a.brand, modelo: a.model,
    serial: a.serial, localizacaoId: a.locationId, localizacao: a.location, setor: a.sector,
    responsavelUserId: a.ownerUserId, responsavel: a.owner, status: a.status, condicao: a.condition,
    adquiridoEm: a.acquiredAt, valor: a.value, observacoes: a.notes, foto: a.photo,
    chamadoManutencaoId: a.maintenanceTicketId, criadoEm: a.createdAt,
  };
}

type CategoriaBack = { id: string; nome: string; descricao?: string | null; tom?: string | null; sistema?: boolean | null };
const categoryService = mapResource<AssetCategory, CategoriaBack>(
  "/patrimonio-categorias",
  "cat",
  db.assetCategories.map((c) => ({ id: c.id, nome: c.name, descricao: c.description, tom: c.tone, sistema: c.system })),
  (b) => ({ id: b.id, name: b.nome, description: b.descricao ?? undefined, tone: b.tom ?? "", system: b.sistema ?? undefined }),
  (f) => ({
    ...(f.name !== undefined && { nome: f.name }),
    ...(f.description !== undefined && { descricao: f.description }),
    ...(f.tone !== undefined && { tom: f.tone }),
  }),
);

type SetorBack = { id: string; nome: string; descricao?: string | null; responsavel?: string | null };
const sectorService = mapResource<AssetSector, SetorBack>(
  "/patrimonio-setores",
  "sec",
  db.assetSectors.map((s) => ({ id: s.id, nome: s.name, descricao: s.description, responsavel: s.manager })),
  (b) => ({ id: b.id, name: b.nome, description: b.descricao ?? undefined, manager: b.responsavel ?? undefined }),
  (f) => ({
    ...(f.name !== undefined && { nome: f.name }),
    ...(f.description !== undefined && { descricao: f.description }),
    ...(f.manager !== undefined && { responsavel: f.manager }),
  }),
);

type MovimentoBack = { id: string; patrimonioId: string; tipo: string; origem?: string | null; destino?: string | null; usuario: string; observacoes?: string | null; criadoEm: string };
const movementService = mapResource<AssetMovement, MovimentoBack>(
  "/patrimonio-movimentacoes",
  "mov",
  db.assetMovements.map((m) => ({ id: m.id, patrimonioId: m.assetId, tipo: m.type, origem: m.from, destino: m.to, usuario: m.user, observacoes: m.notes, criadoEm: m.date })),
  (b) => ({ id: b.id, assetId: b.patrimonioId, type: b.tipo as MovementType, from: b.origem ?? undefined, to: b.destino ?? undefined, user: b.usuario, date: b.criadoEm, notes: b.observacoes ?? undefined }),
  (f) => ({
    ...(f.assetId !== undefined && { patrimonioId: f.assetId }),
    ...(f.type !== undefined && { tipo: f.type }),
    ...(f.from !== undefined && { origem: f.from }),
    ...(f.to !== undefined && { destino: f.to }),
    ...(f.user !== undefined && { usuario: f.user }),
    ...(f.notes !== undefined && { observacoes: f.notes }),
  }),
);

export const assetService = {
  async getAll(filters?: Filters<Asset>): Promise<Asset[]> {
    return applyFilters(await assetService_.list(), filters);
  },
  async getById(id: string): Promise<Asset | undefined> {
    return assetService_.get(id).catch(() => undefined);
  },
  async create(dto: Omit<Asset, "id" | "createdAt">): Promise<Asset> {
    return assetService_.create(dto as Partial<Asset>);
  },
  async update(id: string, dto: Partial<Asset>): Promise<Asset | undefined> {
    return assetService_.update(id, dto);
  },
  async remove(id: string): Promise<boolean> {
    await assetService_.remove(id);
    return true;
  },
  async search(query: string): Promise<Asset[]> {
    const q = query.toLowerCase();
    const all = await assetService_.list();
    return all.filter((a) => a.name.toLowerCase().includes(q) || a.tag.toLowerCase().includes(q));
  },

  // Domain-specific helpers
  async getCategories() {
    return categoryService.list();
  },
  async createCategory(dto: Omit<AssetCategory, "id">): Promise<AssetCategory> {
    return categoryService.create(dto as Partial<AssetCategory>);
  },
  async updateCategory(id: string, dto: Partial<AssetCategory>): Promise<AssetCategory | undefined> {
    return categoryService.update(id, dto);
  },
  async removeCategory(id: string): Promise<boolean> {
    await categoryService.remove(id);
    return true;
  },
  async getSectors(): Promise<AssetSector[]> {
    return sectorService.list();
  },
  async createSector(dto: Omit<AssetSector, "id">): Promise<AssetSector> {
    return sectorService.create(dto as Partial<AssetSector>);
  },
  async updateSector(id: string, dto: Partial<AssetSector>): Promise<AssetSector | undefined> {
    return sectorService.update(id, dto);
  },
  async removeSector(id: string): Promise<boolean> {
    await sectorService.remove(id);
    return true;
  },
  async getMovements(filters?: Filters<AssetMovement>) {
    return applyFilters(await movementService.list(), filters);
  },
  async registerMovement(dto: Omit<AssetMovement, "id">): Promise<AssetMovement> {
    return movementService.create(dto as Partial<AssetMovement>);
  },
};
