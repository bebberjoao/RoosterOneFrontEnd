// Table: teachers — array owned here (seed source of truth). FK: userId (derived 1:1 with teacher id).
// src/components/rooster/academy/mock-data.ts re-exports TEACHERS from this file for compatibility.
import type { Teacher as SrcTeacher } from "@/components/rooster/academy/mock-data";

export type Teacher = SrcTeacher & { userId: string };

const TEACHERS_SEED: SrcTeacher[] = [
  { id: "p1", name: "Helena Duarte", initials: "HD", email: "helena.duarte@modelo.edu", title: "Profa. Dra.", department: "Letras", weeklyHours: 20, status: "ativo", tone: "oklch(0.6 0.2 305)" },
  { id: "p2", name: "Rafael Monteiro", initials: "RM", email: "rafael.monteiro@modelo.edu", title: "Prof. Me.", department: "Computação", weeklyHours: 24, status: "ativo", tone: "oklch(0.55 0.19 265)" },
  { id: "p3", name: "Carla Nakamura", initials: "CN", email: "carla.nakamura@modelo.edu", title: "Profa. Dra.", department: "Computação", weeklyHours: 18, status: "ativo", tone: "oklch(0.68 0.14 195)" },
  { id: "p4", name: "Diego Fontes", initials: "DF", email: "diego.fontes@modelo.edu", title: "Prof. Me.", department: "Administração", weeklyHours: 16, status: "ativo", tone: "oklch(0.62 0.18 155)" },
  { id: "p5", name: "Beatriz Almeida", initials: "BA", email: "beatriz.almeida@modelo.edu", title: "Profa. Dra.", department: "Direito", weeklyHours: 22, status: "afastado", tone: "oklch(0.65 0.18 25)" },
  { id: "p6", name: "Nelson Vidal", initials: "NV", email: "nelson.vidal@modelo.edu", title: "Prof. Dr.", department: "Veterinária", weeklyHours: 20, status: "ativo", tone: "oklch(0.7 0.16 90)" },
  { id: "p7", name: "Sofia Rangel", initials: "SR", email: "sofia.rangel@modelo.edu", title: "Profa. Me.", department: "Computação", weeklyHours: 14, status: "ativo", tone: "oklch(0.68 0.18 40)" },
  { id: "p8", name: "Marco Teixeira", initials: "MT", email: "marco.teixeira@modelo.edu", title: "Prof. Dr.", department: "Administração", weeklyHours: 20, status: "ativo", tone: "oklch(0.55 0.1 260)" },
];

export const teachers: Teacher[] = TEACHERS_SEED.map((t) => ({ ...t, userId: `user-${t.id}` }));
export const teacherById = (id: string) => teachers.find((t) => t.id === id);
