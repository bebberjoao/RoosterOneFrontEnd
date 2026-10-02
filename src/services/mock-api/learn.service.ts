// Rooster Learn — 100% ligado ao backend real via client HTTP compartilhado
// (mesmo padrão de src/services/mock-api/academy.service.ts). Atividades
// pertencem a uma Turma real do Academy (mesmo espaço de ids retornado por
// academyService.getClasses()) — não existe uma turma/disciplina paralela só
// do Learn. A atividade pode ter questões (múltipla escolha com uma ou várias
// respostas, verdadeiro ou falso, discursiva e envio de arquivo), com texto e
// imagem de apoio; sem questões, a entrega é um texto livre + anexos.
// As objetivas são corrigidas no envio; as demais, pontuadas pelo professor.
import { request, uploadFile, requestBlob } from "@/services/hub/client";
import { fmtDataHora, fmtTamanho } from "@/lib/formatacao";
import { fmtNumeroLivre } from "@/lib/formatacao";

export type ActivityType = "prova" | "lista" | "trabalho" | "questionario" | "material";
export type ActivityStatus = "rascunho" | "agendada" | "publicada" | "encerrada" | "arquivada";
export type SubmissionStatus = "pendente" | "enviada" | "corrigida" | "reenvio" | "atrasada";

export type Activity = {
  id: string;
  code: string | null;
  title: string;
  type: ActivityType;
  description: string;
  classId: string;
  disciplineName?: string;
  className?: string;
  teacherId?: string;
  status: ActivityStatus;
  weight: number;
  maxGrade: number;
  opensAt: string | null;
  dueAt: string | null;
  timeLimitMin: number | null;
  allowLate: boolean;
  createdAt: string | null;
  publishedAt: string | null;
  submissionsCount: number;
  questionsCount: number;
  hasGradeItem: boolean;
};

export type QuestionType = "multipla-uma" | "multipla-varias" | "vf" | "discursiva" | "arquivo";

export type QuestionOption = { id: string; text: string; correct?: boolean };

export type Question = {
  id: string;
  order: number;
  type: QuestionType;
  statement: string;
  supportText: string | null;
  hasImage: boolean;
  imageName: string | null;
  points: number;
  required: boolean;
  options: QuestionOption[];
};

export type QuestionDraft = {
  type: QuestionType;
  statement: string;
  supportText?: string;
  points?: number;
  required?: boolean;
  options?: Array<{ text: string; correct?: boolean }>;
};

export type Answer = {
  questionId: string;
  optionIds: string[];
  text: string | null;
  score: number | null;
  autoGraded: boolean;
};

export type AnswerDraft = { questionId: string; optionIds?: string[]; text?: string };

export type Attachment = { id: string; name: string; type: string | null; size: number | null; questionId: string | null };

export type Submission = {
  id: string;
  activityId: string;
  studentId: string;
  studentName: string;
  status: SubmissionStatus;
  text: string | null;
  submittedAt: string | null;
  grade: number | null;
  feedback: string | null;
  gradedAt: string | null;
  attachments: Attachment[];
  answers: Answer[];
  activity?: { id: string; title: string; type: ActivityType; status: ActivityStatus; maxGrade: number; classId: string; disciplineName?: string; className?: string; dueAt: string | null };
};

// ================= Tipos "back" (DTOs em português do Prisma) =================
type AtividadeBack = {
  id: string; codigo: string | null; titulo: string; tipo: string; descricao?: string | null;
  turmaId: string; professorId?: string | null; status: string;
  peso: number | string; notaMaxima: number | string;
  abreEm?: string | null; prazoEm?: string | null; tempoLimiteMin?: number | null; permiteAtraso: boolean;
  criadoEm?: string | null; publicadoEm?: string | null;
  itemAvaliativo?: unknown | null;
  _count?: { entregas?: number; questoes?: number };
  turma?: { codigo?: string; disciplina?: { nome: string; codigo: string } };
};

type QuestaoBack = {
  id: string; ordem: number; tipo: string; enunciado: string; textoApoio: string | null;
  possuiImagem: boolean; imagemNome: string | null; pontos: number; obrigatoria: boolean;
  alternativas: Array<{ id: string; texto: string; correta?: boolean }>;
};

type RespostaBack = {
  questaoId: string; alternativasIds: string[] | null; texto: string | null;
  pontuacao: number | null; corrigidaAutomaticamente: boolean;
};

type AnexoBack = { id: string; nomeArquivo: string | null; tipo: string | null; tamanho: number | null; questaoId?: string | null };

