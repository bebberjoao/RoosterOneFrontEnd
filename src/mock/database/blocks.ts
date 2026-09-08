// Table: blocks — migrated from rooster/rooms/mock-data.ts (BLOCKS). FK: campusId -> campuses.id
import { BLOCKS as SRC } from "@/components/rooster/rooms/mock-data";
import type { Block as SrcBlock } from "@/components/rooster/rooms/mock-data";

export type Block = SrcBlock;

export const blocks: Block[] = SRC;
export const blockById = (id: string) => blocks.find((b) => b.id === id);
export const blocksByCampus = (campusId: string) => blocks.filter((b) => b.campusId === campusId);
