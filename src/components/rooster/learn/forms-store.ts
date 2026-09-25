// Store local (client) das atividades criadas pelo professor no construtor estilo
// Google Forms. Semeado a partir de src/mock/database/activities.ts para que as
// atividades já existentes apareçam nas turmas. Trocar por API real depois.
import { useSyncExternalStore } from "react";
import { ACTIVITIES, QUESTIONS } from "./forms-seed";
import type { ActivityStatus, ActivityType } from "./forms-seed";

export type FormQuestionType = "multipla-uma" | "multipla-varias" | "discursiva" | "vf" | "arquivo";

export type FormOption = { id: string; label: string; correct: boolean };

export type FormQuestion = {
  id: string;
  type: FormQuestionType;
  statement: string;
  /** Texto de apoio exibido acima da pergunta (enunciado longo, citação, etc.). */
  text?: string;
  /** Imagem anexada à pergunta (data/object URL no mock). */
  imageUrl?: string;
  points: number;
  required: boolean;
  options: FormOption[];
};

export type FormActivity = {
  id: string;
  klassId: string;
  teacherId: string;
  title: string;
  description: string;
  type: ActivityType;
  status: ActivityStatus;
  dueAt: string;
  maxGrade: number;
  questions: FormQuestion[];
};

let seq = 1;
const uid = (p: string) => `${p}-${Date.now().toString(36)}-${seq++}`;

function seed(): FormActivity[] {
  return ACTIVITIES.map((a, idx) => ({
    id: a.id,
    klassId: a.klassId,
    teacherId: a.teacherId,
    title: a.title,
    description: a.description,
    type: a.type,
    status: a.status,
    dueAt: a.dueAt,
    maxGrade: a.maxGrade,
    questions: QUESTIONS.slice(idx % 3, (idx % 3) + 2).map((q, i) => ({
      id: `${a.id}-q${i}`,
      type:
        q.type === "multipla-uma" || q.type === "multipla-varias" || q.type === "vf"
          ? (q.type as FormQuestionType)
          : "discursiva",
      statement: q.statement,
      points: q.points,
      required: true,
      options: (q.options ?? []).map((o) => ({ ...o })),
    })),
  }));
}

let state: FormActivity[] = seed();
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useLearnActivities(): FormActivity[] {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}

export const learnForms = {
  all: () => state,
  byClass: (klassId: string) => state.filter((a) => a.klassId === klassId),
  byId: (id: string) => state.find((a) => a.id === id),
  create(dto: Omit<FormActivity, "id">): FormActivity {
    const created: FormActivity = { ...dto, id: uid("act") };
    state = [created, ...state];
    emit();
    return created;
  },
  update(id: string, dto: Partial<FormActivity>) {
    state = state.map((a) => (a.id === id ? { ...a, ...dto } : a));
    emit();
  },
  remove(id: string) {
    state = state.filter((a) => a.id !== id);
    emit();
  },
};

export function newQuestion(type: FormQuestionType = "multipla-uma"): FormQuestion {
  return {
    id: uid("q"),
    type,
    statement: "",
    points: 1,
    required: true,
    options:
      type === "vf"
        ? [
            { id: uid("o"), label: "Verdadeiro", correct: true },
            { id: uid("o"), label: "Falso", correct: false },
          ]
        : type === "discursiva" || type === "arquivo"
          ? []
          : [
              { id: uid("o"), label: "", correct: true },
              { id: uid("o"), label: "", correct: false },
            ],
  };
}

export const newOption = (): FormOption => ({ id: uid("o"), label: "", correct: false });

export const QTYPE_OPTIONS: { value: FormQuestionType; label: string }[] = [
  { value: "multipla-uma", label: "Múltipla escolha (uma resposta)" },
  { value: "multipla-varias", label: "Múltipla escolha (várias respostas)" },
  { value: "vf", label: "Verdadeiro ou Falso" },
  { value: "discursiva", label: "Discursiva" },
  { value: "arquivo", label: "Envio de documento" },
];

/* ---------- Correção de questões discursivas ---------- */
// Mock das respostas enviadas pelos alunos + notas por questão dadas pelo
// professor. Trocar por GET /entregas e PATCH /entregas/:id/corrigir.

export type GradingEntry = {
  activityId: string;
  studentId: string;
  submittedAt: string;
  answers: Record<string, string>;
  scores: Record<string, number | null>;
  feedback: string;
  graded: boolean;
};

const ANSWER_POOL = [
  "O conceito se aplica quando analisamos o comportamento da função próximo ao ponto indicado; usei a definição vista em aula para justificar cada passo do desenvolvimento.",
  "Na minha interpretação, o autor constrói a argumentação a partir de exemplos concretos, o que reforça a tese apresentada no início do texto.",
  "Resolvi separando o problema em duas etapas: primeiro identifiquei as variáveis envolvidas e depois apliquei a fórmula, chegando ao resultado esperado.",
  "Acredito que a principal diferença está no critério adotado, embora eu tenha ficado em dúvida sobre a última parte do enunciado.",
  "Não consegui concluir totalmente, mas apresentei o raciocínio inicial e a hipótese que considerei mais adequada para o caso.",
];

