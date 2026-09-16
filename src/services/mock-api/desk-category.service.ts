// Rooster Desk — categorias/subcategorias/atendentes ligados ao backend
// real (/chamados-categorias, /chamados-subcategorias, /chamados-atendentes,
// /chamados-setores). O setor de uma categoria é resolvido por nome a partir
// dos setores já usados por categorias existentes (o endpoint de atendentes
// só devolve os setores do próprio usuário, não a lista completa do Hub) —
// criar uma categoria num setor ainda sem nenhuma categoria cadastrada não é
// suportado por esta tela; é uma limitação conhecida, não um bug.
import type { DeskCategory, DeskSubcategory } from "@/mock/database/deskCategories";
import { request } from "@/services/hub/client";
import { applyFilters, type Filters } from "./utils";

type BackSub = { id: string; nome: string; slaHoras?: number; atendentes?: { usuario: { id: string; nome: string } }[] };
type BackCategoria = { id: string; nome: string; slaHoras?: number; setorId?: string | null; setor?: { id: string; nome: string } | null; subcategorias?: BackSub[] };

const setorIdByName = new Map<string, string>();

function toFront(b: BackCategoria): DeskCategory {
  if (b.setor) setorIdByName.set(b.setor.nome, b.setor.id);
  return {
    id: b.id,
    name: b.nome,
    sector: b.setor?.nome ?? "",
    owner: b.setor?.nome ?? "—",
    slaHours: b.slaHoras ?? 8,
    subcategories: (b.subcategorias ?? []).map((s) => ({
      id: s.id,
      name: s.nome,
      slaHours: s.slaHoras ?? b.slaHoras ?? 8,
      assignees: (s.atendentes ?? []).map((a) => a.usuario.nome),
    })),
  };
}

async function listCategories(): Promise<DeskCategory[]> {
  const rows = await request<BackCategoria[]>("/chamados-categorias");
  return rows.map(toFront);
}

export const deskCategoryService = {
  async getAll(filters?: Filters<DeskCategory>): Promise<DeskCategory[]> {
    return applyFilters(await listCategories(), filters);
  },
  async getById(id: string): Promise<DeskCategory | undefined> {
    const b = await request<BackCategoria>(`/chamados-categorias/${id}`).catch(() => undefined);
    return b ? toFront(b) : undefined;
  },
  async create(dto: Omit<DeskCategory, "id">): Promise<DeskCategory> {
    const created = await request<BackCategoria>("/chamados-categorias", {
      method: "POST",
      body: { nome: dto.name, slaHoras: dto.slaHours, setorId: setorIdByName.get(dto.sector) },
    });
    return toFront(created);
  },
  async update(id: string, dto: Partial<DeskCategory>): Promise<DeskCategory | undefined> {
    const body: Record<string, unknown> = {};
    if (dto.name !== undefined) body.nome = dto.name;
    if (dto.slaHours !== undefined) body.slaHoras = dto.slaHours;
    if (dto.sector !== undefined) body.setorId = setorIdByName.get(dto.sector);
    const updated = await request<BackCategoria>(`/chamados-categorias/${id}`, { method: "PATCH", body });
    return toFront(updated);
  },
  async remove(id: string): Promise<boolean> {
    await request<void>(`/chamados-categorias/${id}`, { method: "DELETE" });
    return true;
  },

  // Subcategorias
  async addSubcategory(categoryId: string, dto: Omit<DeskSubcategory, "id">) {
    await request(`/chamados-subcategorias`, { method: "POST", body: { categoriaId: categoryId, nome: dto.name, slaHoras: dto.slaHours } });
    return this.getById(categoryId);
  },
  async updateSubcategory(categoryId: string, subId: string, dto: Partial<DeskSubcategory>) {
    const body: Record<string, unknown> = {};
    if (dto.name !== undefined) body.nome = dto.name;
    if (dto.slaHours !== undefined) body.slaHoras = dto.slaHours;
    if (dto.assignees !== undefined) {
      const agentes = await request<{ id: string; nome: string }[]>("/chamados-atendentes");
      const ids = dto.assignees.map((nome) => agentes.find((a) => a.nome === nome)?.id).filter((v): v is string => Boolean(v));
      await request(`/chamados-subcategorias/${subId}/atendentes`, { method: "PATCH", body: { usuarioIds: ids } });
    }
    if (Object.keys(body).length > 0) {
      await request(`/chamados-subcategorias/${subId}`, { method: "PATCH", body });
    }
    return this.getById(categoryId);
  },
  async removeSubcategory(categoryId: string, subId: string) {
    await request<void>(`/chamados-subcategorias/${subId}`, { method: "DELETE" });
    return true;
  },

  // Atendentes
  async getAgents(): Promise<string[]> {
    const agentes = await request<{ nome: string }[]>("/chamados-atendentes");
    return agentes.map((a) => a.nome);
  },
  async getSectors(): Promise<string[]> {
    return request<string[]>("/chamados-setores");
  },
  async setAgentSubcategories(agent: string, subIds: string[]) {
    const [agentes, cats] = await Promise.all([
      request<{ id: string; nome: string }[]>("/chamados-atendentes"),
      listCategories(),
    ]);
    const agentId = agentes.find((a) => a.nome === agent)?.id;
    if (!agentId) return false;
    for (const c of cats) {
      for (const s of c.subcategories) {
        const should = subIds.includes(s.id);
        const has = s.assignees.includes(agent);
        if (should === has) continue;
        const nextAssignees = should ? [...s.assignees, agent] : s.assignees.filter((a) => a !== agent);
        const ids = nextAssignees.map((nome) => agentes.find((a) => a.nome === nome)?.id).filter((v): v is string => Boolean(v));
        await request(`/chamados-subcategorias/${s.id}/atendentes`, { method: "PATCH", body: { usuarioIds: ids } });
      }
    }
    return true;
  },
};
