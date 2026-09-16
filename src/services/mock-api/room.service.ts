// Rooster Rooms — 100% ligado ao backend real via client HTTP compartilhado
// (sem fallback para dado mockado: se a API estiver fora do ar, as telas
// mostram erro/vazio, não dado fake).
import type { Room } from "@/mock/database/rooms";
import type { Reservation } from "@/mock/database/reservations";
import type { ReservationEvent, SpaceType, SpaceStatus, ReservationStatus } from "@/components/rooster/rooms/mock-data";
import type { Campus } from "@/mock/database/campuses";
import type { Block } from "@/mock/database/blocks";
import { mapResource } from "@/services/hub/mapped-resource";
import { createResource as createRawResource } from "@/services/hub/index";
import { request } from "@/services/hub/client";
import { session } from "@/services/hub/session";
import { applyFilters, type Filters } from "./utils";

type CampusBack = {
  id: string; nome: string; codigo: string; endereco?: string | null; cidade?: string | null;
  estado?: string | null; cep?: string | null; responsavel?: string | null; ativo: boolean;
  observacoes?: string | null; cor?: string | null;
};
const campusService = mapResource<Campus, CampusBack>(
  "/campus", "cp", [],
  (b) => ({ id: b.id, name: b.nome, code: b.codigo, address: b.endereco ?? "", city: b.cidade ?? "", state: b.estado ?? "", zip: b.cep ?? "", manager: b.responsavel ?? "", active: b.ativo, notes: b.observacoes ?? undefined, color: b.cor ?? "oklch(0.6 0.18 260)" }),
  (f) => ({
    ...(f.name !== undefined && { nome: f.name }),
    ...(f.code !== undefined && { codigo: f.code }),
    ...(f.address !== undefined && { endereco: f.address }),
    ...(f.city !== undefined && { cidade: f.city }),
    ...(f.state !== undefined && { estado: f.state }),
    ...(f.zip !== undefined && { cep: f.zip }),
    ...(f.manager !== undefined && { responsavel: f.manager }),
    ...(f.active !== undefined && { ativo: f.active }),
    ...(f.notes !== undefined && { observacoes: f.notes }),
    ...(f.color !== undefined && { cor: f.color }),
  }),
);

type BlocoBack = { id: string; nome: string; codigo: string; campusId: string; andares: number; responsavel?: string | null; ativo: boolean };
const blockService = mapResource<Block, BlocoBack>(
  "/blocos", "bl", [],
  (b) => ({ id: b.id, name: b.nome, code: b.codigo, campusId: b.campusId, floors: b.andares, manager: b.responsavel ?? "", active: b.ativo }),
  (f) => ({
    ...(f.name !== undefined && { nome: f.name }),
    ...(f.code !== undefined && { codigo: f.code }),
    ...(f.campusId !== undefined && { campusId: f.campusId }),
    ...(f.floors !== undefined && { andares: f.floors }),
    ...(f.manager !== undefined && { responsavel: f.manager }),
    ...(f.active !== undefined && { ativo: f.active }),
  }),
);

type AmbienteBack = {
  id: string; nome: string; codigo: string; campusId: string; blocoId: string; andar: number; numero?: string | null;
  tipo: string; capacidade: number; area?: number | null; descricao?: string | null; capa?: string | null;
  galeria: string[]; recursos: string[]; status: string; horarioAbertura?: string | null; diasFuncionamento: string[]; duracaoMinutos?: number | null;
};
const roomResource = mapResource<Room, AmbienteBack>(
  "/ambientes", "room", [],
  (b) => ({
    id: b.id, name: b.nome, code: b.codigo, campusId: b.campusId, blockId: b.blocoId, floor: b.andar,
    number: b.numero ?? "", type: b.tipo as SpaceType, capacity: b.capacidade, area: b.area ?? 0,
    description: b.descricao ?? "", cover: b.capa ?? "", gallery: b.galeria ?? [], resources: (b.recursos ?? []) as Room["resources"],
    status: b.status as SpaceStatus, openingHours: b.horarioAbertura ?? "", weekdays: b.diasFuncionamento ?? [],
    // slots não tem coluna — é sempre gerado a partir de openingHours/duracaoMinutos quando ausente (por design).
    slots: undefined, slotMinutes: b.duracaoMinutos ?? undefined,
  }),
  (f) => ({
    ...(f.name !== undefined && { nome: f.name }),
    ...(f.code !== undefined && { codigo: f.code }),
    ...(f.campusId !== undefined && { campusId: f.campusId }),
    ...(f.blockId !== undefined && { blocoId: f.blockId }),
    ...(f.floor !== undefined && { andar: f.floor }),
    ...(f.number !== undefined && { numero: f.number }),
    ...(f.type !== undefined && { tipo: f.type }),
    ...(f.capacity !== undefined && { capacidade: f.capacity }),
    ...(f.area !== undefined && { area: f.area }),
    ...(f.description !== undefined && { descricao: f.description }),
    ...(f.cover !== undefined && { capa: f.cover }),
    ...(f.gallery !== undefined && { galeria: f.gallery }),
    ...(f.resources !== undefined && { recursos: f.resources }),
    ...(f.status !== undefined && { status: f.status }),
    ...(f.openingHours !== undefined && { horarioAbertura: f.openingHours }),
    ...(f.weekdays !== undefined && { diasFuncionamento: f.weekdays }),
    ...(f.slotMinutes !== undefined && { duracaoMinutos: f.slotMinutes }),
  }),
);

