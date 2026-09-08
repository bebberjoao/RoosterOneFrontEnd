// Table: activities — fonte única de dados (arrays movidos de
// rooster/learn/mock-data.ts). Reexportada por learn/mock-data.ts (ACTIVITIES,
// campo klassId) para não quebrar o frontend. FK: disciplineId, classId, teacherId.

export type ActivityStatus = "rascunho" | "agendada" | "publicada" | "encerrada" | "arquivada";
export type ActivityType = "prova" | "lista" | "trabalho" | "questionario" | "material";

/** Referências mínimas necessárias para gerar os dados de atividades (evita import de components/rooster/*). */
type ActivityKlassRef = { id: string; disciplineId: string; students: number };
type ActivityTeacherRef = { id: string };

const KLASS_REFS: ActivityKlassRef[] = [
  { id: "k-eng3a", disciplineId: "d-mat", students: 38 },
  { id: "k-eng3b", disciplineId: "d-mat", students: 34 },
  { id: "k-let2a", disciplineId: "d-let", students: 27 },
  { id: "k-com1a", disciplineId: "d-com", students: 42 },
  { id: "k-com1b", disciplineId: "d-com", students: 41 },
  { id: "k-dir4a", disciplineId: "d-dir", students: 55 },
];

const TEACHER_REFS: ActivityTeacherRef[] = [
  { id: "t-1" }, { id: "t-2" }, { id: "t-3" }, { id: "t-4" }, { id: "t-5" },
];

function iso(daysFromNow: number, hour = 18) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const TITLES: [string, ActivityType, string][] = [
  ["Lista 3 — Limites e continuidade", "lista", "d-mat"],
  ["Prova P1 — Derivadas", "prova", "d-mat"],
  ["Trabalho — Análise poema modernista", "trabalho", "d-let"],
  ["Questionário — Vocabulário técnico", "questionario", "d-eng"],
  ["Prova P2 — Matrizes e sistemas", "prova", "d-alg"],
  ["Lista 5 — Recursividade em Python", "lista", "d-com"],
  ["Trabalho — Estudo de caso constitucional", "trabalho", "d-dir"],
  ["Material de apoio — Newton e movimento", "material", "d-fis"],
  ["Questionário rápido — Reading comprehension", "questionario", "d-eng"],
  ["Lista 2 — Estruturas condicionais", "lista", "d-com"],
  ["Prova Substitutiva — Cálculo I", "prova", "d-mat"],
  ["Trabalho em grupo — Semana literária", "trabalho", "d-let"],
];

const STATUSES: ActivityStatus[] = ["publicada", "publicada", "publicada", "encerrada", "agendada", "publicada", "rascunho", "publicada", "publicada", "encerrada", "rascunho", "agendada"];

/** Shape original (com `klassId`), igual ao antigo tipo `Activity` de rooster/learn/mock-data.ts. */
export type ActivityKlassShape = {
  id: string;
  code: string;
  title: string;
  type: ActivityType;
  disciplineId: string;
  klassId: string;
  teacherId: string;
  status: ActivityStatus;
  weight: number;
  maxGrade: number;
  openAt: string;
  dueAt: string;
  timeLimitMin: number | null;
  allowLate: boolean;
  createdAt: string;
  publishedAt: string | null;
  questionsCount: number;
  submissionsCount: number;
  toGradeCount: number;
  gradedCount: number;
  avgGrade: number | null;
  description: string;
};

const RAW_ACTIVITIES: ActivityKlassShape[] = TITLES.map(([title, type, disciplineId], i) => {
  const kls = KLASS_REFS.filter((k) => k.disciplineId === disciplineId);
  const klass = kls[i % Math.max(1, kls.length)] ?? KLASS_REFS[i % KLASS_REFS.length];
  const teacher = TEACHER_REFS[i % TEACHER_REFS.length];
  const status = STATUSES[i] ?? "publicada";
  const total = klass.students;
  const submissions = status === "rascunho" || status === "agendada" ? 0 : Math.max(4, Math.floor(total * (0.4 + (i % 5) * 0.11)));
  const graded = status === "encerrada" ? submissions : Math.max(0, submissions - (3 + (i % 6)));
  const toGrade = submissions - graded;
  return {
    id: `act-${100 + i}`,
    code: `LRN-${(2400 + i).toString()}`,
    title,
    type,
    disciplineId,
    klassId: klass.id,
    teacherId: teacher.id,
    status,
    weight: [1, 2, 3, 2, 3, 2, 2, 1, 1, 2, 3, 2][i] ?? 2,
    maxGrade: 10,
    openAt: iso(-10 + i, 8),
    dueAt: iso(-5 + i * 2, 23),
    timeLimitMin: type === "prova" ? 90 : type === "questionario" ? 30 : null,
    allowLate: type !== "prova",
    createdAt: iso(-14 + i, 10),
    publishedAt: status === "rascunho" ? null : iso(-11 + i, 10),
    questionsCount: type === "material" ? 0 : 5 + (i % 8),
    submissionsCount: submissions,
    toGradeCount: toGrade,
    gradedCount: graded,
    avgGrade: graded > 0 ? 6.4 + ((i * 0.37) % 3) : null,
    description:
      "Atividade avaliativa contendo múltiplas questões e materiais de apoio. Os alunos podem consultar vídeos, PDFs e imagens durante a resolução.",
  };
});

/** Exportado no shape original (com `klassId`) para reexportação 1:1 em learn/mock-data.ts. */
export const activitiesKlassShape: ActivityKlassShape[] = RAW_ACTIVITIES;

export type Activity = Omit<ActivityKlassShape, "klassId"> & { classId: string };

export const activities: Activity[] = RAW_ACTIVITIES.map(({ klassId, ...rest }) => ({ ...rest, classId: klassId }));
export const activityById = (id: string) => activities.find((a) => a.id === id);
export const activitiesByClass = (classId: string) => activities.filter((a) => a.classId === classId);
