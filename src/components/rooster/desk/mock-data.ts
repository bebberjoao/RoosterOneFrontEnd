// Fonte única de dados: os arrays de seed (TICKETS/CATEGORIES) vivem em
// src/mock/database/tickets.ts. Este arquivo mantém tipos, labels e helpers
// de formatação usados pelas telas do módulo Desk.
export type {
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketEvent,
  Ticket,
} from "@/mock/database/tickets";
export { CATEGORIES, tickets as TICKETS } from "@/mock/database/tickets";

import { CATEGORIES } from "@/mock/database/tickets";
import type { TicketStatus, TicketPriority } from "@/mock/database/tickets";
import { fmtDataHora } from "@/lib/formatacao";

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  critica: "Crítica",
};

export const STATUS_LABEL: Record<TicketStatus, string> = {
  aberto: "Aberto",
  atendimento: "Em atendimento",
  pendente: "Pendente",
  resolvido: "Resolvido",
  encerrado: "Encerrado",
};

export const PRIORITY_TONE: Record<TicketPriority, string> = {
  baixa: "oklch(0.72 0.1 200)",
  media: "oklch(0.72 0.14 90)",
  alta: "oklch(0.68 0.18 40)",
  critica: "oklch(0.6 0.22 25)",
};

export const STATUS_TONE: Record<TicketStatus, string> = {
  aberto: "oklch(0.65 0.18 25)",
  atendimento: "oklch(0.6 0.18 260)",
  pendente: "oklch(0.72 0.14 90)",
  resolvido: "oklch(0.62 0.18 155)",
  encerrado: "oklch(0.55 0.02 260)",
};

export function categoryName(id: string) {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id;
}

export function categoryColor(id: string) {
  return CATEGORIES.find((c) => c.id === id)?.color ?? "oklch(0.6 0.1 260)";
}

export function formatDate(iso: string) {
  return fmtDataHora(iso);
}

export function relative(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "agora";
  if (diff < 3600) return `há ${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`;
  return `há ${Math.floor(diff / 86400)}d`;
}
