// Table: reservations — migrated from rooster/rooms/mock-data.ts (RESERVATIONS). FK: roomId (spaceId) -> rooms.id
import { RESERVATIONS as SRC } from "@/components/rooster/rooms/mock-data";
import type { Reservation as SrcReservation } from "@/components/rooster/rooms/mock-data";

export type Reservation = SrcReservation & { roomId: string };

export const reservations: Reservation[] = SRC.map((r) => ({ ...r, roomId: r.spaceId }));
export const reservationById = (id: string) => reservations.find((r) => r.id === id);
export const reservationsByRoom = (roomId: string) => reservations.filter((r) => r.roomId === roomId);
