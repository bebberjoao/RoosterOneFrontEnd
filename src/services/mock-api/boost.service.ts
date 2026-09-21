// Rooster Boost (lado do instrutor) — 100% ligado ao backend real via client HTTP
// compartilhado, seguindo o mesmo padrão de academy.service.ts: tipos "*Back" refletem
// os DTOs em português do backend NestJS; os tipos "front" (inglês/camelCase) são os que
// as telas de gestão de curso já conhecem. Não há mais fallback para dado mockado — ver
// src/components/rooster/boost/mock-data.ts (obsoleto, mantido só para referência).
//
// Escopo: apenas as rotas que o instrutor (professor) usa para gerenciar os próprios
// cursos. O catálogo público do aluno (portal externo) é responsabilidade de outro time
// e não é servido por este arquivo.
import { request, uploadFile, requestBlob } from "@/services/hub/client";

export type CourseLevel = "iniciante" | "intermediario" | "avancado";
export type CourseStatus = "rascunho" | "publicado" | "arquivado";
export type LessonType = "video" | "texto" | "pdf" | "link";

export const LEVEL_LABEL: Record<CourseLevel, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};
export const LEVEL_TONE: Record<CourseLevel, string> = {
  iniciante: "oklch(0.68 0.14 195)",
  intermediario: "oklch(0.72 0.16 90)",
  avancado: "oklch(0.6 0.22 25)",
};
// Prefixo BOOST_ evita colisão com o STATUS_LABEL/STATUS_TONE já exportados por
// learn.service.ts no barrel `src/services/mock-api/index.ts` (mesmo `export *`).
export const BOOST_STATUS_LABEL: Record<CourseStatus, string> = {
  rascunho: "Rascunho",
  publicado: "Publicado",
  arquivado: "Arquivado",
};
export const BOOST_STATUS_TONE: Record<CourseStatus, string> = {
  rascunho: "oklch(0.6 0.02 260)",
  publicado: "oklch(0.62 0.18 155)",
  arquivado: "oklch(0.55 0.02 260)",
};
export const LESSON_TYPE_LABEL: Record<LessonType, string> = {
  video: "Vídeo",
  texto: "Texto",
  pdf: "PDF",
  link: "Link externo",
};

// ================= Tipos "front" usados pelas telas de gestão =================

export type BoostCourse = {
  id: string;
  title: string;
  description: string;
  category: string;
  level: CourseLevel;
  workloadHours: number;
  cover: string;
  status: CourseStatus;
  certificate: boolean;
  professorId?: string;
};

export type BoostMaterial = { id: string; fileName: string; size: number; type?: string; lessonId: string };

export type BoostLesson = {
  id: string;
  title: string;
  order: number;
  moduleId: string;
  type: LessonType;
  contentUrl?: string;
  contentText?: string;
  durationMin?: number;
  materials: BoostMaterial[];
};

export type BoostModule = { id: string; title: string; order: number; courseId: string; lessons: BoostLesson[] };

export type BoostCourseDetail = BoostCourse & { modules: BoostModule[] };

export type BoostEnrollment = {
  id: string;
  studentId: string;
  courseId: string;
  status: string;
  progressPct: number;
  enrolledAt: string;
  completedAt?: string;
  studentName: string;
  studentEmail: string;
  certificateIssued: boolean;
};

export type BoostMessage = { id: string; text: string; createdAt: string; authorName: string; fromInstructor: boolean };

// ================= Tipos "back" (DTOs do NestJS) =================

type MaterialBack = { id: string; nome?: string | null; tamanho?: number | null; tipo?: string | null; aulaId: string };

type AulaBack = {
  id: string;
  titulo: string;
  ordem: number;
  moduloId: string;
  tipo: LessonType;
  conteudoUrl?: string | null;
  conteudoTexto?: string | null;
  duracaoMin?: number | null;
  materiais?: MaterialBack[];
};

type ModuloBack = { id: string; titulo: string; ordem: number; cursoId: string; aulas?: AulaBack[] };

type CursoBoostBack = {
  id: string;
  titulo: string;
  descricao?: string | null;
  categoria?: string | null;
  nivel?: CourseLevel | null;
  cargaHoraria: number;
  capa?: string | null;
  status: CourseStatus;
  emiteCertificado?: boolean;
  professorId?: string;
  modulos?: ModuloBack[];
};

type AlunoBoostBack = {
  id: string;
  boostUsuarioId: string;
  cursoId: string;
  status: string;
  progressoPct: number;
  matriculadoEm: string;
  concluidoEm?: string | null;
  boostUsuario: { id: string; nome: string; email: string };
  certificado: { id: string; [k: string]: unknown } | null;
};

