// Mock service for Rooster Rooms (campuses, blocks, rooms, reservations).
import { db } from "@/mock/database";
import type { Room } from "@/mock/database/rooms";
import type { Reservation } from "@/mock/database/reservations";
import type { ReservationEvent } from "@/components/rooster/rooms/mock-data";
import type { Campus } from "@/mock/database/campuses";
import type { Block } from "@/mock/database/blocks";
import { delay, nextId, applyFilters, type Filters } from "./utils";

let rooms = [...db.rooms];
let reservations = [...db.reservations];
let campuses = [...db.campuses];
let blocks = [...db.blocks];

export const roomService = {
  async getAll(filters?: Filters<Room>): Promise<Room[]> {
    return delay(applyFilters(rooms, filters));
  },
  async getById(id: string): Promise<Room | undefined> {
    return delay(rooms.find((r) => r.id === id));
  },
  async create(dto: Omit<Room, "id">): Promise<Room> {
    const created: Room = { ...dto, id: nextId("room") };
    rooms = [...rooms, created];
    return delay(created);
  },
  async update(id: string, dto: Partial<Room>): Promise<Room | undefined> {
    rooms = rooms.map((r) => (r.id === id ? { ...r, ...dto } : r));
    return delay(rooms.find((r) => r.id === id));
  },
  async remove(id: string): Promise<boolean> {
    const before = rooms.length;
    rooms = rooms.filter((r) => r.id !== id);
    return delay(rooms.length < before);
  },
  async search(query: string): Promise<Room[]> {
    const q = query.toLowerCase();
    return delay(rooms.filter((r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q)));
  },

  // Domain-specific helpers
  /** Returns the campus > block > room hierarchy, as consumed by Rooms screens. */
  async getStructureTree() {
    const tree = campuses.map((campus) => ({
      ...campus,
      blocks: blocks
        .filter((b) => b.campusId === campus.id)
        .map((block) => ({ ...block, rooms: rooms.filter((r) => r.blockId === block.id) })),
    }));
    return delay(tree);
  },
  async getReservations(filters?: Filters<Reservation>): Promise<Reservation[]> {
    return delay(applyFilters(reservations, filters));
  },
  async createReservation(dto: Omit<Reservation, "id">): Promise<Reservation> {
    const created: Reservation = { ...dto, id: nextId("res") };
    reservations = [...reservations, created];
    return delay(created);
  },
  async updateReservation(id: string, dto: Partial<Reservation>): Promise<Reservation | undefined> {
    reservations = reservations.map((r) => (r.id === id ? { ...r, ...dto } : r));
    return delay(reservations.find((r) => r.id === id));
  },
  async getReservationById(id: string): Promise<Reservation | undefined> {
    return delay(reservations.find((r) => r.id === id));
  },
  async addReservationMessage(id: string, message: Pick<Extract<ReservationEvent, { kind: "message" }>, "author" | "role" | "body">) {
    const event: ReservationEvent = { ...message, id: nextId("reservation-message"), kind: "message", at: new Date().toISOString() };
    reservations = reservations.map((r) => r.id === id ? { ...r, events: [...r.events, event] } : r);
    return delay(reservations.find((r) => r.id === id));
  },
  async changeReservationSchedule(id: string, date: string, start: string, end: string, author: string, reason?: string) {
    const current = reservations.find((r) => r.id === id);
    if (!current) return delay(undefined);
    const event: ReservationEvent = {
      id: nextId("reservation-schedule"), kind: "schedule", author, at: new Date().toISOString(),
      from: `${current.date} · ${current.start}–${current.end}`, to: `${date} · ${start}–${end}`, reason,
    };
    reservations = reservations.map((r) => r.id === id ? { ...r, date, start, end, events: [...r.events, event] } : r);
    return delay(reservations.find((r) => r.id === id));
  },
  async changeReservationStatus(id: string, status: Reservation["status"], author: string, reason?: string) {
    const current = reservations.find((r) => r.id === id);
    if (!current) return delay(undefined);
    const event: ReservationEvent = {
      id: nextId("reservation-status"), kind: "status", author, at: new Date().toISOString(),
      from: current.status, to: status, reason,
    };
    reservations = reservations.map((r) => r.id === id ? {
      ...r, status, cancellationReason: status === "cancelada" ? reason : r.cancellationReason,
      decidedBy: author, events: [...r.events, event],
    } : r);
    return delay(reservations.find((r) => r.id === id));
  },
  async removeReservation(id: string): Promise<boolean> {
    const before = reservations.length;
    reservations = reservations.filter((r) => r.id !== id);
    return delay(reservations.length < before);
  },

  async getCampuses(): Promise<Campus[]> {
    return delay(campuses);
  },
  async createCampus(dto: Omit<Campus, "id">): Promise<Campus> {
    const created: Campus = { ...dto, id: nextId("cp") };
    campuses = [...campuses, created];
    return delay(created);
  },
  async updateCampus(id: string, dto: Partial<Campus>): Promise<Campus | undefined> {
    campuses = campuses.map((c) => (c.id === id ? { ...c, ...dto } : c));
    return delay(campuses.find((c) => c.id === id));
  },
  async removeCampus(id: string): Promise<boolean> {
    const before = campuses.length;
    campuses = campuses.filter((c) => c.id !== id);
    return delay(campuses.length < before);
  },

  async getBlocks(): Promise<Block[]> {
    return delay(blocks);
  },
  async createBlock(dto: Omit<Block, "id">): Promise<Block> {
    const created: Block = { ...dto, id: nextId("bl") };
    blocks = [...blocks, created];
    return delay(created);
  },
  async updateBlock(id: string, dto: Partial<Block>): Promise<Block | undefined> {
    blocks = blocks.map((b) => (b.id === id ? { ...b, ...dto } : b));
    return delay(blocks.find((b) => b.id === id));
  },
  async removeBlock(id: string): Promise<boolean> {
    const before = blocks.length;
    blocks = blocks.filter((b) => b.id !== id);
    return delay(blocks.length < before);
  },
};
