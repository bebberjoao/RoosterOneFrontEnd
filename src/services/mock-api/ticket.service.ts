// Rooster Desk — chamados ligados ao backend real via client HTTP
// compartilhado. O modelo do backend é relacional (usuário/técnico por id,
// categoria/subcategoria/prioridade/status por FK); o mock guardava tudo
// embutido no próprio chamado (requester/assignee como objeto, timeline de
// eventos). A tradução fica toda aqui, para as telas não precisarem mudar.
//
// Limitação conhecida: o backend não tem uma tabela de eventos do chamado
// (status/prioridade/categoria/atribuição não viram uma linha do tempo) —
// só o valor atual de cada campo. A conversa (mensagens) é real, via
// /chamados/:id/mensagens; os demais tipos de evento não aparecem no
// histórico ao vir do servidor.
import type { Ticket, TicketCategory, TicketStatus, TicketPriority, TicketEvent } from "@/mock/database/tickets";
import { request } from "@/services/hub/client";
import { session } from "@/services/hub/session";
import { applyFilters, type Filters } from "./utils";

const STATUS_TO_SLUG: Record<string, TicketStatus> = {
  "Aberto": "aberto", "Em atendimento": "atendimento", "Pendente": "pendente",
  "Resolvido": "resolvido", "Encerrado": "encerrado",
};
const SLUG_TO_STATUS_NAME: Record<TicketStatus, string> = {
  aberto: "Aberto", atendimento: "Em atendimento", pendente: "Pendente",
  resolvido: "Resolvido", encerrado: "Encerrado",
};
const PRIORITY_TO_SLUG: Record<string, TicketPriority> = { baixa: "baixa", media: "media", alta: "alta", urgente: "critica" };
const SLUG_TO_PRIORITY_NAME: Record<TicketPriority, string> = { baixa: "baixa", media: "media", alta: "alta", critica: "urgente" };
// PrioridadeTicket usa ids fixos (seed: 1=baixa, 2=media, 3=alta, 4=urgente) —
// o próprio DTO do backend só aceita esses 4 valores literais.
const SLUG_TO_PRIORIDADE_ID: Record<TicketPriority, string> = { baixa: "1", media: "2", alta: "3", critica: "4" };

type BackStatus = { id: string; nome: string };
type BackPrioridade = { id: string; nome: string };
type BackUsuario = { id: string; nome: string };
type BackSubcategoria = { id: string; nome: string; slaHoras?: number };
type BackCategoria = { id: string; nome: string; slaHoras?: number; setor?: { nome: string } | null; subcategorias?: BackSubcategoria[] };
type BackTicket = {
  id: string; protocolo?: string | null; titulo: string; descricao: string;
  usuario?: BackUsuario | null; tecnico?: BackUsuario | null;
  categoriaId?: string | null; categoria?: BackCategoria | null;
  subcategoriaId?: string | null; subcategoria?: BackSubcategoria | null;
  prioridade?: BackPrioridade | null; status?: BackStatus | null;
  criadoEm?: string | null; atualizadoEm?: string | null;
};

let statusCache: BackStatus[] | null = null;
let prioridadeCache: BackPrioridade[] | null = null;
let categoriaCache: BackCategoria[] | null = null;

async function loadLookups() {
  if (!statusCache || !prioridadeCache || !categoriaCache) {
    [statusCache, prioridadeCache, categoriaCache] = await Promise.all([
      request<BackStatus[]>("/chamados-status"),
      request<BackPrioridade[]>("/chamados-prioridades"),
      request<BackCategoria[]>("/chamados-categorias"),
    ]);
  }
  return { status: statusCache!, prioridade: prioridadeCache!, categoria: categoriaCache! };
}

function slaFor(categoria?: BackCategoria | null, subcategoria?: BackSubcategoria | null): number {
  return subcategoria?.slaHoras ?? categoria?.slaHoras ?? 8;
}

function computeSla(criadoEm: string | undefined, horas: number): number {
  if (!criadoEm) return 100;
  const elapsedH = (Date.now() - new Date(criadoEm).getTime()) / 3_600_000;
  return Math.max(0, Math.min(100, Math.round(100 - (elapsedH / horas) * 100)));
}

function toFrontTicket(b: BackTicket): Ticket {
  const horas = slaFor(b.categoria, b.subcategoria);
  const criadoEm = b.criadoEm ?? new Date().toISOString();
  const deadline = new Date(new Date(criadoEm).getTime() + horas * 3_600_000).toISOString();
  return {
    id: b.id,
    number: b.protocolo ?? `#${b.id.slice(0, 6)}`,
    title: b.titulo,
    categoryId: b.categoriaId ?? b.categoria?.id ?? "",
    subcategory: b.subcategoria?.nome ?? "",
    requester: { name: b.usuario?.nome ?? "—", role: "Solicitante", sector: b.categoria?.setor?.nome ?? "—" },
    assignee: b.tecnico ? { name: b.tecnico.nome, role: "Técnico" } : null,
    priority: PRIORITY_TO_SLUG[b.prioridade?.nome ?? "media"] ?? "media",
    status: STATUS_TO_SLUG[b.status?.nome ?? "Aberto"] ?? "aberto",
    slaPercent: computeSla(criadoEm, horas),
    slaDeadline: deadline,
    openedAt: criadoEm,
    updatedAt: b.atualizadoEm ?? criadoEm,
    description: b.descricao,
    tags: [],
    favorite: false,
    events: [],
  };
}