type BackHistorico = { id: string; campo?: string | null; valorAntigo?: string | null; valorNovo?: string | null; criadoEm: string; usuario?: { id: string; nome: string } | null };
type ReservaBack = {
  id: string; codigo: string; ambienteId: string; responsavelId?: string | null; responsavel: string;
  setorId?: string | null; setor?: string | null; evento: string; finalidade?: string | null; data: string;
  horarioInicio: string; horarioFim: string; participantes: number; status: string; recorrencia: string;
  observacoes?: string | null; decididoPor?: string | null; decididoEm?: string | null;
  motivoCancelamento?: string | null; historico?: BackHistorico[];
};

function historicoToEvent(h: BackHistorico): ReservationEvent | null {
  if (h.campo === 'status') {
    return { id: h.id, kind: "status", author: h.usuario?.nome ?? "—", at: h.criadoEm, from: (h.valorAntigo ?? "analise") as ReservationStatus, to: (h.valorNovo ?? "analise") as ReservationStatus };
  }
  if (h.campo === 'horario') {
    return { id: h.id, kind: "schedule", author: h.usuario?.nome ?? "—", at: h.criadoEm, from: h.valorAntigo ?? "", to: h.valorNovo ?? "" };
  }
  return null;
}

function reservaToFront(b: ReservaBack): Reservation {
  const historicoEvents = (b.historico ?? []).map(historicoToEvent).filter((e): e is ReservationEvent => e !== null);
  const ultimoStatus = [...(b.historico ?? [])].reverse().find((h) => h.campo === 'status');
  return {
    id: b.id, code: b.codigo, spaceId: b.ambienteId, roomId: b.ambienteId, responsible: b.responsavel,
    sector: b.setor ?? "", event: b.evento, purpose: b.finalidade ?? "", date: b.data, start: b.horarioInicio,
    end: b.horarioFim, participants: b.participantes, status: b.status as ReservationStatus,
    recurrence: b.recorrencia as Reservation["recurrence"], notes: b.observacoes ?? undefined,
    events: historicoEvents, cancellationReason: b.motivoCancelamento ?? undefined, decidedBy: ultimoStatus?.usuario?.nome,
  };
}

async function reservaComMensagens(id: string): Promise<Reservation> {
  const [back, mensagens] = await Promise.all([
    request<ReservaBack>(`/reservas/${id}`),
    request<Array<{ id: string; mensagem: string; criadoEm: string; usuario?: { id: string; nome: string } | null }>>(`/reservas/${id}/mensagens`).catch(() => []),
  ]);
  const reserva = reservaToFront(back);
  const mensagemEvents: ReservationEvent[] = mensagens.map((m) => ({
    id: m.id, kind: "message", author: m.usuario?.nome ?? "—",
    role: m.usuario?.id && m.usuario.id === back.responsavelId ? "solicitante" : "gestor",
    at: m.criadoEm, body: m.mensagem,
  }));
  reserva.events = [...reserva.events, ...mensagemEvents].sort((a, b) => a.at.localeCompare(b.at));
  return reserva;
}

const reservaResource = createRawResource<ReservaBack>("/reservas", "res", []);

