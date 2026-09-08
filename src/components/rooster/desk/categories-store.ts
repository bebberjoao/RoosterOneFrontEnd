// Store reativo temporário para manter a compatibilidade da UI.
// Os dados iniciais devem ser carregados pela API, nunca por seeds locais.
import { useEffect, useSyncExternalStore } from "react";
import { deskCategoryService } from "@/services/mock-api/desk-category.service";
import { deskCategories, deskAgentDirectory, deskAgentRoles, deskSectors, type DeskCategory, type DeskSubcategory, type DeskAgent } from "@/mock/database/deskCategories";

export type { DeskCategory, DeskAgent };
export type Subcategory = DeskSubcategory;

export let SECTORS = deskSectors;
export let AGENTS = deskAgentDirectory.map((agent) => agent.name);
export let AGENT_DIRECTORY: DeskAgent[] = deskAgentDirectory;
export let AGENT_ROLES = deskAgentRoles;

let state: DeskCategory[] = deskCategories;
let loaded = false;

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

export function useDeskCategories() {
  useEffect(() => {
    if (loaded) return;
    loaded = true;
    Promise.all([deskCategoryService.getAll(), deskCategoryService.getAgents()]).then(([categories, agents]) => {
      const apiAgents = agents as ApiAgent[];
      AGENT_DIRECTORY = apiAgents.map((agent) => ({
        id: agent.id,
        name: agent.nome,
        email: agent.email,
        sector: agent.setores[0]?.setor.nome ?? "",
        role: "Atendente",
        active: agent.ativo,
      }));
      AGENTS = AGENT_DIRECTORY.map((agent) => agent.name);
      SECTORS = [...new Set(AGENT_DIRECTORY.map((agent) => agent.sector).filter(Boolean))];
      state = (categories as ApiCategory[]).map((category) => ({
        id: category.id,
        sectorId: category.setor?.id,
        name: category.nome,
        sector: category.setor?.nome ?? "Sem setor",
        owner: category.setor?.nome ?? "Rooster Desk",
        slaHours: category.slaHoras ?? 8,
        subcategories: category.subcategorias.map((subcategory) => ({
          id: subcategory.id,
          name: subcategory.nome,
          slaHours: subcategory.slaHoras ?? category.slaHoras ?? 8,
          assignees: subcategory.atendentes.map((item) => item.usuario.nome),
        })),
      }));
      emit();
    }).catch(() => { loaded = false; });
  }, []);
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => state,
    () => state,
  );
}

type ApiAgent = { id: string; nome: string; email: string; ativo: boolean; setores: Array<{ setor: { nome: string } }> };
type ApiCategory = { id: string; nome: string; slaHoras?: number; setor?: { id: string; nome: string } | null; subcategorias: Array<{ id: string; nome: string; slaHoras?: number; atendentes: Array<{ usuario: { nome: string } }> }> };

/** Snapshot atual (usado pela camada de serviço mockada). */
export function getDeskCategoriesSnapshot() {
  return state;
}

export const categoriesApi = {
  upsert(cat: DeskCategory) {
    const payload = { name: cat.name, sectorId: cat.sectorId, slaHours: cat.slaHours };
    (cat.id.startsWith("cat-") ? deskCategoryService.create(payload as Omit<DeskCategory, "id">) : deskCategoryService.update(cat.id, payload)).catch(() => undefined);
    state = state.some((c) => c.id === cat.id) ? state.map((c) => (c.id === cat.id ? cat : c)) : [cat, ...state];
    emit();
  },
  remove(id: string) {
    deskCategoryService.remove(id).catch(() => undefined);
    state = state.filter((c) => c.id !== id);
    emit();
  },
  addSub(catId: string, sub: Omit<Subcategory, "id">) {
    deskCategoryService.addSubcategory(catId, sub).catch(() => undefined);
    state = state.map((c) =>
      c.id === catId ? { ...c, subcategories: [...c.subcategories, { ...sub, id: `${catId}-${Date.now()}` }] } : c,
    );
    emit();
  },
  updateSub(catId: string, subId: string, patch: Partial<Subcategory>) {
    if (patch.assignees) {
      const ids = patch.assignees.map((name) => AGENT_DIRECTORY.find((agent) => agent.name === name)?.id).filter((id): id is string => Boolean(id));
      deskCategoryService.setSubcategoryAgents(subId, ids).catch(() => undefined);
    } else {
      deskCategoryService.updateSubcategory(catId, subId, patch).catch(() => undefined);
    }
    state = state.map((c) =>
      c.id === catId
        ? { ...c, subcategories: c.subcategories.map((s) => (s.id === subId ? { ...s, ...patch } : s)) }
        : c,
    );
    emit();
  },
  removeSub(catId: string, subId: string) {
    deskCategoryService.removeSubcategory(catId, subId).catch(() => undefined);
    state = state.map((c) =>
      c.id === catId ? { ...c, subcategories: c.subcategories.filter((s) => s.id !== subId) } : c,
    );
    emit();
  },
};
