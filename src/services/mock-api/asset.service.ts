// Rooster Assets — 100% ligado ao backend real (Patrimônio) via client HTTP
// compartilhado (sem fallback para dado mockado). Os tipos de tela continuam
// em inglês (Asset, AssetCategory, ...); os nomes de campo são traduzidos
// para os DTOs em português do NestJS na fronteira do serviço
// (mapResource), não na UI.
import type { Asset, AssetStatus, AssetCondition } from "@/mock/database/assets";
import type { AssetMovement, MovementType } from "@/mock/database/assetMovements";
import type { AssetCategory } from "@/mock/database/assetCategories";
import type { AssetSector } from "@/mock/database/assetSectors";
import { mapResource } from "@/services/hub/mapped-resource";
import { request } from "@/services/hub/client";
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

function patrimonioToFront(b: PatrimonioBack): Asset {
  return {
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
  };
}

const assetService_ = mapResource<Asset, PatrimonioBack>(
  "/patrimonio",
  "asset",
  [],
  patrimonioToFront,
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

type CategoriaBack = { id: string; nome: string; descricao?: string | null; tom?: string | null; sistema?: boolean | null };
const categoryService = mapResource<AssetCategory, CategoriaBack>(
  "/patrimonio-categorias",
  "cat",
  [],
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
  [],
  (b) => ({ id: b.id, name: b.nome, description: b.descricao ?? undefined, manager: b.responsavel ?? undefined }),
  (f) => ({
    ...(f.name !== undefined && { nome: f.name }),
    ...(f.description !== undefined && { descricao: f.description }),
    ...(f.manager !== undefined && { responsavel: f.manager }),
  }),
);

type MovimentoBack = {
  id: string; patrimonioId: string; tipo: string; origem?: string | null; destino?: string | null;
  usuario: string; observacoes?: string | null; criadoEm: string;
  dataDevolucaoPrevista?: string | null; devolvidoEm?: string | null;
};
function movimentoToFront(b: MovimentoBack): AssetMovement {
  return {
    id: b.id, assetId: b.patrimonioId, type: b.tipo as MovementType, from: b.origem ?? undefined,
    to: b.destino ?? undefined, user: b.usuario, date: b.criadoEm, notes: b.observacoes ?? undefined,
    dueDate: b.dataDevolucaoPrevista ?? undefined, returnedAt: b.devolvidoEm ?? undefined,
  };
}
const movementToBack = (f: Partial<AssetMovement>): Partial<MovimentoBack> => ({
  ...(f.assetId !== undefined && { patrimonioId: f.assetId }),
  ...(f.type !== undefined && { tipo: f.type }),
  ...(f.from !== undefined && { origem: f.from }),
  ...(f.to !== undefined && { destino: f.to }),
  ...(f.user !== undefined && { usuario: f.user }),
  ...(f.notes !== undefined && { observacoes: f.notes }),
  ...(f.dueDate !== undefined && { dataDevolucaoPrevista: f.dueDate }),
});
const movementService = mapResource<AssetMovement, MovimentoBack>(
  "/patrimonio-movimentacoes",
  "mov",
  [],
  movimentoToFront,
  movementToBack,
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
  /**
   * `POST /patrimonio-movimentacoes` é transacional e devolve
   * `{ movimentacao, patrimonio }` (não uma linha "achatada" como o resto do
   * CRUD) — por isso não passa pelo `movementService.create()` genérico, que
   * espera receber de volta exatamente o formato que manda.
   */
  async registerMovement(dto: Omit<AssetMovement, "id">): Promise<AssetMovement> {
    const res = await request<{ movimentacao: MovimentoBack }>("/patrimonio-movimentacoes", {
      method: "POST",
      body: movementToBack(dto),
    });
    return movimentoToFront(res.movimentacao);
  },
  async getOverdueLoans(): Promise<AssetMovement[]> {
    const rows = await request<MovimentoBack[]>("/patrimonio-emprestimos-atrasados");
    return rows.map(movimentoToFront);
  },
  async returnLoan(movementId: string, user: string): Promise<Asset> {
    const patrimonio = await request<PatrimonioBack>(`/patrimonio-movimentacoes/${movementId}/devolver`, { method: "PATCH", body: { usuario: user } });
    return patrimonioToFront(patrimonio);
  },
};
