import { httpClient } from "@/services/http";
import type { Room } from "@/mock/database/rooms";
import type { Reservation } from "@/mock/database/reservations";
import type { Campus } from "@/mock/database/campuses";
import type { Block } from "@/mock/database/blocks";
import type { Filters } from "./utils";

export const roomService = {
  getAll: async (filters?: Filters<Room>) => (await httpClient.get<ApiRoom[]>("/ambientes", filters as Record<string, unknown> | undefined)).map(toRoom),
  getById: async (id: string) => {
    try { return toRoom(await httpClient.get<ApiRoom>(`/ambientes/${id}`)); } catch { return undefined; }
  },
  create: (dto: Omit<Room, "id">) => httpClient.post<ApiRoom>("/ambientes", toApiRoom(dto)).then(toRoom),
  update: async (id: string, dto: Partial<Room>) => {
    try { return toRoom(await httpClient.patch<ApiRoom>(`/ambientes/${id}`, toApiRoom(dto))); } catch { return undefined; }
  },
  remove: async (id: string) => {
    try { await httpClient.delete<void>(`/ambientes/${id}`); return true; } catch { return false; }
  },
  search: (search: string) => httpClient.get<ApiRoom[]>("/ambientes", { search }).then((rows) => rows.map(toRoom)),
  getStructureTree: () => httpClient.get<Array<ApiCampus & { blocks: Array<ApiBlock & { rooms: ApiRoom[] }> }>>("/ambientes/estrutura").then((rows) => rows.map(toCampusTree)),
  getReservations: async (filters?: Filters<Reservation>) => (await httpClient.get<ApiReservation[]>("/reservas", filters as Record<string, unknown> | undefined)).map(toReservation),
  createReservation: (dto: Omit<Reservation, "id">) => httpClient.post<ApiReservation>("/reservas", toApiReservation(dto)).then(toReservation),
  updateReservation: async (id: string, dto: Partial<Reservation>) => {
    try { return toReservation(await httpClient.patch<ApiReservation>(`/reservas/${id}`, toApiReservation(dto))); } catch { return undefined; }
  },
  removeReservation: async (id: string) => {
    try { await httpClient.delete<void>(`/reservas/${id}`); return true; } catch { return false; }
  },
  updateReservationStatus: (id: string, status: Reservation["status"]) =>
    httpClient.patch<ApiReservation>(`/reservas/${id}/status`, { status }).then(toReservation),
  getCampuses: () => httpClient.get<ApiCampus[]>("/campus").then((rows) => rows.map(toCampus)),
  createCampus: (dto: Omit<Campus, "id">) => httpClient.post<ApiCampus>("/campus", toApiCampus(dto)).then(toCampus),
  updateCampus: async (id: string, dto: Partial<Campus>) => {
    try { return toCampus(await httpClient.patch<ApiCampus>(`/campus/${id}`, toApiCampus(dto))); } catch { return undefined; }
  },
  removeCampus: async (id: string) => {
    try { await httpClient.delete<void>(`/campus/${id}`); return true; } catch { return false; }
  },
  getBlocks: () => httpClient.get<ApiBlock[]>("/blocos").then((rows) => rows.map(toBlock)),
  createBlock: (dto: Omit<Block, "id">) => httpClient.post<ApiBlock>("/blocos", toApiBlock(dto)).then(toBlock),
  updateBlock: async (id: string, dto: Partial<Block>) => {
    try { return toBlock(await httpClient.patch<ApiBlock>(`/blocos/${id}`, toApiBlock(dto))); } catch { return undefined; }
  },
  removeBlock: async (id: string) => {
    try { await httpClient.delete<void>(`/blocos/${id}`); return true; } catch { return false; }
  },
};