export const roomService = {
  async getAll(filters?: Filters<Room>): Promise<Room[]> {
    return applyFilters(await roomResource.list(), filters);
  },
  async getById(id: string): Promise<Room | undefined> {
    return roomResource.get(id).catch(() => undefined);
  },
  async create(dto: Omit<Room, "id">): Promise<Room> {
    return roomResource.create(dto as Partial<Room>);
  },
  async update(id: string, dto: Partial<Room>): Promise<Room | undefined> {
    return roomResource.update(id, dto);
  },
  async remove(id: string): Promise<boolean> {
    await roomResource.remove(id);
    return true;
  },
  async search(query: string): Promise<Room[]> {
    const q = query.toLowerCase();
    const all = await roomResource.list();
    return all.filter((r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q));
  },

  // Domain-specific helpers
  async getStructureTree() {
    const [campuses, blocks, rooms] = await Promise.all([campusService.list(), blockService.list(), roomResource.list()]);
    return campuses.map((campus) => ({
      ...campus,
      blocks: blocks.filter((b) => b.campusId === campus.id).map((block) => ({ ...block, rooms: rooms.filter((r) => r.blockId === block.id) })),
    }));
  },
  async getReservations(filters?: Filters<Reservation>): Promise<Reservation[]> {
    const rows = (await reservaResource.list()).map(reservaToFront);
    return applyFilters(rows, filters);
  },
  async createReservation(dto: Omit<Reservation, "id">): Promise<Reservation> {
    const created = await reservaResource.create({
      codigo: dto.code, ambienteId: dto.roomId ?? dto.spaceId, responsavelId: session.usuario?.id, responsavel: dto.responsible,
      setor: dto.sector, evento: dto.event, finalidade: dto.purpose, data: dto.date, horarioInicio: dto.start,
      horarioFim: dto.end, participantes: dto.participants, status: dto.status, recorrencia: dto.recurrence ?? "unica",
      observacoes: dto.notes,
    } as Partial<ReservaBack>);
    return reservaToFront(created);
  },
  async updateReservation(id: string, dto: Partial<Reservation>): Promise<Reservation | undefined> {
    const patch: Partial<ReservaBack> = {};
    if (dto.code !== undefined) patch.codigo = dto.code;
    if (dto.responsible !== undefined) patch.responsavel = dto.responsible;
    if (dto.sector !== undefined) patch.setor = dto.sector;
    if (dto.event !== undefined) patch.evento = dto.event;
    if (dto.purpose !== undefined) patch.finalidade = dto.purpose;
    if (dto.date !== undefined) patch.data = dto.date;
    if (dto.start !== undefined) patch.horarioInicio = dto.start;
    if (dto.end !== undefined) patch.horarioFim = dto.end;
    if (dto.participants !== undefined) patch.participantes = dto.participants;
    if (dto.status !== undefined) patch.status = dto.status;
    if (dto.recurrence !== undefined) patch.recorrencia = dto.recurrence;
    if (dto.notes !== undefined) patch.observacoes = dto.notes;
    const updated = await reservaResource.update(id, patch);
    return reservaToFront(updated);
  },
  async getReservationById(id: string): Promise<Reservation | undefined> {
    return reservaComMensagens(id).catch(() => undefined);
  },
  async addReservationMessage(id: string, message: { body: string }) {
    await request(`/reservas/${id}/mensagens`, { method: "POST", body: { mensagem: message.body } });
    return this.getReservationById(id);
  },
  async changeReservationSchedule(id: string, date: string, start: string, end: string) {
    await reservaResource.update(id, { data: date, horarioInicio: start, horarioFim: end });
    return this.getReservationById(id);
  },
  async changeReservationStatus(id: string, status: Reservation["status"], _author: string, reason?: string) {
    await request(`/reservas/${id}/status`, { method: "PATCH", body: { status, motivo: reason } });
    return this.getReservationById(id);
  },
  async removeReservation(id: string): Promise<boolean> {
    await reservaResource.remove(id);
    return true;
  },

  async getCampuses(): Promise<Campus[]> {
    return campusService.list();
  },
  async createCampus(dto: Omit<Campus, "id">): Promise<Campus> {
    return campusService.create(dto as Partial<Campus>);
  },
  async updateCampus(id: string, dto: Partial<Campus>): Promise<Campus | undefined> {
    return campusService.update(id, dto);
  },
  async removeCampus(id: string): Promise<boolean> {
    await campusService.remove(id);
    return true;
  },

  async getBlocks(): Promise<Block[]> {
    return blockService.list();
  },
  async createBlock(dto: Omit<Block, "id">): Promise<Block> {
    return blockService.create(dto as Partial<Block>);
  },
  async updateBlock(id: string, dto: Partial<Block>): Promise<Block | undefined> {
    return blockService.update(id, dto);
  },
  async removeBlock(id: string): Promise<boolean> {
    await blockService.remove(id);
    return true;
  },
};
