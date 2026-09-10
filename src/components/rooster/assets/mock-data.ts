export type {
  AssetStatus,
  AssetCondition,
  Asset,
} from "@/mock/database/assets";
import type { AssetStatus, AssetCondition } from "@/mock/database/assets";
export const INITIAL_ASSETS: Asset[] = [];
export const LOCATIONS: string[] = [];
export const STATUS_META: Record<AssetStatus, { label: string; tone: string }> = {
  disponivel: { label: "Disponível", tone: "oklch(0.62 0.18 155)" },
  "em-uso": { label: "Em uso", tone: "oklch(0.55 0.19 265)" },
  emprestado: { label: "Emprestado", tone: "oklch(0.72 0.16 90)" },
  manutencao: { label: "Manutenção", tone: "oklch(0.68 0.18 40)" },
  baixado: { label: "Baixado", tone: "oklch(0.55 0.02 260)" },
};
export const CONDITION_META: Record<AssetCondition, { label: string; tone: string }> = {
  novo: { label: "Novo", tone: "oklch(0.62 0.18 155)" },
  bom: { label: "Bom", tone: "oklch(0.55 0.19 265)" },
  regular: { label: "Regular", tone: "oklch(0.72 0.16 90)" },
  ruim: { label: "Ruim", tone: "oklch(0.68 0.18 40)" },
  inservivel: { label: "Inservível", tone: "oklch(0.6 0.22 25)" },
};

export type { MovementType, AssetMovement } from "@/mock/database/assetMovements";
import type { MovementType } from "@/mock/database/assetMovements";
export const INITIAL_MOVEMENTS: AssetMovement[] = [];
export const MOVEMENT_META: Record<MovementType, { label: string; tone: string }> = {
  sala: { label: "Mudança de sala", tone: "oklch(0.55 0.19 265)" },
  setor: { label: "Mudança de setor", tone: "oklch(0.68 0.15 195)" },
  emprestimo: { label: "Empréstimo", tone: "oklch(0.72 0.16 90)" },
  devolucao: { label: "Devolução", tone: "oklch(0.62 0.18 155)" },
  manutencao: { label: "Manutenção", tone: "oklch(0.68 0.18 40)" },
  baixa: { label: "Baixa de patrimônio", tone: "oklch(0.5 0.02 260)" },
};

export type { AssetCategory } from "@/mock/database/assetCategories";
export const INITIAL_CATEGORIES: AssetCategory[] = [];

export type { AssetSector } from "@/mock/database/assetSectors";
export const SECTORS: string[] = [];
export const PEOPLE: string[] = [];
export const INITIAL_SECTORS: AssetSector[] = [];
export const UNASSIGNED_SECTOR_ID = "";

export const money = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export const fmtDate = (iso: string) =>
  new Date(iso.length <= 10 ? `${iso}T12:00:00Z` : iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