type ApiCampus = { id: string; nome: string; codigo: string; endereco?: string | null; cidade?: string | null; estado?: string | null; cep?: string | null; responsavel?: string | null; ativo?: boolean; observacoes?: string | null; cor?: string | null; blocos?: ApiBlock[] };
type ApiBlock = { id: string; campusId: string; nome: string; codigo: string; andares: number; responsavel?: string | null; ativo?: boolean; ambientes?: ApiRoom[] };
type ApiRoom = { id: string; campusId: string; blocoId: string; nome: string; codigo: string; andar: number; numero?: string | null; tipo: Room["type"]; capacidade: number; area?: number | string | null; descricao?: string | null; capa?: string | null; galeria?: string[]; status: Room["status"]; horarioAbertura?: string | null; diasFuncionamento?: string[]; duracaoMinutos?: number | null };
type ApiReservation = { id: string; codigo: string; ambienteId: string; responsavel: string; setor?: string | null; evento: string; finalidade?: string | null; data: string; horarioInicio: string; horarioFim: string; participantes: number; status: Reservation["status"]; recorrencia?: Reservation["recurrence"]; observacoes?: string | null };

const toRoom = (value: ApiRoom): Room => ({ id: value.id, name: value.nome, code: value.codigo, campusId: value.campusId, blockId: value.blocoId, floor: value.andar, number: value.numero ?? "", type: value.tipo, capacity: value.capacidade, area: Number(value.area ?? 0), description: value.descricao ?? "", cover: value.capa ?? "", gallery: value.galeria ?? [], resources: [], status: value.status, openingHours: value.horarioAbertura ?? "", weekdays: value.diasFuncionamento ?? [], slotMinutes: value.duracaoMinutos ?? undefined });
const toCampus = (value: ApiCampus): Campus => ({ id: value.id, name: value.nome, code: value.codigo, address: value.endereco ?? "", city: value.cidade ?? "", state: value.estado ?? "", zip: value.cep ?? "", manager: value.responsavel ?? "", active: value.ativo !== false, notes: value.observacoes ?? undefined, color: value.cor ?? "" });
const toBlock = (value: ApiBlock): Block => ({ id: value.id, campusId: value.campusId, name: value.nome, code: value.codigo, floors: value.andares, manager: value.responsavel ?? "", active: value.ativo !== false });
const toReservation = (value: ApiReservation): Reservation => ({ id: value.id, code: value.codigo, spaceId: value.ambienteId, roomId: value.ambienteId, responsible: value.responsavel, sector: value.setor ?? "", event: value.evento, purpose: value.finalidade ?? "", date: value.data.slice(0, 10), start: value.horarioInicio, end: value.horarioFim, participants: value.participantes, status: value.status, recurrence: value.recorrencia, notes: value.observacoes ?? undefined });
const toCampusTree = (value: ApiCampus & { blocks: Array<ApiBlock & { rooms: ApiRoom[] }> }) => ({ ...toCampus(value), blocks: value.blocks.map((block) => ({ ...toBlock(block), rooms: block.rooms.map(toRoom) })) });
const toApiCampus = (value: Partial<Campus>) => ({ nome: value.name, codigo: value.code, endereco: value.address, cidade: value.city, estado: value.state, cep: value.zip, responsavel: value.manager, ativo: value.active, observacoes: value.notes, cor: value.color });
const toApiBlock = (value: Partial<Block>) => ({ campusId: value.campusId, nome: value.name, codigo: value.code, andares: value.floors, responsavel: value.manager, ativo: value.active });
const toApiRoom = (value: Partial<Room>) => ({ campusId: value.campusId, blocoId: value.blockId, nome: value.name, codigo: value.code, andar: value.floor, numero: value.number, tipo: value.type, capacidade: value.capacity, area: value.area, descricao: value.description, capa: value.cover, galerias: value.gallery, status: value.status, horarioAbertura: value.openingHours, diasSemana: value.weekdays, duracaoMinutos: value.slotMinutes });
const toApiReservation = (value: Partial<Reservation>) => ({ codigo: value.code, ambienteId: value.spaceId, responsavel: value.responsible, setor: value.sector, evento: value.event, finalidade: value.purpose, data: value.date, horarioInicio: value.start, horarioFim: value.end, participantes: value.participants, status: value.status, recorrencia: value.recurrence, observacoes: value.notes });
