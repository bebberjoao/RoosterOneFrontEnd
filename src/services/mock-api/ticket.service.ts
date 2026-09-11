import type { Ticket } from "@/mock/database/tickets";
import { getApiUserId, httpClient } from "@/services/http";
import type { Filters } from "./utils";

const query = (filters?: Filters<Ticket>) => filters as Record<string, unknown> | undefined;
const deskHeaders = () => ({ "x-user-id": getApiUserId() ?? "10000000-0000-4000-8000-000000000004" });

export const ticketService = {
  async getAll(filters?: Filters<Ticket>): Promise<Ticket[]> {
    const rows = await httpClient.get<ApiTicket[]>("/chamados", query(filters), deskHeaders());
    return rows.map(toTicket);
  },
  async getById(id: string): Promise<Ticket | undefined> {
    try { return toTicket(await httpClient.get<ApiTicket>(`/chamados/${id}`, undefined, deskHeaders())); } catch { return undefined; }
  },
  async create(dto: Omit<Ticket, "id" | "number" | "events">): Promise<Ticket> {
    const categories = await httpClient.get<ApiCategory[]>("/chamados-categorias", undefined, deskHeaders());
    const category = categories.find((item) => item.id === dto.categoryId);
    const subcategoryId = category?.subcategorias?.find((item) => item.nome === dto.subcategory)?.id;
    const created = await httpClient.post<ApiTicket>("/chamados", {
      titulo: dto.title,
      descricao: dto.description,
      categoriaId: dto.categoryId || undefined,
      subcategoriaId: subcategoryId,
      prioridadeId: { baixa: "1", media: "2", alta: "3", critica: "4" }[dto.priority],
    }, deskHeaders());
    return toTicket(created);
  },
  assign: (id: string, tecnicoId: string) => httpClient.patch<ApiTicket>(`/chamados/${id}/atribuir`, { tecnicoId }, deskHeaders()).then(toTicket),
  async update(id: string, dto: Partial<Ticket>): Promise<Ticket | undefined> {
    try { return toTicket(await httpClient.patch<ApiTicket>(`/chamados/${id}`, {
      ...(dto.title ? { titulo: dto.title } : {}),
      ...(dto.description ? { descricao: dto.description } : {}),
      ...(dto.categoryId ? { categoriaId: dto.categoryId } : {}),
      ...(dto.assigneeId ? { tecnicoId: dto.assigneeId } : {}),
    }, deskHeaders())); } catch { return undefined; }
  },
  async remove(id: string): Promise<boolean> {
    try { await httpClient.delete<void>(`/chamados/${id}`); return true; } catch { return false; }
  },
  async search(query: string): Promise<Ticket[]> {
    return httpClient.get<Ticket[]>("/chamados", { search: query }, deskHeaders());
  },

  // Domain-specific helpers
  async getCategories() {
    const rows = await httpClient.get<ApiCategory[]>("/chamados-categorias", undefined, deskHeaders());
    return rows.map(toCategory);
  },
  async getByCategory(categoryId: string) {
    return httpClient.get<Ticket[]>("/chamados", { categoryId }, deskHeaders());
  },

  // Conversa do chamado
  async getMessages(ticketId: string, antes?: string, limite?: number): Promise<{ mensagens: TicketMessage[]; proximoCursor: string | null }> {
    const res = await httpClient.get<{ mensagens: ApiMensagemChamado[]; proximoCursor: string | null }>(
      `/chamados/${ticketId}/mensagens`,
      { antes, limite },
      deskHeaders(),
    );
    return { mensagens: res.mensagens.map(toTicketMessage), proximoCursor: res.proximoCursor };
  },
  async sendMessage(ticketId: string, mensagem: string, interno = false): Promise<TicketMessage> {
    const created = await httpClient.post<ApiMensagemChamado>(`/chamados/${ticketId}/mensagens`, { mensagem, interno }, deskHeaders());
    return toTicketMessage(created);
  },
  async closeTicket(ticketId: string): Promise<void> {
    const statuses = await httpClient.get<Array<{ id: string; nome: string }>>("/chamados-status", undefined, deskHeaders());
    const encerrado = statuses.find((s) => s.nome === "Encerrado");
    if (!encerrado) throw new Error('Status "Encerrado" não está cadastrado.');
    await httpClient.patch(`/chamados/${ticketId}/status`, { statusId: encerrado.id, encerradoEm: new Date().toISOString() }, deskHeaders());
  },
};

