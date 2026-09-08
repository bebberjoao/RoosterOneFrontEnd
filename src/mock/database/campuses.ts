// Table: campuses — migrated from rooster/rooms/mock-data.ts (CAMPUSES).
import { CAMPUSES as SRC } from "@/components/rooster/rooms/mock-data";
import type { Campus as SrcCampus } from "@/components/rooster/rooms/mock-data";

export type Campus = SrcCampus;

export const campuses: Campus[] = SRC;
export const campusById = (id: string) => campuses.find((c) => c.id === id);
