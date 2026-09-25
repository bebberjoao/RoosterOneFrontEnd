// Tipo compartilhado do recurso "reserva" — dados reais vêm de `roomService` (backend).
// `roomId` é um alias de `spaceId` mantido pelas telas reais (o backend devolve `spaceId`).
import type { Reservation as SrcReservation } from "@/components/rooster/rooms/mock-data";

export type Reservation = SrcReservation & { roomId: string };
