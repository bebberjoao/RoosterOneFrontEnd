// Table: disciplines — arrays owned here (seed source of truth). FK: courseId, termId, teacherId.
// src/components/rooster/academy/mock-data.ts re-exports TERMS/COURSES/DISCIPLINES from this
// file for backwards compatibility; types stay defined there.
import type { Discipline as SrcDiscipline, Course, Term } from "@/components/rooster/academy/mock-data";

export type Discipline = SrcDiscipline;
export type { Course, Term };

export const terms: Term[] = [
  { id: "t-2024-2", name: "2024.2", startDate: "2024-08-05", endDate: "2024-12-14", active: false },
  { id: "t-2025-1", name: "2025.1", startDate: "2025-02-10", endDate: "2025-06-28", active: false },
  { id: "t-2025-2", name: "2025.2", startDate: "2025-08-04", endDate: "2025-12-13", active: false },
  { id: "t-2026-1", name: "2026.1", startDate: "2026-02-09", endDate: "2026-06-27", active: true },
];

export const courses: Course[] = [
  { id: "c-eng", name: "Engenharia de Software", code: "ENG-SW", degree: "Graduação" },
  { id: "c-adm", name: "Administração", code: "ADM", degree: "Graduação" },
  { id: "c-let", name: "Letras", code: "LET", degree: "Graduação" },
  { id: "c-dir", name: "Direito", code: "DIR", degree: "Graduação" },
  { id: "c-med", name: "Medicina Veterinária", code: "MED-VET", degree: "Graduação" },
  { id: "c-pos-edu", name: "Educação e Tecnologias", code: "POS-EDU", degree: "Pós-graduação" },
];

export const disciplines: Discipline[] = [
  { id: "d1", code: "ENG-SW-301", name: "Engenharia de Software II", description: "Arquitetura de sistemas, padrões de projeto, DevOps e qualidade.", courseId: "c-eng", termId: "t-2026-1", teacherId: "p2", workload: 80, status: "ativa", accent: "oklch(0.55 0.19 265)" },
  { id: "d2", code: "ENG-SW-215", name: "Estrutura de Dados", description: "Listas, árvores, grafos, complexidade e análise de algoritmos.", courseId: "c-eng", termId: "t-2026-1", teacherId: "p3", workload: 80, status: "ativa", accent: "oklch(0.68 0.14 195)" },
  { id: "d3", code: "ENG-SW-402", name: "Inteligência Artificial", description: "Fundamentos de IA, aprendizado de máquina e aplicações.", courseId: "c-eng", termId: "t-2026-1", teacherId: "p7", workload: 60, status: "ativa", accent: "oklch(0.68 0.18 40)" },
  { id: "d4", code: "ADM-210", name: "Gestão Estratégica", description: "Planejamento estratégico, análise SWOT e execução.", courseId: "c-adm", termId: "t-2026-1", teacherId: "p4", workload: 60, status: "ativa", accent: "oklch(0.62 0.18 155)" },
  { id: "d5", code: "ADM-115", name: "Comportamento Organizacional", description: "Cultura, liderança e dinâmicas de equipe.", courseId: "c-adm", termId: "t-2026-1", teacherId: "p8", workload: 60, status: "ativa", accent: "oklch(0.55 0.1 260)" },
  { id: "d6", code: "LET-101", name: "Literatura Brasileira", description: "Panorama da literatura brasileira do romantismo ao modernismo.", courseId: "c-let", termId: "t-2026-1", teacherId: "p1", workload: 80, status: "ativa", accent: "oklch(0.6 0.2 305)" },
  { id: "d7", code: "LET-207", name: "Linguística Aplicada", description: "Estudos linguísticos aplicados ao ensino de línguas.", courseId: "c-let", termId: "t-2026-1", teacherId: "p1", workload: 60, status: "ativa", accent: "oklch(0.6 0.2 305)" },
  { id: "d8", code: "DIR-311", name: "Direito Constitucional", description: "Princípios fundamentais, direitos e garantias.", courseId: "c-dir", termId: "t-2026-1", teacherId: "p5", workload: 80, status: "ativa", accent: "oklch(0.65 0.18 25)" },
  { id: "d9", code: "MED-VET-201", name: "Anatomia Animal", description: "Estudo comparativo da anatomia de animais domésticos.", courseId: "c-med", termId: "t-2026-1", teacherId: "p6", workload: 80, status: "ativa", accent: "oklch(0.7 0.16 90)" },
  { id: "d10", code: "POS-EDU-102", name: "Educação Digital", description: "Metodologias ativas mediadas por tecnologia.", courseId: "c-pos-edu", termId: "t-2026-1", teacherId: "p3", workload: 40, status: "ativa", accent: "oklch(0.68 0.14 195)" },
  { id: "d11", code: "ENG-SW-110", name: "Lógica de Programação", description: "Algoritmos, estruturas de controle e primeiros passos.", courseId: "c-eng", termId: "t-2025-2", teacherId: "p2", workload: 80, status: "arquivada", accent: "oklch(0.55 0.19 265)" },
  { id: "d12", code: "ADM-090", name: "Introdução à Administração", description: "Fundamentos da administração moderna.", courseId: "c-adm", termId: "t-2025-2", teacherId: "p4", workload: 60, status: "inativa", accent: "oklch(0.62 0.18 155)" },
];

export const disciplineById = (id: string) => disciplines.find((d) => d.id === id);
export const courseById = (id: string) => courses.find((c) => c.id === id);
export const termById = (id: string) => terms.find((t) => t.id === id);
export const disciplinesByCourse = (courseId: string) => disciplines.filter((d) => d.courseId === courseId);
