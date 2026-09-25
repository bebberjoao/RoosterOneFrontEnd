// Seed determinístico do construtor de formulários (`forms-store.ts`), que ainda
// é 100% local/mock por decisão de escopo (ver comentário no topo de forms-store.ts).

export type ActivityStatus = "rascunho" | "agendada" | "publicada" | "encerrada" | "arquivada";
export type ActivityType = "prova" | "lista" | "trabalho" | "questionario" | "material";

type ActivitySeed = {
  id: string;
  klassId: string;
  teacherId: string;
  title: string;
  description: string;
  type: ActivityType;
  status: ActivityStatus;
  dueAt: string;
  maxGrade: number;
};

const KLASS_REFS = ["k-eng3a", "k-eng3b", "k-let2a", "k-com1a", "k-com1b", "k-dir4a"];
const TEACHER_REFS = ["t-1", "t-2", "t-3", "t-4", "t-5"];

function iso(daysFromNow: number, hour = 18) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const TITLES: [string, ActivityType][] = [
  ["Lista 3 — Limites e continuidade", "lista"],
  ["Prova P1 — Derivadas", "prova"],
  ["Trabalho — Análise poema modernista", "trabalho"],
  ["Questionário — Vocabulário técnico", "questionario"],
  ["Prova P2 — Matrizes e sistemas", "prova"],
  ["Lista 5 — Recursividade em Python", "lista"],
  ["Trabalho — Estudo de caso constitucional", "trabalho"],
  ["Material de apoio — Newton e movimento", "material"],
  ["Questionário rápido — Reading comprehension", "questionario"],
  ["Lista 2 — Estruturas condicionais", "lista"],
  ["Prova Substitutiva — Cálculo I", "prova"],
  ["Trabalho em grupo — Semana literária", "trabalho"],
];

const STATUSES: ActivityStatus[] = ["publicada", "publicada", "publicada", "encerrada", "agendada", "publicada", "rascunho", "publicada", "publicada", "encerrada", "rascunho", "agendada"];

export const ACTIVITIES: ActivitySeed[] = TITLES.map(([title, type], i) => ({
  id: `act-${100 + i}`,
  klassId: KLASS_REFS[i % KLASS_REFS.length],
  teacherId: TEACHER_REFS[i % TEACHER_REFS.length],
  title,
  description:
    "Atividade avaliativa contendo múltiplas questões e materiais de apoio. Os alunos podem consultar vídeos, PDFs e imagens durante a resolução.",
  type,
  status: STATUSES[i] ?? "publicada",
  dueAt: iso(-5 + i * 2, 23),
  maxGrade: 10,
}));

export type Question = {
  id: string;
  type: "multipla-uma" | "multipla-varias" | "dissertativa" | "curta" | "upload" | "vf" | "longa";
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
