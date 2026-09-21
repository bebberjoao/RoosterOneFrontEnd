// Store reativo (em memória) das categorias/subcategorias do Rooster Desk.
// O dado agora vem do backend real via deskCategoryService; este arquivo só
// mantém o estado local que a UI observa (useSyncExternalStore) e recarrega
// depois de cada mutação, para telas que já esperavam esse padrão síncrono
// (categoriesApi.upsert/remove/...) não precisarem mudar.
import { useEffect, useSyncExternalStore } from "react";
import { deskAgentDirectory, deskAgentRoles } from "@/mock/database/deskCategories";
import type { DeskCategory, DeskSubcategory, DeskAgent } from "@/mock/database/deskCategories";
import { deskCategoryService } from "@/services/mock-api/desk-category.service";

export type { DeskCategory, DeskAgent };
export type Subcategory = DeskSubcategory;

export let SECTORS: string[] = [];
export const AGENT_DIRECTORY = deskAgentDirectory;
export const AGENT_ROLES = deskAgentRoles;
export let AGENTS: string[] = [];

let state: DeskCategory[] = [];
let loaded = false;

const listeners = new Set<() => void>();
function emit() {
  listeners.forEach((l) => l());
}

async function reload() {
  const [cats, sectors, agents] = await Promise.all([
    deskCategoryService.getAll(),
    deskCategoryService.getSectors(),
    deskCategoryService.getAgents(),
  ]);
  state = cats;
  SECTORS = sectors;
  AGENTS = agents;
  loaded = true;
  emit();
}

export function useDeskCategories() {
  useEffect(() => {
    if (!loaded) void reload();
  }, []);
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
    const exists = state.some((c) => c.id === cat.id);
    const op = exists
      ? deskCategoryService.update(cat.id, cat)
      : deskCategoryService.create(cat);
    return op.then((r) => { void reload(); return r; });
  },
  remove(id: string) {
    return deskCategoryService.remove(id).then((r) => { void reload(); return r; });
  },
  addSub(catId: string, sub: Omit<Subcategory, "id">) {
    return deskCategoryService.addSubcategory(catId, sub).then((r) => { void reload(); return r; });
  },
  updateSub(catId: string, subId: string, patch: Partial<Subcategory>) {
    return deskCategoryService.updateSubcategory(catId, subId, patch).then((r) => { void reload(); return r; });
  },
  removeSub(catId: string, subId: string) {
    return deskCategoryService.removeSubcategory(catId, subId).then((r) => { void reload(); return r; });
  },
};