export type ApiMensagemChamado = {
  id: string;
  mensagem: string;
  interno: boolean;
  criadoEm: string;
  usuario: { id: string; nome: string } | null;
};

export type TicketMessage = {
  id: string;
  autorId: string;
  autor: string;
  texto: string;
  interno: boolean;
  criadoEm: string;
};

export const toTicketMessage = (value: ApiMensagemChamado): TicketMessage => ({
  id: value.id,
  autorId: value.usuario?.id ?? "",
  autor: value.usuario?.nome ?? "Usuário",
  texto: value.mensagem,
  interno: value.interno,
  criadoEm: value.criadoEm,
});

type ApiCategory = { id: string; nome: string; descricao?: string | null; slaHoras?: number | null; subcategorias?: Array<{ id: string; nome: string }> };
type ApiTicket = {
  id: string; protocolo?: string | null; titulo: string; descricao: string; categoriaId?: string | null;
  subcategoriaId?: string | null; prioridadeId?: string | null; statusId?: string | null;
  criadoEm?: string | null; atualizadoEm?: string | null; encerradoEm?: string | null; usuario?: { id: string; nome: string } | null;
  tecnico?: { nome: string } | null; categoria?: ApiCategory | null; subcategoria?: { nome: string; slaHoras?: number | null } | null;
  prioridade?: { nome: string } | null; status?: { nome: string } | null;
};

/**
 * Prazo de SLA = criação + horas configuradas na subcategoria (mais
 * específica) ou, se não houver, na categoria. `%` é o tempo restante até
 * o prazo; chamados encerrados congelam o cálculo no momento do
 * encerramento em vez de continuar drenando contra o relógio atual.
 */
function calcularSla(criadoEm: string, encerradoEm: string | null | undefined, slaHoras: number) {
  const inicio = new Date(criadoEm).getTime();
  const prazo = inicio + slaHoras * 60 * 60 * 1000;
  const referencia = encerradoEm ? new Date(encerradoEm).getTime() : Date.now();
  const total = prazo - inicio;
  const restante = prazo - referencia;
  const percent = total > 0 ? Math.round((restante / total) * 100) : 0;
  return {
    slaDeadline: new Date(prazo).toISOString(),
    slaPercent: Math.max(0, Math.min(100, percent)),
  };
}

const toCategory = (value: ApiCategory): TicketCategory => ({
  id: value.id,
  name: value.nome,
  color: "oklch(0.6 0.1 260)",
  icon: "Ticket",
  slaHours: value.slaHoras ?? 8,
  owner: "Rooster Desk",
  subcategories: value.subcategorias?.map((item) => item.nome) ?? [],
});

const toTicket = (value: ApiTicket): Ticket => {
  const openedAt = value.criadoEm ?? new Date().toISOString();
  const priority = value.prioridade?.nome === "urgente" ? "critica" : value.prioridade?.nome ?? "media";
  const statusByName: Record<string, Ticket["status"]> = {
    Aberto: "aberto", "Em atendimento": "atendimento", Pendente: "pendente", Resolvido: "resolvido", Encerrado: "encerrado",
  };
  const slaHoras = value.subcategoria?.slaHoras ?? value.categoria?.slaHoras ?? 8;
  const { slaDeadline, slaPercent } = calcularSla(openedAt, value.encerradoEm, slaHoras);
  return {
    id: value.id,
    number: value.protocolo ?? `#${value.id.slice(0, 8)}`,
    title: value.titulo,
    categoryId: value.categoriaId ?? "",
    categoryName: value.categoria?.nome ?? "Sem categoria",
    requesterId: value.usuario?.id,
    subcategory: value.subcategoria?.nome ?? "Geral",
    requester: { name: value.usuario?.nome ?? "Não informado", role: "Solicitante", sector: "" },
    assignee: value.tecnico ? { name: value.tecnico.nome, role: "Técnico" } : null,
    assigneeId: value.tecnico?.id,
    priority: priority as Ticket["priority"],
    status: statusByName[value.status?.nome ?? "Aberto"] ?? "aberto",
    slaPercent,
    slaDeadline,
    openedAt,
    updatedAt: value.atualizadoEm ?? openedAt,
    description: value.descricao,
    tags: [],
    favorite: false,
    events: [],
  };
};
