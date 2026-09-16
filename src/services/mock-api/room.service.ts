// Rooster Rooms — ligado ao backend real via client HTTP compartilhado.
//
// Limitação conhecida: o backend (Rooster Rooms) não tem endpoints para a
// conversa/histórico da reserva (mensagens, troca de horário e motivo de
// cancelamento são só o `status`/`data`/`horario` do registro — não existe
// tabela de eventos). Essas informações continuam vivendo só nesta aba do
// navegador (não persistem em outra sessão nem sobrevivem a um F5) até que
// o backend ganhe esse recurso; o que muda de verdade no servidor a cada
// ação (status, data/horário) usa a API real.
import { db } from "@/mock/database";
import type { Room } from "@/mock/database/rooms";
import type { Reservation } from "@/mock/database/reservations";
import type { ReservationEvent, SpaceType, SpaceStatus, Resource, ReservationStatus } from "@/components/rooster/rooms/mock-data";
import type { Campus } from "@/mock/database/campuses";
import type { Block } from "@/mock/database/blocks";
import { mapResource } from "@/services/hub/mapped-resource";
import { createResource as createRawResource } from "@/services/hub/index";
import { request } from "@/services/hub/client";
import { session } from "@/services/hub/session";
import { nextId, applyFilters, type Filters } from "./utils";

type CampusBack = {
  id: string; nome: string; codigo: string; endereco?: string | null; cidade?: string | null;
  estado?: string | null; cep?: string | null; responsavel?: string | null; ativo: boolean;
  observacoes?: string | null; cor?: string | null;
};
const campusService = mapResource<Campus, CampusBack>(
  "/campus", "cp",
  db.campuses.map((c) => ({ id: c.id, nome: c.name, codigo: c.code, endereco: c.address, cidade: c.city, estado: c.state, cep: c.zip, responsavel: c.manager, ativo: c.active, observacoes: c.notes, cor: c.color })),
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
  "/blocos", "bl",
  db.blocks.map((b) => ({ id: b.id, nome: b.name, codigo: b.code, campusId: b.campusId, andares: b.floors, responsavel: b.manager, ativo: b.active })),
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
  galeria: string[]; status: string; horarioAbertura?: string | null; diasFuncionamento: string[]; duracaoMinutos?: number | null;
};
// resources/slots não existem no backend (Ambiente não tem essas colunas) — ficam só de exibição local.
const roomExtras = new Map<string, { resources: Resource[]; slots?: string[] }>(db.rooms.map((r) => [r.id, { resources: r.resources, slots: r.slots }]));

const roomResource = mapResource<Room, AmbienteBack>(
  "/ambientes", "room",
  db.rooms.map((r) => ({ id: r.id, nome: r.name, codigo: r.code, campusId: r.campusId, blocoId: r.blockId, andar: r.floor, numero: r.number, tipo: r.type, capacidade: r.capacity, area: r.area, descricao: r.description, capa: r.cover, galeria: r.gallery, status: r.status, horarioAbertura: r.openingHours, diasFuncionamento: r.weekdays, duracaoMinutos: r.slotMinutes })),
  (b) => {
    const extra = roomExtras.get(b.id);
    return {
      id: b.id, name: b.nome, code: b.codigo, campusId: b.campusId, blockId: b.blocoId, floor: b.andar,
      number: b.numero ?? "", type: b.tipo as SpaceType, capacity: b.capacidade, area: b.area ?? 0,
      description: b.descricao ?? "", cover: b.capa ?? "", gallery: b.galeria ?? [], resources: extra?.resources ?? [],
      status: b.status as SpaceStatus, openingHours: b.horarioAbertura ?? "", weekdays: b.diasFuncionamento ?? [],
      slots: extra?.slots, slotMinutes: b.duracaoMinutos ?? undefined,
    };
  },
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
    ...(f.status !== undefined && { status: f.status }),
    ...(f.openingHours !== undefined && { horarioAbertura: f.openingHours }),
    ...(f.weekdays !== undefined && { diasFuncionamento: f.weekdays }),
    ...(f.slotMinutes !== undefined && { duracaoMinutos: f.slotMinutes }),
  }),
);
async function createRoom(dto: Omit<Room, "id">): Promise<Room> {
  const created = await roomResource.create(dto as Partial<Room>);
  roomExtras.set(created.id, { resources: dto.resources ?? [], slots: dto.slots });
  return { ...created, resources: dto.resources ?? [], slots: dto.slots };
}
async function updateRoom(id: string, dto: Partial<Room>): Promise<Room | undefined> {
  if (dto.resources !== undefined || dto.slots !== undefined) {
    const prev = roomExtras.get(id) ?? { resources: [] as Resource[] };
    roomExtras.set(id, { resources: dto.resources ?? prev.resources, slots: dto.slots ?? prev.slots });
  }
  return roomResource.update(id, dto);
}

