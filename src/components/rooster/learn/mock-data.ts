export type ActivityStatus = "rascunho" | "agendada" | "publicada" | "encerrada" | "arquivada";
export type ActivityType = "prova" | "lista" | "trabalho" | "questionario" | "material";
export type QuestionType =
  | "dissertativa"
  | "multipla-uma"
  | "multipla-varias"
  | "vf"
  | "curta"
  | "longa"
  | "upload"
  | "imagem"
  | "pdf";

export type Discipline = { id: string; name: string; color: string };
export type Klass = { id: string; name: string; disciplineId: string; students: number };
export type Teacher = { id: string; name: string; initials: string };
export type Student = { id: string; name: string; initials: string; klassId: string };

export const DISCIPLINES: Discipline[] = [
  { id: "d-mat", name: "Cálculo I", color: "oklch(0.55 0.19 265)" },
  { id: "d-alg", name: "Álgebra Linear", color: "oklch(0.6 0.18 260)" },
  { id: "d-fis", name: "Física I", color: "oklch(0.65 0.18 25)" },
  { id: "d-let", name: "Literatura Brasileira", color: "oklch(0.6 0.2 305)" },
  { id: "d-eng", name: "Inglês Instrumental", color: "oklch(0.68 0.14 195)" },
  { id: "d-com", name: "Introdução à Programação", color: "oklch(0.62 0.18 155)" },
  { id: "d-dir", name: "Direito Constitucional", color: "oklch(0.72 0.14 90)" },
];

export const TEACHERS: Teacher[] = [
  { id: "t-1", name: "Helena Duarte", initials: "HD" },
  { id: "t-2", name: "Diego Martins", initials: "DM" },
  { id: "t-3", name: "Camila Souza", initials: "CS" },
  { id: "t-4", name: "Marina Ribeiro", initials: "MR" },
  { id: "t-5", name: "Roberto Antunes", initials: "RA" },
];

export const KLASSES: Klass[] = [
  { id: "k-eng3a", name: "Engenharia · 3A", disciplineId: "d-mat", students: 38 },
  { id: "k-eng3b", name: "Engenharia · 3B", disciplineId: "d-mat", students: 34 },
  { id: "k-let2a", name: "Letras · 2A", disciplineId: "d-let", students: 27 },
  { id: "k-com1a", name: "Computação · 1A", disciplineId: "d-com", students: 42 },
  { id: "k-com1b", name: "Computação · 1B", disciplineId: "d-com", students: 41 },
  { id: "k-dir4a", name: "Direito · 4A", disciplineId: "d-dir", students: 55 },
];

const NAMES = [
  "Ana Prado", "Igor Ramos", "Elisa Ferreira", "Lucas Pereira", "Sofia Nunes",
  "Rafael Costa", "Beatriz Lopes", "Thiago Melo", "Larissa Rocha", "Pedro Henrique",
  "Marina Cardoso", "Guilherme Reis", "Juliana Vieira", "Felipe Andrade", "Camila Torres",
];

export const STUDENTS: Student[] = KLASSES.flatMap((k) =>
  NAMES.slice(0, 8).map((n, i) => ({
    id: `${k.id}-s${i}`,
    name: n,
    initials: n.split(" ").map((x) => x[0]).slice(0, 2).join(""),
    klassId: k.id,
  })),
);

export type Question = {
  id: string;
  type: QuestionType;
  statement: string;
  points: number;
  hint?: string;
  explanation?: string;
  options?: { id: string; label: string; correct: boolean }[];
  shuffle?: boolean;
  charLimit?: number;
  category: string;
  discipline: string;
  difficulty: "facil" | "media" | "dificil";
};

export const QUESTIONS: Question[] = [
  {
    id: "q-1", type: "multipla-uma", statement: "Qual é o valor de lim (x→0) sin(x)/x?", points: 1,
    options: [
      { id: "a", label: "0", correct: false },
      { id: "b", label: "1", correct: true },
      { id: "c", label: "∞", correct: false },
      { id: "d", label: "Não existe", correct: false },
    ], shuffle: true, category: "Limites", discipline: "d-mat", difficulty: "facil",
    explanation: "Limite fundamental trigonométrico.",
  },
  {
    id: "q-2", type: "vf", statement: "Toda função contínua é derivável.", points: 1,
    options: [{ id: "v", label: "Verdadeiro", correct: false }, { id: "f", label: "Falso", correct: true }],
    category: "Derivadas", discipline: "d-mat", difficulty: "media",
    explanation: "Contra-exemplo: f(x) = |x| é contínua em 0 mas não derivável.",
  },
  {
    id: "q-3", type: "dissertativa", statement: "Explique o Teorema do Valor Médio e forneça uma aplicação prática.", points: 3,
    charLimit: 1200, category: "Derivadas", discipline: "d-mat", difficulty: "dificil",
  },
  {
    id: "q-4", type: "multipla-varias", statement: "Quais alternativas representam autores do Modernismo brasileiro?", points: 2,
    options: [
      { id: "a", label: "Mário de Andrade", correct: true },
      { id: "b", label: "Machado de Assis", correct: false },
      { id: "c", label: "Oswald de Andrade", correct: true },
      { id: "d", label: "José de Alencar", correct: false },
      { id: "e", label: "Manuel Bandeira", correct: true },
    ], category: "Modernismo", discipline: "d-let", difficulty: "media",
  },
  {
    id: "q-5", type: "curta", statement: "Cite a complexidade de tempo do algoritmo de ordenação Merge Sort.", points: 1,
    category: "Algoritmos", discipline: "d-com", difficulty: "facil",
  },
  {
    id: "q-6", type: "upload", statement: "Envie um arquivo .pdf com o algoritmo implementado em Python.", points: 4,
    category: "Algoritmos", discipline: "d-com", difficulty: "dificil",
  },
  {
    id: "q-7", type: "longa", statement: "Analise o excerto abaixo e discorra sobre o contexto histórico.", points: 3,
    charLimit: 3000, category: "Contexto histórico", discipline: "d-dir", difficulty: "media",
  },
  {
    id: "q-8", type: "multipla-uma", statement: "Qual princípio garante o devido processo legal?", points: 1,
    options: [
      { id: "a", label: "Art. 5º, LIV, CF/88", correct: true },
      { id: "b", label: "Art. 3º, I, CF/88", correct: false },
      { id: "c", label: "Art. 37, caput, CF/88", correct: false },
    ], category: "Princípios constitucionais", discipline: "d-dir", difficulty: "facil",
  },
];