type MensagemBack = {
  id: string;
  mensagem: string;
  criadoEm: string;
  boostUsuario?: { id: string; nome: string } | null;
  professor?: { id: string; usuario: { id: string; nome: string } } | null;
};

// ================= Mappers =================

function courseToFront(b: CursoBoostBack): BoostCourse {
  return {
    id: b.id,
    title: b.titulo,
    description: b.descricao ?? "",
    category: b.categoria ?? "",
    level: b.nivel ?? "iniciante",
    workloadHours: b.cargaHoraria,
    cover: b.capa ?? "",
    status: b.status,
    certificate: b.emiteCertificado ?? false,
    professorId: b.professorId,
  };
}

function courseToDto(f: Partial<BoostCourse>): Record<string, unknown> {
  return {
    ...(f.title !== undefined && { titulo: f.title }),
    ...(f.description !== undefined && { descricao: f.description }),
    ...(f.category !== undefined && { categoria: f.category }),
    ...(f.level !== undefined && { nivel: f.level }),
    ...(f.workloadHours !== undefined && { cargaHoraria: f.workloadHours }),
    ...(f.cover !== undefined && { capa: f.cover }),
    ...(f.status !== undefined && { status: f.status }),
    ...(f.certificate !== undefined && { emiteCertificado: f.certificate }),
  };
}

function materialToFront(b: MaterialBack): BoostMaterial {
  return { id: b.id, fileName: b.nome ?? "arquivo", size: b.tamanho ?? 0, type: b.tipo ?? undefined, lessonId: b.aulaId };
}

function lessonToFront(b: AulaBack): BoostLesson {
  return {
    id: b.id,
    title: b.titulo,
    order: b.ordem,
    moduleId: b.moduloId,
    type: b.tipo,
    contentUrl: b.conteudoUrl ?? undefined,
    contentText: b.conteudoTexto ?? undefined,
    durationMin: b.duracaoMin ?? undefined,
    materials: (b.materiais ?? []).map(materialToFront),
  };
}

function moduleToFront(b: ModuloBack): BoostModule {
  return {
    id: b.id,
    title: b.titulo,
    order: b.ordem,
    courseId: b.cursoId,
    lessons: (b.aulas ?? []).map(lessonToFront).sort((a, c) => a.order - c.order),
  };
}

function courseDetailToFront(b: CursoBoostBack): BoostCourseDetail {
  return { ...courseToFront(b), modules: (b.modulos ?? []).map(moduleToFront).sort((a, c) => a.order - c.order) };
}

function enrollmentToFront(b: AlunoBoostBack): BoostEnrollment {
  return {
    id: b.id,
    studentId: b.boostUsuarioId,
    courseId: b.cursoId,
    status: b.status,
    progressPct: b.progressoPct,
    enrolledAt: b.matriculadoEm,
    completedAt: b.concluidoEm ?? undefined,
    studentName: b.boostUsuario?.nome ?? "—",
    studentEmail: b.boostUsuario?.email ?? "",
    certificateIssued: !!b.certificado,
  };
}

/** Exportado para o hook de WebSocket poder traduzir o payload de `mensagem:nova` com o mesmo formato do REST. */
export function messageToFront(b: MensagemBack): BoostMessage {
  return {
    id: b.id,
    text: b.mensagem,
    createdAt: b.criadoEm,
    authorName: b.professor?.usuario.nome ?? b.boostUsuario?.nome ?? "—",
    fromInstructor: !!b.professor,
  };
}

function qs(params: Record<string, string | undefined>) {
  const entries = Object.entries(params).filter(([, v]) => v);
  if (!entries.length) return "";
  return `?${entries.map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join("&")}`;
}

