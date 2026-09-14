// Table: academy_docs — array owned here (seed source of truth). FK: disciplineId.
// src/components/rooster/academy/mock-data.ts re-exports DOCS from this file for compatibility.
import type { AcademyDoc as SrcAcademyDoc } from "@/components/rooster/academy/mock-data";

export type AcademyDoc = SrcAcademyDoc;

const isoOf = (d: Date) => d.toISOString().slice(0, 10);
const shift = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return isoOf(d); };

export const academyDocs: AcademyDoc[] = [
  { id: "doc1", name: "Plano de ensino — Engenharia de Software II", kind: "Plano de ensino", disciplineId: "d1", updatedAt: shift(-10), size: "412 KB", author: "Rafael Monteiro" },
  { id: "doc2", name: "Ementa — Estrutura de Dados", kind: "Ementa", disciplineId: "d2", updatedAt: shift(-30), size: "228 KB", author: "Carla Nakamura" },
  { id: "doc3", name: "Regulamento acadêmico 2026", kind: "Regulamento", updatedAt: shift(-45), size: "1.2 MB", author: "Coordenação Acadêmica" },
  { id: "doc4", name: "Calendário oficial 2026", kind: "Institucional", updatedAt: shift(-60), size: "180 KB", author: "Secretaria" },
  { id: "doc5", name: "Plano de ensino — IA", kind: "Plano de ensino", disciplineId: "d3", updatedAt: shift(-5), size: "356 KB", author: "Sofia Rangel" },
  { id: "doc6", name: "Ementa — Direito Constitucional", kind: "Ementa", disciplineId: "d8", updatedAt: shift(-22), size: "290 KB", author: "Beatriz Almeida" },
];

export const academyDocsByDiscipline = (disciplineId: string) => academyDocs.filter((d) => d.disciplineId === disciplineId);
