import { getApiUserId, httpClient } from "@/services/http";
import type { DeskCategory, DeskSubcategory } from "@/mock/database/deskCategories";
import type { Filters } from "./utils";

export const deskCategoryService = {
  headers: () => ({ "x-user-id": getApiUserId() ?? "10000000-0000-4000-8000-000000000004" }),
  async getAll(filters?: Filters<DeskCategory>): Promise<DeskCategory[]> {
    return httpClient.get<DeskCategory[]>("/chamados-categorias", filters as Record<string, unknown> | undefined, deskCategoryService.headers());
  },
  async getById(id: string): Promise<DeskCategory | undefined> {
    try { return await httpClient.get<DeskCategory>(`/chamados-categorias/${id}`, undefined, deskCategoryService.headers()); } catch { return undefined; }
  },
  async create(dto: Omit<DeskCategory, "id">): Promise<DeskCategory> {
    return httpClient.post<DeskCategory>("/chamados-categorias", { nome: dto.name, setorId: dto.sectorId, slaHoras: dto.slaHours }, deskCategoryService.headers());
  },
  async update(id: string, dto: Partial<DeskCategory>): Promise<DeskCategory | undefined> {
    try { return await httpClient.patch<DeskCategory>(`/chamados-categorias/${id}`, { nome: dto.name, setorId: dto.sectorId, slaHoras: dto.slaHours }, deskCategoryService.headers()); } catch { return undefined; }
  },
  async remove(id: string): Promise<boolean> {
    try { await httpClient.delete<void>(`/chamados-categorias/${id}`, deskCategoryService.headers()); return true; } catch { return false; }
  },

  // Subcategorias
  async addSubcategory(categoryId: string, dto: Omit<DeskSubcategory, "id">) {
    return httpClient.post<DeskCategory>("/chamados-subcategorias", { categoriaId: categoryId, nome: dto.name, slaHoras: dto.slaHours }, deskCategoryService.headers());
  },
  async updateSubcategory(categoryId: string, subId: string, dto: Partial<DeskSubcategory>) {
    return httpClient.patch<DeskCategory>(`/chamados-subcategorias/${subId}`, { nome: dto.name, slaHoras: dto.slaHours }, deskCategoryService.headers());
  },
  async removeSubcategory(categoryId: string, subId: string) {
    await httpClient.delete<void>(`/chamados-subcategorias/${subId}`, deskCategoryService.headers());
  },

  // Atendentes
  async getAgents(): Promise<string[]> {
    return httpClient.get<string[]>("/chamados-atendentes", undefined, deskCategoryService.headers());
  },
  async getSectors(): Promise<string[]> {
    return httpClient.get<string[]>("/chamados-setores", undefined, deskCategoryService.headers());
  },
  async setAgentSubcategories(agent: string, subIds: string[]) {
    await Promise.all(subIds.map((subId) => httpClient.patch<void>(`/chamados-subcategorias/${subId}/atendentes`, { usuarioIds: [agent] }, deskCategoryService.headers())));
  },
  setSubcategoryAgents: (subId: string, usuarioIds: string[]) =>
    httpClient.patch<void>(`/chamados-subcategorias/${subId}/atendentes`, { usuarioIds }, deskCategoryService.headers()),
};
