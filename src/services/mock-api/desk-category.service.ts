// Mock service for Desk categories/subcategories/agents (helpdesk taxonomy).
// Endpoints previstos: /chamados-categorias, /chamados-subcategorias, /chamados-atendentes.
import { db } from "@/mock/database";
import type { DeskCategory, DeskSubcategory } from "@/mock/database/deskCategories";
import {
  categoriesApi,
  getDeskCategoriesSnapshot,
} from "@/components/rooster/desk/categories-store";
import { delay, applyFilters, type Filters } from "./utils";

export const deskCategoryService = {
  async getAll(filters?: Filters<DeskCategory>): Promise<DeskCategory[]> {
    return delay(applyFilters(getDeskCategoriesSnapshot(), filters));
  },
  async getById(id: string): Promise<DeskCategory | undefined> {
    return delay(getDeskCategoriesSnapshot().find((c) => c.id === id));
  },
  async create(dto: Omit<DeskCategory, "id">): Promise<DeskCategory> {
    const created: DeskCategory = { ...dto, id: `cat-${Date.now()}` };
    categoriesApi.upsert(created);
    return delay(created);
  },
  async update(id: string, dto: Partial<DeskCategory>): Promise<DeskCategory | undefined> {
    const current = getDeskCategoriesSnapshot().find((c) => c.id === id);
    if (current) categoriesApi.upsert({ ...current, ...dto, id });
    return delay(getDeskCategoriesSnapshot().find((c) => c.id === id));
  },
  async remove(id: string): Promise<boolean> {
    const existed = getDeskCategoriesSnapshot().some((c) => c.id === id);
    categoriesApi.remove(id);
    return delay(existed);
  },

  // Subcategorias
  async addSubcategory(categoryId: string, dto: Omit<DeskSubcategory, "id">) {
    categoriesApi.addSub(categoryId, dto);
    return delay(getDeskCategoriesSnapshot().find((c) => c.id === categoryId));
  },
  async updateSubcategory(categoryId: string, subId: string, dto: Partial<DeskSubcategory>) {
    categoriesApi.updateSub(categoryId, subId, dto);
    return delay(getDeskCategoriesSnapshot().find((c) => c.id === categoryId));
  },
  async removeSubcategory(categoryId: string, subId: string) {
    categoriesApi.removeSub(categoryId, subId);
    return delay(true);
  },

  // Atendentes
  async getAgents(): Promise<string[]> {
    return delay(db.deskAgents);
  },
  async getSectors(): Promise<string[]> {
    return delay(db.deskSectors);
  },
  async setAgentSubcategories(agent: string, subIds: string[]) {
    for (const c of getDeskCategoriesSnapshot()) {
      for (const s of c.subcategories) {
        const should = subIds.includes(s.id);
        const has = s.assignees.includes(agent);
        if (should === has) continue;
        categoriesApi.updateSub(c.id, s.id, {
          assignees: should ? [...s.assignees, agent] : s.assignees.filter((a) => a !== agent),
        });
      }
    }
    return delay(true);
  },
};
