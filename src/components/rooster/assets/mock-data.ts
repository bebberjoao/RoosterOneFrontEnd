// Rooster Assets — camada de dados (mock).
// Fonte única dos arrays de seed: src/mock/database/{assets,assetCategories,
// assetMovements,assetSectors}.ts. Este arquivo mantém tipos derivados,
// labels e helpers de formatação usados pelas telas do módulo.
//
// Arquitetura preparada para integrações futuras:
//  - Rooster Rooms: `locationId` referencia um espaço físico (campus/bloco/sala).
//  - Rooster Desk:  `maintenanceTicketId` guardará o chamado de manutenção.
//  - Rooster Hub:   `ownerUserId` referencia o usuário responsável.

export type {
  AssetStatus,
  AssetCondition,
  Asset,
} from "@/mock/database/assets";
export { STATUS_META, CONDITION_META, LOCATIONS, assets as INITIAL_ASSETS } from "@/mock/database/assets";

export type { MovementType, AssetMovement } from "@/mock/database/assetMovements";
export { MOVEMENT_META, assetMovements as INITIAL_MOVEMENTS } from "@/mock/database/assetMovements";

export type { AssetCategory } from "@/mock/database/assetCategories";
export { assetCategories as INITIAL_CATEGORIES } from "@/mock/database/assetCategories";

export type { AssetSector } from "@/mock/database/assetSectors";
export {
  SECTORS,
  PEOPLE,
  assetSectors as INITIAL_SECTORS,
  UNASSIGNED_SECTOR_ID,
} from "@/mock/database/assetSectors";

export const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const fmtDate = (iso: string) =>
  new Date(iso.length <= 10 ? `${iso}T12:00:00Z` : iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