type ReservaBack = {
  id: string; codigo: string; ambienteId: string; responsavelId?: string | null; responsavel: string;
  setorId?: string | null; setor?: string | null; evento: string; finalidade?: string | null; data: string;
  horarioInicio: string; horarioFim: string; participantes: number; status: string; recorrencia: string;
  observacoes?: string | null; decididoPor?: string | null; decididoEm?: string | null;
};
/** Conversa/histórico local — o backend não tem tabela para isso (ver comentário no topo do arquivo). */
const reservationExtras = new Map<string, { events: ReservationEvent[]; cancellationReason?: string; decidedBy?: string }>(
  db.reservations.map((r) => [r.id, { events: r.events, cancellationReason: r.cancellationReason, decidedBy: r.decidedBy }]),
);

function reservaToFront(b: ReservaBack): Reservation {
  const extra = reservationExtras.get(b.id) ?? { events: [] };
  return {
    id: b.id, code: b.codigo, spaceId: b.ambienteId, roomId: b.ambienteId, responsible: b.responsavel,
    sector: b.setor ?? "", event: b.evento, purpose: b.finalidade ?? "", date: b.data, start: b.horarioInicio,
    end: b.horarioFim, participants: b.participantes, status: b.status as ReservationStatus,
    recurrence: b.recorrencia as Reservation["recurrence"], notes: b.observacoes ?? undefined,
    events: extra.events, cancellationReason: extra.cancellationReason, decidedBy: extra.decidedBy,
  };
}

const reservaResource = createRawResource<ReservaBack>(
  "/reservas", "res",
  db.reservations.map((r) => ({
    id: r.id, codigo: r.code, ambienteId: r.roomId, responsavelId: undefined, responsavel: r.responsible,
    setor: r.sector, evento: r.event, finalidade: r.purpose, data: r.date, horarioInicio: r.start,
    horarioFim: r.end, participantes: r.participants, status: r.status, recorrencia: r.recurrence ?? "unica",
    observacoes: r.notes, decididoPor: r.decidedBy, decididoEm: undefined,
  })),
);

export const roomService = {
  async getAll(filters?: Filters<Room>): Promise<Room[]> {
    return applyFilters(await roomResource.list(), filters);
  },
  async getById(id: string): Promise<Room | undefined> {
    return roomResource.get(id).catch(() => undefined);
  },
  create: createRoom,
  update: updateRoom,
  async remove(id: string): Promise<boolean> {
    await roomResource.remove(id);
    roomExtras.delete(id);
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
    reservationExtras.set(created.id, { events: dto.events ?? [], cancellationReason: dto.cancellationReason, decidedBy: dto.decidedBy });
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
    return reservaResource.get(id).then(reservaToFront).catch(() => undefined);
  },
  async addReservationMessage(id: string, message: Pick<Extract<ReservationEvent, { kind: "message" }>, "author" | "role" | "body">) {
    const event: ReservationEvent = { ...message, id: nextId("reservation-message"), kind: "message", at: new Date().toISOString() };
    const extra = reservationExtras.get(id) ?? { events: [] };
    reservationExtras.set(id, { ...extra, events: [...extra.events, event] });
    return this.getReservationById(id);
  },
  async changeReservationSchedule(id: string, date: string, start: string, end: string, author: string, reason?: string) {
    const current = await this.getReservationById(id);
    if (!current) return undefined;
    await reservaResource.update(id, { data: date, horarioInicio: start, horarioFim: end });
    const event: ReservationEvent = {
      id: nextId("reservation-schedule"), kind: "schedule", author, at: new Date().toISOString(),
      from: `${current.date} · ${current.start}–${current.end}`, to: `${date} · ${start}–${end}`, reason,
    };
    const extra = reservationExtras.get(id) ?? { events: [] };
    reservationExtras.set(id, { ...extra, events: [...extra.events, event] });
    return this.getReservationById(id);
  },
  async changeReservationStatus(id: string, status: Reservation["status"], author: string, reason?: string) {
    const current = await this.getReservationById(id);
    if (!current) return undefined;
    await request(`/reservas/${id}/status`, { method: "PATCH", body: { status } });
    const event: ReservationEvent = {
      id: nextId("reservation-status"), kind: "status", author, at: new Date().toISOString(),
      from: current.status, to: status, reason,
    };
    const extra = reservationExtras.get(id) ?? { events: [] };
    reservationExtras.set(id, {
      events: [...extra.events, event],
      cancellationReason: status === "cancelada" ? reason : extra.cancellationReason,
      decidedBy: author,
    });
    return this.getReservationById(id);
  },
  async removeReservation(id: string): Promise<boolean> {
    await reservaResource.remove(id);
    reservationExtras.delete(id);
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