export type { ActivityKlassShape as Activity } from "@/mock/database/activities";
import { activitiesKlassShape } from "@/mock/database/activities";

/** Fonte única em src/mock/database/activities.ts (activitiesKlassShape). */
export const ACTIVITIES = activitiesKlassShape;

import type { SubmissionStatus } from "@/mock/database/submissions";
export type { SubmissionStatus } from "@/mock/database/submissions";
export type { Submission } from "@/mock/database/submissions";
import { submissions as SUBMISSIONS_TABLE } from "@/mock/database/submissions";

/** Fonte única em src/mock/database/submissions.ts. */
export const SUBMISSIONS = SUBMISSIONS_TABLE;

export const TYPE_LABEL: Record<ActivityType, string> = {
  prova: "Prova",
  lista: "Lista",
  trabalho: "Trabalho",
  questionario: "Questionário",
  material: "Material",
};

export const TYPE_TONE: Record<ActivityType, string> = {
  prova: "oklch(0.6 0.22 25)",
  lista: "oklch(0.6 0.18 260)",
  trabalho: "oklch(0.6 0.2 305)",
  questionario: "oklch(0.72 0.14 90)",
  material: "oklch(0.68 0.14 195)",
};

export const STATUS_LABEL: Record<ActivityStatus, string> = {
  rascunho: "Rascunho",
  agendada: "Agendada",
  publicada: "Publicada",
  encerrada: "Encerrada",
  arquivada: "Arquivada",
};

export const STATUS_TONE: Record<ActivityStatus, string> = {
  rascunho: "oklch(0.6 0.02 260)",
  agendada: "oklch(0.72 0.14 90)",
  publicada: "oklch(0.62 0.18 155)",
  encerrada: "oklch(0.55 0.19 265)",
  arquivada: "oklch(0.5 0.02 260)",
};

export const SUB_LABEL: Record<SubmissionStatus, string> = {
  pendente: "Pendente",
  enviada: "Aguardando correção",
  corrigida: "Corrigida",
  reenvio: "Reenvio solicitado",
  atrasada: "Atrasada",
};

export const SUB_TONE: Record<SubmissionStatus, string> = {
  pendente: "oklch(0.6 0.02 260)",
  enviada: "oklch(0.72 0.14 90)",
  corrigida: "oklch(0.62 0.18 155)",
  reenvio: "oklch(0.6 0.22 25)",
  atrasada: "oklch(0.65 0.18 25)",
};

export const QTYPE_LABEL: Record<QuestionType, string> = {
  dissertativa: "Dissertativa",
  "multipla-uma": "Múltipla escolha (única)",
  "multipla-varias": "Múltipla escolha (várias)",
  vf: "Verdadeiro ou Falso",
  curta: "Resposta curta",
  longa: "Resposta longa",
  upload: "Upload de arquivo",
  imagem: "Envio de imagem",
  pdf: "Envio de PDF",
};

export function discipline(id: string) { return DISCIPLINES.find((d) => d.id === id); }
export function klass(id: string) { return KLASSES.find((k) => k.id === id); }
export function teacher(id: string) { return TEACHERS.find((t) => t.id === id); }

export function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" }) +
    " · " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function relativeDue(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60);
  if (diff < 0) return `há ${Math.abs(Math.floor(diff))}h`;
  if (diff < 24) return `em ${Math.floor(diff)}h`;
  return `em ${Math.floor(diff / 24)}d`;
}

export const SUBMISSIONS_PER_MONTH = [
  { m: "Jan", v: 128 }, { m: "Fev", v: 172 }, { m: "Mar", v: 210 },
  { m: "Abr", v: 246 }, { m: "Mai", v: 288 }, { m: "Jun", v: 314 }, { m: "Jul", v: 356 },
];

export const AVG_BY_KLASS = KLASSES.map((k, i) => ({ name: k.name.split(" · ")[1] ?? k.name, v: 6.2 + ((i * 0.73) % 3), color: DISCIPLINES.find((d) => d.id === k.disciplineId)?.color ?? "oklch(0.6 0.1 260)" }));

export const EVOLUTION = [
  { m: "Jan", v: 6.2 }, { m: "Fev", v: 6.4 }, { m: "Mar", v: 6.5 },
  { m: "Abr", v: 6.7 }, { m: "Mai", v: 7.0 }, { m: "Jun", v: 7.1 }, { m: "Jul", v: 7.4 },
];