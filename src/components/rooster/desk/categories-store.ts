// Store reativo (em memória) das categorias/subcategorias do Rooster Desk.
// O DADO vive em src/mock/database/deskCategories.ts (ponto único de mock);
// aqui ficam apenas o estado reativo e as mutações usadas pelas telas.
// Na integração, troque as mutações por chamadas de `deskCategoryService`.
import { useSyncExternalStore } from "react";
import { deskCategories, deskSectors, deskAgents, deskAgentDirectory, deskAgentRoles } from "@/mock/database/deskCategories";
import type { DeskCategory, DeskSubcategory, DeskAgent } from "@/mock/database/deskCategories";

export type { DeskCategory, DeskAgent };
export type Subcategory = DeskSubcategory;

export const SECTORS = deskSectors;
export const AGENTS = deskAgents;
export const AGENT_DIRECTORY = deskAgentDirectory;
export const AGENT_ROLES = deskAgentRoles;

let state: DeskCategory[] = deskCategories.map((c) => ({ ...c, subcategories: c.subcategories.map((s) => ({ ...s })) }));

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

export function useDeskCategories() {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    () => state,
    () => state,
  );
}

/** Snapshot atual (usado pela camada de serviço mockada). */
export function getDeskCategoriesSnapshot() {
  return state;
}

export const categoriesApi = {
  upsert(cat: DeskCategory) {
    state = state.some((c) => c.id === cat.id) ? state.map((c) => (c.id === cat.id ? cat : c)) : [cat, ...state];
    emit();
  },
  remove(id: string) {
    state = state.filter((c) => c.id !== id);
    emit();
  },
  addSub(catId: string, sub: Omit<Subcategory, "id">) {
    state = state.map((c) =>
      c.id === catId ? { ...c, subcategories: [...c.subcategories, { ...sub, id: `${catId}-${Date.now()}` }] } : c,
    );
    emit();
  },
  updateSub(catId: string, subId: string, patch: Partial<Subcategory>) {
    state = state.map((c) =>
      c.id === catId
        ? { ...c, subcategories: c.subcategories.map((s) => (s.id === subId ? { ...s, ...patch } : s)) }
        : c,
    );
    emit();
  },
  removeSub(catId: string, subId: string) {
    state = state.map((c) =>
      c.id === catId ? { ...c, subcategories: c.subcategories.filter((s) => s.id !== subId) } : c,
    );
    emit();
  },
};
