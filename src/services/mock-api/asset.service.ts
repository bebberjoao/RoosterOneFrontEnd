// Mock service for Rooster Assets (patrimony/inventory management).
import { db } from "@/mock/database";
import type { Asset } from "@/mock/database/assets";
import type { AssetMovement } from "@/mock/database/assetMovements";
import type { AssetCategory } from "@/mock/database/assetCategories";
import type { AssetSector } from "@/mock/database/assetSectors";
import { delay, nextId, applyFilters, type Filters } from "./utils";

let assets = [...db.assets];
let movements = [...db.assetMovements];
let categories = [...db.assetCategories];
let sectors = [...db.assetSectors];

export const assetService = {
  async getAll(filters?: Filters<Asset>): Promise<Asset[]> {
    return delay(applyFilters(assets, filters));
  },
  async getById(id: string): Promise<Asset | undefined> {
    return delay(assets.find((a) => a.id === id));
  },
  async create(dto: Omit<Asset, "id" | "createdAt">): Promise<Asset> {
    const created: Asset = { ...dto, id: nextId("asset"), createdAt: new Date().toISOString() };
    assets = [...assets, created];
    return delay(created);
  },
  async update(id: string, dto: Partial<Asset>): Promise<Asset | undefined> {
    assets = assets.map((a) => (a.id === id ? { ...a, ...dto } : a));
    return delay(assets.find((a) => a.id === id));
  },
  async remove(id: string): Promise<boolean> {
    const before = assets.length;
    assets = assets.filter((a) => a.id !== id);
    return delay(assets.length < before);
  },
  async search(query: string): Promise<Asset[]> {
    const q = query.toLowerCase();
    return delay(assets.filter((a) => a.name.toLowerCase().includes(q) || a.tag.toLowerCase().includes(q)));
  },

  // Domain-specific helpers
  async getCategories() {
    return delay(categories);
  },
  async createCategory(dto: Omit<AssetCategory, "id">): Promise<AssetCategory> {
    const created: AssetCategory = { ...dto, id: nextId("cat") };
    categories = [...categories, created];
    return delay(created);
  },
  async updateCategory(id: string, dto: Partial<AssetCategory>): Promise<AssetCategory | undefined> {
    categories = categories.map((c) => (c.id === id ? { ...c, ...dto } : c));
    return delay(categories.find((c) => c.id === id));
  },
  async removeCategory(id: string): Promise<boolean> {
    const before = categories.length;
    categories = categories.filter((c) => c.id !== id);
    return delay(categories.length < before);
  },
  async getSectors(): Promise<AssetSector[]> {
    return delay(sectors);
  },
  async createSector(dto: Omit<AssetSector, "id">): Promise<AssetSector> {
    const created: AssetSector = { ...dto, id: nextId("sec") };
    sectors = [...sectors, created];
    return delay(created);
  },
  async updateSector(id: string, dto: Partial<AssetSector>): Promise<AssetSector | undefined> {
    sectors = sectors.map((s) => (s.id === id ? { ...s, ...dto } : s));
    return delay(sectors.find((s) => s.id === id));
  },
  async removeSector(id: string): Promise<boolean> {
    const before = sectors.length;
    sectors = sectors.filter((s) => s.id !== id);
    return delay(sectors.length < before);
  },
  async getMovements(filters?: Filters<AssetMovement>) {
    return delay(applyFilters(movements, filters));
  },
  async registerMovement(dto: Omit<AssetMovement, "id">): Promise<AssetMovement> {
    const created: AssetMovement = { ...dto, id: nextId("mov") };
    movements = [...movements, created];
    return delay(created);
  },
};