type EntregaBack = {
  id: string; atividadeId: string; alunoId: string; status: string; texto?: string | null;
  enviadoEm?: string | null; nota?: number | string | null; feedback?: string | null;
  corrigidoPorId?: string | null; corrigidoEm?: string | null;
  anexos?: AnexoBack[];
  respostas?: RespostaBack[];
  aluno?: { usuario?: { id: string; nome: string } };
  atividade?: AtividadeBack & { turma?: { codigo?: string; disciplina?: { nome: string; codigo: string } } };
};

function num(v: number | string | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === "number" ? v : Number(v);
}
function numOrNull(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  return typeof v === "number" ? v : Number(v);
}

function atividadeToFront(b: AtividadeBack): Activity {
  return {
    id: b.id, code: b.codigo, title: b.titulo, type: b.tipo as ActivityType,
    description: b.descricao ?? "", classId: b.turmaId,
    disciplineName: b.turma?.disciplina?.nome, className: b.turma?.codigo,
    teacherId: b.professorId ?? undefined, status: b.status as ActivityStatus,
    weight: num(b.peso), maxGrade: num(b.notaMaxima) || 10,
    opensAt: b.abreEm ?? null, dueAt: b.prazoEm ?? null, timeLimitMin: b.tempoLimiteMin ?? null,
    allowLate: b.permiteAtraso, createdAt: b.criadoEm ?? null, publishedAt: b.publicadoEm ?? null,
    submissionsCount: b._count?.entregas ?? 0, questionsCount: b._count?.questoes ?? 0,
    hasGradeItem: !!b.itemAvaliativo,
  };
}

function questaoToFront(b: QuestaoBack): Question {
  return {
    id: b.id, order: b.ordem, type: b.tipo as QuestionType, statement: b.enunciado,
    supportText: b.textoApoio, hasImage: b.possuiImagem, imageName: b.imagemNome,
    points: num(b.pontos), required: b.obrigatoria,
    options: b.alternativas.map((a) => ({ id: a.id, text: a.texto, correct: a.correta })),
  };
}

function questaoDraftToDto(d: Partial<QuestionDraft>) {
  return {
    ...(d.type !== undefined && { tipo: d.type }),
    ...(d.statement !== undefined && { enunciado: d.statement }),
    ...(d.supportText !== undefined && { textoApoio: d.supportText }),
    ...(d.points !== undefined && { pontos: d.points }),
    ...(d.required !== undefined && { obrigatoria: d.required }),
    ...(d.options !== undefined && { alternativas: d.options.map((o) => ({ texto: o.text, correta: !!o.correct })) }),
  };
}

function respostaToFront(b: RespostaBack): Answer {
  return {
    questionId: b.questaoId, optionIds: b.alternativasIds ?? [], text: b.texto ?? null,
    score: numOrNull(b.pontuacao), autoGraded: b.corrigidaAutomaticamente,
  };
}

function anexoToFront(b: AnexoBack): Attachment {
  return { id: b.id, name: b.nomeArquivo ?? "arquivo", type: b.tipo, size: b.tamanho, questionId: b.questaoId ?? null };
}

function entregaToFront(b: EntregaBack): Submission {
  return {
    id: b.id, activityId: b.atividadeId, studentId: b.alunoId,
    studentName: b.aluno?.usuario?.nome ?? "—", status: b.status as SubmissionStatus,
    text: b.texto ?? null, submittedAt: b.enviadoEm ?? null, grade: numOrNull(b.nota),
    feedback: b.feedback ?? null, gradedAt: b.corrigidoEm ?? null,
    attachments: (b.anexos ?? []).map(anexoToFront),
    answers: (b.respostas ?? []).map(respostaToFront),
    activity: b.atividade
      ? {
          id: b.atividade.id, title: b.atividade.titulo, type: b.atividade.tipo as ActivityType,
          status: b.atividade.status as ActivityStatus, maxGrade: num(b.atividade.notaMaxima) || 10,
          classId: b.atividade.turmaId, disciplineName: b.atividade.turma?.disciplina?.nome,
          className: b.atividade.turma?.codigo, dueAt: b.atividade.prazoEm ?? null,
        }
      : undefined,
  };
}

export type ActivityDraft = {
  title: string; type: ActivityType; description?: string; classId: string;
  weight?: number; maxGrade?: number; opensAt?: string | null; dueAt?: string | null;
  timeLimitMin?: number | null; allowLate?: boolean;
};