const gKey = (activityId: string, studentId: string) => `${activityId}::${studentId}`;
let gradings: Record<string, GradingEntry> = {};
const gListeners = new Set<() => void>();
const gEmit = () => {
  gradings = { ...gradings };
  gListeners.forEach((l) => l());
};

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Garante (semeando no mock) as entregas de uma atividade para os alunos informados. */
/** Questões que exigem correção manual do professor (discursivas e envio de documento). */
export const isManualQuestion = (q: FormQuestion) => q.type === "discursiva" || q.type === "arquivo";

export function ensureGradings(activity: FormActivity, studentIds: string[]): GradingEntry[] {
  const discursivas = activity.questions.filter((q) => isManualQuestion(q));
  return studentIds.map((studentId) => {
    const key = gKey(activity.id, studentId);
    const found = gradings[key];
    if (found) return found;
    const h = hash(key);
    const entry: GradingEntry = {
      activityId: activity.id,
      studentId,
      submittedAt: new Date(new Date(activity.dueAt).getTime() - (h % 72) * 3600_000).toISOString(),
      answers: Object.fromEntries(
        discursivas.map((q, i) => [
          q.id,
          q.type === "arquivo" ? `documento-${(h % 900) + 100}.pdf` : ANSWER_POOL[(h + i) % ANSWER_POOL.length],
        ]),
      ),
      scores: Object.fromEntries(discursivas.map((q) => [q.id, null as number | null])),
      feedback: "",
      graded: false,
    };
    gradings[key] = entry;
    return entry;
  });
}

export const learnGrading = {
  get: (activityId: string, studentId: string) => gradings[gKey(activityId, studentId)],
  save(activityId: string, studentId: string, dto: Partial<GradingEntry>) {
    const key = gKey(activityId, studentId);
    const cur = gradings[key];
    if (!cur) return;
    gradings[key] = { ...cur, ...dto };
    gEmit();
  },
};

export function useGradingVersion() {
  return useSyncExternalStore(
    (l) => {
      gListeners.add(l);
      return () => gListeners.delete(l);
    },
    () => gradings,
    () => gradings,
  );
}

/* ---------- Respostas enviadas pelo aluno ---------- */
// Guarda o que o aluno respondeu (alternativas, texto e imagens anexadas) para
// que a atividade possa ser reaberta em modo leitura com o retorno do professor.
// Trocar por GET/POST /entregas/:atividade/respostas.

export type StudentResponse = {
  activityId: string;
  studentId: string;
  submittedAt: string;
  answers: Record<string, string | string[]>;
  /** Imagens anexadas por questão (object URLs no mock). */
  images: Record<string, string[]>;
  /** Documentos anexados por questão (nome + object URL no mock). */
  files?: Record<string, { name: string; url: string }[]>;
};

const rKey = (activityId: string, studentId: string) => `${activityId}::${studentId}`;
let responses: Record<string, StudentResponse> = {};
const rListeners = new Set<() => void>();

export const learnResponses = {
  get: (activityId: string, studentId: string) => responses[rKey(activityId, studentId)],
  save(activityId: string, studentId: string, dto: Omit<StudentResponse, "activityId" | "studentId" | "submittedAt">) {
    responses = {
      ...responses,
      [rKey(activityId, studentId)]: { activityId, studentId, submittedAt: new Date().toISOString(), ...dto },
    };
    rListeners.forEach((l) => l());
  },
};

export function useResponsesVersion() {
  return useSyncExternalStore(
    (l) => {
      rListeners.add(l);
      return () => rListeners.delete(l);
    },
    () => responses,
    () => responses,
  );
}

/** Respostas do aluno para exibir na revisão: usa o que foi enviado nesta sessão ou gera um mock determinístico. */
export function resolveStudentResponse(activity: FormActivity, studentId: string): StudentResponse {
  const saved = responses[rKey(activity.id, studentId)];
  if (saved) return saved;
  const grading = gradings[gKey(activity.id, studentId)];
  const answers: Record<string, string | string[]> = {};
  activity.questions.forEach((q, i) => {
    const h = hash(`${activity.id}${studentId}${q.id}`);
    if (q.type === "arquivo") {
      answers[q.id] = grading?.answers[q.id] ?? `documento-${(h % 900) + 100}.pdf`;
    } else if (q.type === "discursiva") {
      answers[q.id] = grading?.answers[q.id] ?? ANSWER_POOL[(h + i) % ANSWER_POOL.length];
    } else if (q.options.length) {
      const pick = q.options[h % q.options.length];
      answers[q.id] = q.type === "multipla-varias" ? [pick.id] : pick.id;
    }
  });
  return { activityId: activity.id, studentId, submittedAt: activity.dueAt, answers, images: {}, files: {} };
}

/** Pontuação obtida por questão (null = discursiva ainda não corrigida). */
export function questionScore(activity: FormActivity, q: FormQuestion, response: StudentResponse, studentId: string): number | null {
  if (isManualQuestion(q)) return gradings[gKey(activity.id, studentId)]?.scores[q.id] ?? null;
  const value = response.answers[q.id];
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const correct = q.options.filter((o) => o.correct).map((o) => o.id);
  const ok = selected.length === correct.length && selected.every((id) => correct.includes(id));
  return ok ? q.points : 0;
}