async function messagesAsEvents(ticketId: string, requesterId?: string | null): Promise<TicketEvent[]> {
  type BackMensagem = { id: string; usuario?: { id: string; nome: string } | null; mensagem: string; interno: boolean; criadoEm: string };
  const res = await request<{ mensagens: BackMensagem[] }>(`/chamados/${ticketId}/mensagens`).catch(() => ({ mensagens: [] }));
  return res.mensagens.map((m) => ({
    kind: "message" as const,
    author: m.usuario?.nome ?? "—",
    role: (m.usuario?.id && m.usuario.id === requesterId ? "solicitante" : "tecnico") as "solicitante" | "tecnico",
    at: m.criadoEm,
    body: m.mensagem,
    internal: m.interno,
  }));
}

export const ticketService = {
  async getAll(filters?: Filters<Ticket>): Promise<Ticket[]> {
    const rows = await request<BackTicket[]>("/chamados");
    return applyFilters(rows.map(toFrontTicket), filters);
  },
  async getById(id: string): Promise<Ticket | undefined> {
    const back = await request<BackTicket & { usuarioId?: string }>(`/chamados/${id}`).catch(() => undefined);
    if (!back) return undefined;
    const events = await messagesAsEvents(id, back.usuarioId ?? back.usuario?.id);
    return { ...toFrontTicket(back), events };
  },
  async create(dto: Omit<Ticket, "id" | "number" | "events">): Promise<Ticket> {
    const { categoria } = await loadLookups();
    const cat = categoria.find((c) => c.id === dto.categoryId);
    const sub = cat?.subcategorias?.find((s) => s.nome === dto.subcategory);
    const created = await request<BackTicket>("/chamados", {
      method: "POST",
      body: {
        titulo: dto.title,
        descricao: dto.description,
        categoriaId: dto.categoryId,
        subcategoriaId: sub?.id,
        usuarioId: session.usuario?.id,
        prioridadeId: SLUG_TO_PRIORIDADE_ID[dto.priority] ?? "2",
      },
    });
    return toFrontTicket({ ...created, categoria: cat, subcategoria: sub });
  },
  async update(id: string, dto: Partial<Ticket>): Promise<Ticket | undefined> {
    const { status, prioridade } = await loadLookups();
    const body: Record<string, unknown> = {};
    if (dto.title !== undefined) body.titulo = dto.title;
    if (dto.description !== undefined) body.descricao = dto.description;
    if (dto.categoryId !== undefined) body.categoriaId = dto.categoryId;
    if (dto.status !== undefined) body.statusId = status.find((s) => s.nome === SLUG_TO_STATUS_NAME[dto.status!])?.id;
    if (dto.priority !== undefined) body.prioridadeId = prioridade.find((p) => p.nome === SLUG_TO_PRIORITY_NAME[dto.priority!])?.id;
    const updated = await request<BackTicket>(`/chamados/${id}`, { method: "PATCH", body });
    return toFrontTicket(updated);
  },
  async remove(id: string): Promise<boolean> {
    await request<void>(`/chamados/${id}`, { method: "DELETE" });
    return true;
  },
  async search(query: string): Promise<Ticket[]> {
    const q = query.toLowerCase();
    const all = await this.getAll();
    return all.filter((t) => t.title.toLowerCase().includes(q) || t.number.includes(q));
  },

  // Domain-specific helpers
  async getCategories(): Promise<TicketCategory[]> {
    const { categoria } = await loadLookups();
    const palette = ["oklch(0.6 0.18 260)", "oklch(0.65 0.18 25)", "oklch(0.72 0.16 90)", "oklch(0.7 0.16 145)", "oklch(0.62 0.18 155)", "oklch(0.55 0.1 260)"];
    return categoria.map((c, i) => ({
      id: c.id,
      name: c.nome,
      color: palette[i % palette.length],
      icon: "Ticket",
      slaHours: c.slaHoras ?? 8,
      owner: c.setor?.nome ?? "—",
      subcategories: (c.subcategorias ?? []).map((s) => s.nome),
    }));
  },
  async getByCategory(categoryId: string) {
    const all = await this.getAll();
    return all.filter((t) => t.categoryId === categoryId);
  },

  async sendMessage(ticketId: string, body: string, interno: boolean) {
    return request(`/chamados/${ticketId}/mensagens`, { method: "POST", body: { mensagem: body, interno } });
  },
};