export const boostService = {
  // ---------- Cursos (apenas os do professor autenticado — ver `minhas=true`) ----------
  async getMyCourses(): Promise<BoostCourse[]> {
    const rows = await request<CursoBoostBack[]>(`/cursos-boost${qs({ minhas: "true" })}`);
    return rows.map(courseToFront);
  },
  /** Retorna `undefined` tanto para "não existe" quanto para "existe mas não é seu" (403) — a tela trata os dois casos com a mesma mensagem amigável. */
  async getById(id: string): Promise<BoostCourseDetail | undefined> {
    try {
      return courseDetailToFront(await request<CursoBoostBack>(`/cursos-boost/${id}`));
    } catch {
      return undefined;
    }
  },
  async create(dto: {
    title: string; description?: string; category?: string; level?: CourseLevel;
    workloadHours: number; cover?: string; status?: CourseStatus; certificate?: boolean;
  }): Promise<BoostCourse> {
    const created = await request<CursoBoostBack>("/cursos-boost", { method: "POST", body: courseToDto(dto) });
    return courseToFront(created);
  },
  async update(id: string, dto: Partial<BoostCourse>): Promise<BoostCourse> {
    const updated = await request<CursoBoostBack>(`/cursos-boost/${id}`, { method: "PATCH", body: courseToDto(dto) });
    return courseToFront(updated);
  },
  async remove(id: string): Promise<boolean> {
    await request<void>(`/cursos-boost/${id}`, { method: "DELETE" });
    return true;
  },

  // ---------- Módulos ----------
  async createModule(courseId: string, dto: { title: string; order?: number }): Promise<BoostModule> {
    const created = await request<ModuloBack>(`/cursos-boost/${courseId}/modulos`, {
      method: "POST",
      body: { titulo: dto.title, ordem: dto.order },
    });
    return moduleToFront(created);
  },
  async updateModule(id: string, dto: Partial<{ title: string; order: number }>): Promise<BoostModule> {
    const body: Record<string, unknown> = {};
    if (dto.title !== undefined) body.titulo = dto.title;
    if (dto.order !== undefined) body.ordem = dto.order;
    const updated = await request<ModuloBack>(`/modulos-boost/${id}`, { method: "PATCH", body });
    return moduleToFront(updated);
  },
  async removeModule(id: string): Promise<boolean> {
    await request<void>(`/modulos-boost/${id}`, { method: "DELETE" });
    return true;
  },

  // ---------- Aulas ----------
  async createLesson(moduleId: string, dto: {
    title: string; order?: number; type?: LessonType; contentUrl?: string; contentText?: string; durationMin?: number;
  }): Promise<BoostLesson> {
    const created = await request<AulaBack>(`/modulos-boost/${moduleId}/aulas`, {
      method: "POST",
      body: {
        titulo: dto.title, ordem: dto.order, tipo: dto.type,
        conteudoUrl: dto.contentUrl, conteudoTexto: dto.contentText, duracaoMin: dto.durationMin,
      },
    });
    return lessonToFront(created);
  },
  async updateLesson(id: string, dto: Partial<{
    title: string; order: number; type: LessonType; contentUrl: string; contentText: string; durationMin: number;
  }>): Promise<BoostLesson> {
    const body: Record<string, unknown> = {};
    if (dto.title !== undefined) body.titulo = dto.title;
    if (dto.order !== undefined) body.ordem = dto.order;
    if (dto.type !== undefined) body.tipo = dto.type;
    if (dto.contentUrl !== undefined) body.conteudoUrl = dto.contentUrl;
    if (dto.contentText !== undefined) body.conteudoTexto = dto.contentText;
    if (dto.durationMin !== undefined) body.duracaoMin = dto.durationMin;
    const updated = await request<AulaBack>(`/aulas-boost/${id}`, { method: "PATCH", body });
    return lessonToFront(updated);
  },
  async removeLesson(id: string): Promise<boolean> {
    await request<void>(`/aulas-boost/${id}`, { method: "DELETE" });
    return true;
  },

  // ---------- Materiais ----------
  async uploadMaterial(lessonId: string, file: File): Promise<BoostMaterial> {
    const form = new FormData();
    form.append("arquivo", file);
    const created = await uploadFile<MaterialBack>(`/aulas-boost/${lessonId}/materiais`, form);
    return materialToFront(created);
  },
  async removeMaterial(id: string): Promise<boolean> {
    await request<void>(`/materiais-boost/${id}`, { method: "DELETE" });
    return true;
  },
  /** Baixa o material como Blob (autenticado) e dispara o download no navegador. */
  async downloadMaterial(id: string, fileName: string): Promise<void> {
    const blob = await requestBlob(`/materiais-boost/${id}/arquivo`);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },

  // ---------- Alunos matriculados / progresso ----------
  async getStudents(courseId: string): Promise<BoostEnrollment[]> {
    const rows = await request<AlunoBoostBack[]>(`/cursos-boost/${courseId}/alunos`);
    return rows.map(enrollmentToFront);
  },

  // ---------- Chat interno do curso ----------
  async getMessages(courseId: string): Promise<BoostMessage[]> {
    const rows = await request<MensagemBack[]>(`/cursos-boost/${courseId}/mensagens`);
    return rows.map(messageToFront);
  },
  async sendMessage(courseId: string, text: string): Promise<BoostMessage> {
    const created = await request<MensagemBack>(`/cursos-boost/${courseId}/mensagens`, {
      method: "POST",
      body: { mensagem: text },
    });
    return messageToFront(created);
  },
};
