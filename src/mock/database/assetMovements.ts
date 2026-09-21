// Table: asset_movements — seed movido de rooster/assets/mock-data.ts (INITIAL_MOVEMENTS). FK: assetId.
import { LOCATIONS } from "@/mock/database/assets";

export type MovementType = "setor" | "sala" | "emprestimo" | "devolucao" | "manutencao";

export type AssetMovement = {
  id: string;
  assetId: string;
  type: MovementType;
  from?: string;
  to?: string;
  user: string;
  date: string; // ISO
  notes?: string;
  /** Só usado quando type === "emprestimo": prazo previsto de devolução. */
  dueDate?: string;
  /** Preenchido quando o empréstimo é marcado como devolvido. */
  returnedAt?: string;
};

export const MOVEMENT_META: Record<MovementType, { label: string; tone: string }> = {
  setor: { label: "Alteração de setor", tone: "oklch(0.55 0.19 265)" },
  sala: { label: "Alteração de sala", tone: "oklch(0.68 0.14 195)" },
  emprestimo: { label: "Empréstimo", tone: "oklch(0.68 0.18 40)" },
  devolucao: { label: "Devolução", tone: "oklch(0.62 0.18 155)" },
  manutencao: { label: "Envio para manutenção", tone: "oklch(0.72 0.14 90)" },
};

export const assetMovements: AssetMovement[] = [
  { id: "m-001", assetId: "a-002", type: "emprestimo", from: "Infraestrutura de TI", to: "Camila Souza", user: "Diego Martins", date: "2026-06-12T14:20:00Z", notes: "Empréstimo para banca de TCC." },
  { id: "m-002", assetId: "a-004", type: "manutencao", from: LOCATIONS[6], to: "Oficina externa", user: "Bruno Alves", date: "2026-05-28T10:05:00Z", notes: "Troca de lâmpada e limpeza óptica." },
  { id: "m-003", assetId: "a-003", type: "sala", from: LOCATIONS[2], to: LOCATIONS[0], user: "Marina Ribeiro", date: "2026-04-02T09:00:00Z" },
  { id: "m-004", assetId: "a-012", type: "setor", from: "Biblioteca", to: "Infraestrutura de TI", user: "Diego Martins", date: "2026-03-19T16:40:00Z", notes: "Transferência de responsabilidade." },
  { id: "m-005", assetId: "a-010", type: "devolucao", from: "Camila Souza", to: "Depósito · Almoxarifado", user: "Diego Martins", date: "2026-02-08T11:15:00Z" },
  { id: "m-006", assetId: "a-014", type: "manutencao", from: LOCATIONS[2], to: "Manutenção", user: "Bruno Alves", date: "2026-01-15T08:30:00Z", notes: "Sem imagem." },
];

export const assetMovementsByAsset = (assetId: string) => assetMovements.filter((m) => m.assetId === assetId);
