// Table: classes — array owned here (seed source of truth). FK: disciplineId, termId, teacherId, roomLabel.
// src/components/rooster/academy/mock-data.ts re-exports KLASSES from this file for compatibility.
import type { Klass as SrcKlass } from "@/components/rooster/academy/mock-data";
import { students } from "./students";

/** roomLabel keeps the original free-text location used across Academy screens (e.g. "Sala 402 · Bloco B"). */
export type SchoolClass = Omit<SrcKlass, "roomId"> & { roomId?: string; roomLabel: string };

const pickIds = (start: number, n: number) => students.slice(start, start + n).map((s) => s.id);

const KLASSES_SEED: SrcKlass[] = [
  { id: "k1", code: "ENG-SW-301-A", disciplineId: "d1", termId: "t-2026-1", shift: "Noturno", capacity: 40, teacherId: "p2", roomId: "Sala 402 · Bloco B", schedule: "Ter/Qui 19:00-22:30", studentIds: pickIds(0, 28), status: "em-andamento" },
  { id: "k2", code: "ENG-SW-215-A", disciplineId: "d2", termId: "t-2026-1", shift: "Matutino", capacity: 45, teacherId: "p3", roomId: "Laboratório 3 · Bloco C", schedule: "Seg/Qua 08:00-11:30", studentIds: pickIds(2, 30), status: "em-andamento" },
  { id: "k3", code: "ENG-SW-402-A", disciplineId: "d3", termId: "t-2026-1", shift: "Noturno", capacity: 35, teacherId: "p7", roomId: "Laboratório 5 · Bloco C", schedule: "Ter/Qui 19:00-22:30", studentIds: pickIds(1, 22), status: "em-andamento" },
  { id: "k4", code: "ADM-210-A", disciplineId: "d4", termId: "t-2026-1", shift: "Noturno", capacity: 50, teacherId: "p4", roomId: "Sala 210 · Bloco A", schedule: "Seg/Qua 19:00-22:30", studentIds: pickIds(0, 34), status: "aberta" },
  { id: "k5", code: "ADM-115-A", disciplineId: "d5", termId: "t-2026-1", shift: "Matutino", capacity: 40, teacherId: "p8", roomId: "Sala 105 · Bloco A", schedule: "Ter/Qui 08:00-11:30", studentIds: pickIds(5, 26), status: "em-andamento" },
  { id: "k6", code: "LET-101-A", disciplineId: "d6", termId: "t-2026-1", shift: "Vespertino", capacity: 35, teacherId: "p1", roomId: "Sala 302 · Bloco B", schedule: "Seg/Qua 14:00-17:30", studentIds: pickIds(3, 24), status: "em-andamento" },
  { id: "k7", code: "LET-207-A", disciplineId: "d7", termId: "t-2026-1", shift: "Vespertino", capacity: 30, teacherId: "p1", roomId: "Sala 305 · Bloco B", schedule: "Ter/Qui 14:00-17:30", studentIds: pickIds(8, 18), status: "em-andamento" },
  { id: "k8", code: "DIR-311-A", disciplineId: "d8", termId: "t-2026-1", shift: "Noturno", capacity: 60, teacherId: "p5", roomId: "Auditório · Bloco D", schedule: "Seg/Qua 19:00-22:30", studentIds: pickIds(0, 45), status: "em-andamento" },
  { id: "k9", code: "MED-VET-201-A", disciplineId: "d9", termId: "t-2026-1", shift: "Matutino", capacity: 30, teacherId: "p6", roomId: "Lab. Anatomia · Bloco E", schedule: "Ter/Qui 08:00-11:30", studentIds: pickIds(10, 20), status: "em-andamento" },
  { id: "k10", code: "POS-EDU-102-A", disciplineId: "d10", termId: "t-2026-1", shift: "Noturno", capacity: 25, teacherId: "p3", roomId: "Sala 501 · Bloco B", schedule: "Sex 19:00-22:30", studentIds: pickIds(12, 15), status: "aberta" },
];

export const classesSeed: SrcKlass[] = KLASSES_SEED;
export const classes: SchoolClass[] = KLASSES_SEED.map(({ roomId, ...rest }) => ({ ...rest, roomLabel: roomId }));
export const classById = (id: string) => classes.find((k) => k.id === id);
export const classesByDiscipline = (disciplineId: string) => classes.filter((k) => k.disciplineId === disciplineId);
export const classesByTeacher = (teacherId: string) => classes.filter((k) => k.teacherId === teacherId);