function draftToDto(dto: Partial<ActivityDraft>) {
  return {
    ...(dto.title !== undefined && { titulo: dto.title }),
    ...(dto.type !== undefined && { tipo: dto.type }),
    ...(dto.description !== undefined && { descricao: dto.description }),
    ...(dto.classId !== undefined && { turmaId: dto.classId }),
    ...(dto.weight !== undefined && { peso: dto.weight }),
    ...(dto.maxGrade !== undefined && { notaMaxima: dto.maxGrade }),
    ...(dto.opensAt !== undefined && { abreEm: dto.opensAt || undefined }),
    ...(dto.dueAt !== undefined && { prazoEm: dto.dueAt || undefined }),
    ...(dto.timeLimitMin !== undefined && { tempoLimiteMin: dto.timeLimitMin || undefined }),
    ...(dto.allowLate !== undefined && { permiteAtraso: dto.allowLate }),
  };
}

export const learnService = {
  // ---------- Atividades (professor/coordenação) ----------
  async getByClass(classId: string): Promise<Activity[]> {
    const rows = await request<AtividadeBack[]>(`/turmas/${classId}/atividades`);
    return rows.map(atividadeToFront);
  },
  async getById(id: string): Promise<Activity | undefined> {
    try {
      return atividadeToFront(await request<AtividadeBack>(`/atividades/${id}`));
    } catch {
      return undefined;
    }
  },
  async create(dto: ActivityDraft): Promise<Activity> {
    const created = await request<AtividadeBack>("/atividades", { method: "POST", body: draftToDto(dto) });
    return atividadeToFront(created);
  },
  async update(id: string, dto: Partial<ActivityDraft>): Promise<Activity> {
    const updated = await request<AtividadeBack>(`/atividades/${id}`, { method: "PATCH", body: draftToDto(dto) });
    return atividadeToFront(updated);
  },
  async remove(id: string): Promise<boolean> {
    await request<void>(`/atividades/${id}`, { method: "DELETE" });
    return true;
  },
  async publish(id: string): Promise<Activity> {
    return atividadeToFront(await request<AtividadeBack>(`/atividades/${id}/publicar`, { method: "PATCH" }));
  },

  // ---------- Entregas (professor corrige) ----------
  async getSubmissions(activityId: string): Promise<Submission[]> {
    const rows = await request<EntregaBack[]>(`/atividades/${activityId}/entregas`);
    return rows.map(entregaToFront);
  },
  async gradeSubmission(entregaId: string, nota: number, feedback?: string): Promise<Submission> {
    const updated = await request<EntregaBack>(`/entregas/${entregaId}/corrigir`, { method: "PATCH", body: { nota, feedback } });
    return entregaToFront(updated);
  },
  /** Correção de atividade com questões: a nota é calculada no backend a partir das pontuações. */
  async gradeByQuestion(entregaId: string, scores: Array<{ questionId: string; score: number }>, feedback?: string): Promise<Submission> {
    const updated = await request<EntregaBack>(`/entregas/${entregaId}/corrigir`, {
      method: "PATCH",
      body: { pontuacoes: scores.map((s) => ({ questaoId: s.questionId, pontuacao: s.score })), feedback },
    });
    return entregaToFront(updated);
  },

  // ---------- Questões ----------
  async getQuestions(activityId: string): Promise<Question[]> {
    return (await request<QuestaoBack[]>(`/atividades/${activityId}/questoes`)).map(questaoToFront);
  },
  async createQuestion(activityId: string, draft: QuestionDraft): Promise<Question> {
    return questaoToFront(await request<QuestaoBack>(`/atividades/${activityId}/questoes`, { method: "POST", body: questaoDraftToDto(draft) }));
  },
  async updateQuestion(questionId: string, draft: Partial<QuestionDraft>): Promise<Question> {
    return questaoToFront(await request<QuestaoBack>(`/questoes/${questionId}`, { method: "PATCH", body: questaoDraftToDto(draft) }));
  },
  async removeQuestion(questionId: string): Promise<void> {
    await request<void>(`/questoes/${questionId}`, { method: "DELETE" });
  },
  async reorderQuestions(activityId: string, ids: string[]): Promise<Question[]> {
    return (await request<QuestaoBack[]>(`/atividades/${activityId}/questoes/ordem`, { method: "PATCH", body: { ids } })).map(questaoToFront);
  },
  async uploadQuestionImage(questionId: string, file: File): Promise<Question> {
    const form = new FormData();
    form.append("arquivo", file);
    return questaoToFront(await uploadFile<QuestaoBack>(`/questoes/${questionId}/imagem`, form));
  },
  async removeQuestionImage(questionId: string): Promise<Question> {
    return questaoToFront(await request<QuestaoBack>(`/questoes/${questionId}/imagem`, { method: "DELETE" }));
  },
  async getQuestionImage(questionId: string): Promise<Blob> {
    return requestBlob(`/questoes/${questionId}/imagem`);
  },

  // ---------- Portal do aluno ("meus dados") ----------
  async submit(activityId: string, texto?: string, answers?: AnswerDraft[]): Promise<Submission> {
    const respostas = answers?.map((a) => ({ questaoId: a.questionId, alternativasIds: a.optionIds, texto: a.text }));
    const created = await request<EntregaBack>(`/atividades/${activityId}/entregas`, { method: "POST", body: { texto, respostas } });
    return entregaToFront(created);
  },
  async getMySubmission(activityId: string): Promise<Submission | null> {
    const found = await request<EntregaBack | null>(`/atividades/${activityId}/minha-entrega`);
    return found ? entregaToFront(found) : null;
  },
  async getMySubmissions(): Promise<Submission[]> {
    const rows = await request<EntregaBack[]>("/me/entregas");
    return rows.map(entregaToFront);
  },
  async getMyActivities(): Promise<Activity[]> {
    const rows = await request<AtividadeBack[]>("/me/atividades");
    return rows.map(atividadeToFront);
  },

  // ---------- Anexos de entrega ----------
  async uploadAttachment(entregaId: string, file: File, questionId?: string): Promise<Attachment> {
    const form = new FormData();
    if (questionId) form.append("questaoId", questionId);
    form.append("arquivo", file);
    return anexoToFront(await uploadFile<AnexoBack>(`/entregas/${entregaId}/anexos`, form));
  },
  async downloadAttachment(entregaId: string, anexoId: string): Promise<Blob> {
    return requestBlob(`/entregas/${entregaId}/anexos/${anexoId}/arquivo`);
  },
};

