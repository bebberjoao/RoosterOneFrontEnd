// Table: rooms — migrated from rooster/rooms/mock-data.ts (SPACES). FK: campusId, blockId.
import { SPACES as SRC } from "@/components/rooster/rooms/mock-data";
import type { Space } from "@/components/rooster/rooms/mock-data";

export type Room = Space;

export const rooms: Room[] = SRC;
export const roomById = (id: string) => rooms.find((r) => r.id === id);
export const roomsByBlock = (blockId: string) => rooms.filter((r) => r.blockId === blockId);
export const roomsByCampus = (campusId: string) => rooms.filter((r) => r.campusId === campusId);