export const TYPE_LABEL: Record<ActivityType, string> = {
  prova: "Prova", lista: "Lista", trabalho: "Trabalho", questionario: "Questionário", material: "Material",
};
export const TYPE_TONE: Record<ActivityType, string> = {
  prova: "oklch(0.6 0.22 25)", lista: "oklch(0.6 0.18 260)", trabalho: "oklch(0.6 0.2 305)",
  questionario: "oklch(0.72 0.14 90)", material: "oklch(0.68 0.14 195)",
};
export const QUESTION_TYPE_LABEL: Record<QuestionType, string> = {
  "multipla-uma": "Múltipla escolha (uma resposta)",
  "multipla-varias": "Múltipla escolha (várias respostas)",
  vf: "Verdadeiro ou falso",
  discursiva: "Discursiva",
  arquivo: "Envio de arquivo",
};
export const OBJECTIVE_TYPES: ReadonlySet<QuestionType> = new Set(["multipla-uma", "multipla-varias", "vf"]);

export const STATUS_LABEL: Record<ActivityStatus, string> = {
  rascunho: "Rascunho", agendada: "Agendada", publicada: "Publicada", encerrada: "Encerrada", arquivada: "Arquivada",
};
export const STATUS_TONE: Record<ActivityStatus, string> = {
  rascunho: "oklch(0.6 0.02 260)", agendada: "oklch(0.72 0.14 90)", publicada: "oklch(0.62 0.18 155)",
  encerrada: "oklch(0.55 0.19 265)", arquivada: "oklch(0.5 0.02 260)",
};
export const SUB_LABEL: Record<SubmissionStatus, string> = {
  pendente: "Pendente", enviada: "Aguardando correção", corrigida: "Corrigida", reenvio: "Reenvio solicitado", atrasada: "Atrasada",
};
export const SUB_TONE: Record<SubmissionStatus, string> = {
  pendente: "oklch(0.6 0.02 260)", enviada: "oklch(0.72 0.14 90)", corrigida: "oklch(0.62 0.18 155)",
  reenvio: "oklch(0.6 0.22 25)", atrasada: "oklch(0.65 0.18 25)",
};

export function formatDate(iso?: string | null) {
  return fmtDataHora(iso);
}
export function relativeDue(iso?: string | null) {
  if (!iso) return "sem prazo";
  const diff = (new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60);
  if (diff < 0) return `há ${Math.abs(Math.floor(diff))}h`;
  if (diff < 24) return `em ${Math.floor(diff)}h`;
  return `em ${Math.floor(diff / 24)}d`;
}
export function fmtSize(bytes?: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${fmtNumeroLivre(bytes / 1024, 0)} KB`;
  return `${fmtNumeroLivre(bytes / 1024 / 1024, 1)} MB`;
}
