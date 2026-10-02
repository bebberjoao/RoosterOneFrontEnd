// Rooster Boost (lado do instrutor) — 100% ligado ao backend real via client HTTP
// compartilhado, seguindo o mesmo padrão de academy.service.ts: tipos "*Back" refletem
// os DTOs em português do backend NestJS; os tipos "front" (inglês/camelCase) são os que
// as telas de gestão de curso já conhecem. Não há mais fallback para dado mockado — ver
// src/components/rooster/boost/mock-data.ts (obsoleto, mantido só para referência).
//
// Escopo: as rotas do lado do Hub — GESTÃO dos cursos (por permissão, sem "dono": quem tem a
// permissão gere qualquer curso) e as CONVERSAS do orientador com os alunos. O portal público
// do aluno é servido por services/boost-portal/cursos.service.ts.
import { request, uploadFile, uploadFileWithProgress, requestBlob } from "@/services/hub/client";

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
  /** Modelo do texto do certificado ({aluno}, {curso}, {cargaHoraria}, {data}); vazio = texto padrão. */
  certificateText: string;
};

/** Professor vinculado a um curso para conversar com os alunos (não edita o curso). */
export type BoostOrientator = { id: string; name: string; email?: string };

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
  /** Presente só quando a aula tem vídeo enviado pelo instrutor (em vez de link externo). */
  hostedVideo?: { fileName: string; size: number; mimeType: string };
};

/** Conta externa do portal público (`BoostUsuario`) — visão do painel administrativo. */
export type ExternalStudent = {
  id: string;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  enrollmentCount: number;
  /** Conta vinculada à conta institucional (aluno interno): nome, e-mail e senha são os do Rooster Hub. */
  institutional: boolean;
};

/** Candidatos à matrícula pela gestão: contas externas e alunos internos (Academy). */
export type EnrollmentCandidates = {
  external: Array<{ boostUserId: string; name: string; email: string }>;
  internal: Array<{ userId: string; name: string; email: string; ra: string | null }>;
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
  institutional: boolean;
};

export type BoostMessage = { id: string; text: string; createdAt: string; authorName: string; fromInstructor: boolean };

/** Uma conversa contínua por (curso, aluno) — item da caixa de entrada do orientador. */
export type BoostConversation = {
  id: string;
  courseId: string;
  courseTitle: string;
  studentId: string;
  studentName: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unread: number;
};

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
  videoArquivo?: string | null;
  videoTamanho?: number | null;
  videoMimeType?: string | null;
};

type ExternalStudentBack = {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  criadoEm: string;
  usuarioId?: string | null;
  _count?: { matriculas: number };
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
  certificadoTexto?: string | null;
  orientadores?: Array<{ professor: { id: string; usuario: { id: string; nome: string; email?: string } } }>;
  modulos?: ModuloBack[];
};

type ConversaBack = {
  id: string;
  cursoId: string;
  boostUsuarioId: string;
  ultimaMensagemEm?: string | null;
  ultimaMensagem: string | null;
  naoLidas: number;
  boostUsuario: { id: string; nome: string };
  curso: { id: string; titulo: string };
};

type AlunoBoostBack = {
  id: string;
  boostUsuarioId: string;
  cursoId: string;
  status: string;
  progressoPct: number;
  matriculadoEm: string;
  concluidoEm?: string | null;
  boostUsuario: { id: string; nome: string; email: string; usuarioId?: string | null };
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
    certificateText: b.certificadoTexto ?? "",
  };
}

function conversationToFront(b: ConversaBack): BoostConversation {
  return {
    id: b.id,
    courseId: b.cursoId,
    courseTitle: b.curso.titulo,
    studentId: b.boostUsuarioId,
    studentName: b.boostUsuario.nome,
    lastMessage: b.ultimaMensagem,
    lastMessageAt: b.ultimaMensagemEm ?? null,
    unread: b.naoLidas,
  };
}

function courseToDto(f: Partial<BoostCourse>, includeCertificate = false): Record<string, unknown> {
  return {
    ...(f.title !== undefined && { titulo: f.title }),
    ...(f.description !== undefined && { descricao: f.description }),
    ...(f.category !== undefined && { categoria: f.category }),
    ...(f.level !== undefined && { nivel: f.level }),
    ...(f.workloadHours !== undefined && { cargaHoraria: f.workloadHours }),
    ...(f.cover !== undefined && { capa: f.cover }),
    ...(f.status !== undefined && { status: f.status }),
    // `emiteCertificado` só entra na CRIAÇÃO. Depois, alterar certificado é a ação própria
    // `certificado` (PATCH /cursos-boost/:id/certificado) — o PATCH genérico rejeita o campo.
    ...(includeCertificate && f.certificate !== undefined && { emiteCertificado: f.certificate }),
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
    hostedVideo:
      b.videoArquivo && b.videoMimeType
        ? { fileName: b.videoArquivo, size: b.videoTamanho ?? 0, mimeType: b.videoMimeType }
        : undefined,
  };
}

function externalStudentToFront(b: ExternalStudentBack): ExternalStudent {
  return {
    id: b.id, name: b.nome, email: b.email, active: b.ativo, createdAt: b.criadoEm,
    enrollmentCount: b._count?.matriculas ?? 0, institutional: !!b.usuarioId,
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
    institutional: !!b.boostUsuario?.usuarioId,
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
  // ---------- Cursos (todos — a gestão é por permissão, não por dono) ----------
  async getCourses(): Promise<BoostCourse[]> {
    const rows = await request<CursoBoostBack[]>("/cursos-boost");
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
    const created = await request<CursoBoostBack>("/cursos-boost", { method: "POST", body: courseToDto(dto, true) });
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
  /** Liga/desliga o certificado e ajusta texto e carga horária — exige a ação `certificado`. */
  async updateCertificate(id: string, dto: { certificate?: boolean; certificateText?: string; workloadHours?: number }): Promise<BoostCourse> {
    const body: Record<string, unknown> = {};
    if (dto.certificate !== undefined) body.emiteCertificado = dto.certificate;
    if (dto.certificateText !== undefined) body.certificadoTexto = dto.certificateText;
    if (dto.workloadHours !== undefined) body.cargaHoraria = dto.workloadHours;
    return courseToFront(await request<CursoBoostBack>(`/cursos-boost/${id}/certificado`, { method: "PATCH", body }));
  },

  // ---------- Orientadores ----------
  async getOrientators(courseId: string): Promise<BoostOrientator[]> {
    const rows = await request<NonNullable<CursoBoostBack["orientadores"]>>(`/cursos-boost/${courseId}/orientadores`);
    return rows.map((o) => ({ id: o.professor.id, name: o.professor.usuario.nome, email: o.professor.usuario.email }));
  },
  /** Substitui a lista de orientadores do curso — exige a ação `vincular-orientadores`. */
  async setOrientators(courseId: string, professorIds: string[]): Promise<BoostOrientator[]> {
    const rows = await request<NonNullable<CursoBoostBack["orientadores"]>>(`/cursos-boost/${courseId}/orientadores`, {
      method: "PUT",
      body: { professorIds },
    });
    return rows.map((o) => ({ id: o.professor.id, name: o.professor.usuario.nome, email: o.professor.usuario.email }));
  },
  /** Professores que podem ser vinculados (não exige permissão do Academy). */
  async getProfessors(): Promise<BoostOrientator[]> {
    const rows = await request<Array<{ id: string; nome: string; email: string | null }>>("/boost-professores");
    return rows.map((p) => ({ id: p.id, name: p.nome, email: p.email ?? undefined }));
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

  // ---------- Vídeo hospedado ----------
  /**
   * Envia o vídeo da aula (até 2GB — mp4, webm ou mov) reportando progresso.
   * Usa `uploadFileWithProgress` (XHR), não `uploadFile`/`fetch`: é o único
   * jeito confiável de expor progresso de upload de arquivo grande.
   */
  async uploadVideo(lessonId: string, file: File, onProgress?: (percent: number) => void): Promise<BoostLesson> {
    const form = new FormData();
    form.append("arquivo", file);
    const updated = await uploadFileWithProgress<AulaBack>(`/aulas-boost/${lessonId}/video`, form, onProgress);
    return lessonToFront(updated);
  },
  async removeVideo(lessonId: string): Promise<BoostLesson> {
    const updated = await request<AulaBack>(`/aulas-boost/${lessonId}/video`, { method: "DELETE" });
    return lessonToFront(updated);
  },
  /**
   * Token de 5 minutos para o `<video src>` da prévia do instrutor —
   * a tag não anexa o cabeçalho Authorization, então precisa desse token na
   * própria URL. Ver `common/stream-token.util.ts` no backend.
   */
  async getStreamToken(lessonId: string): Promise<string> {
    const { token } = await request<{ token: string }>(`/aulas-boost/${lessonId}/stream-token`);
    return token;
  },

  // ---------- Alunos matriculados / progresso ----------
  async getStudents(courseId: string): Promise<BoostEnrollment[]> {
    const rows = await request<AlunoBoostBack[]>(`/cursos-boost/${courseId}/alunos`);
    return rows.map(enrollmentToFront);
  },

  // ---------- Contas externas (painel admin) ----------
  async listExternalStudents(): Promise<ExternalStudent[]> {
    const rows = await request<ExternalStudentBack[]>("/boost-alunos-externos");
    return rows.map(externalStudentToFront);
  },
  async toggleExternalStudent(id: string, active: boolean): Promise<ExternalStudent> {
    return this.updateExternalStudent(id, { active });
  },
  /**
   * Cadastro de conta externa. Sem senha, o backend gera senha temporária, devolvida apenas nesta
   * resposta (`temporaryPassword`), para repasse ao aluno.
   */
  async createExternalStudent(dto: { name: string; email: string; password?: string }): Promise<{ student: ExternalStudent; temporaryPassword?: string }> {
    const created = await request<ExternalStudentBack & { senhaTemporaria?: string }>("/boost-alunos-externos", {
      method: "POST",
      body: { nome: dto.name, email: dto.email, ...(dto.password ? { senha: dto.password } : {}) },
    });
    return { student: externalStudentToFront(created), temporaryPassword: created.senhaTemporaria };
  },
  async updateExternalStudent(id: string, dto: { name?: string; email?: string; active?: boolean }): Promise<ExternalStudent> {
    const updated = await request<ExternalStudentBack>(`/boost-alunos-externos/${id}`, {
      method: "PATCH",
      body: {
        ...(dto.name !== undefined && { nome: dto.name }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.active !== undefined && { ativo: dto.active }),
      },
    });
    return externalStudentToFront(updated);
  },
  /** Exclui conta sem matrícula; com matrícula, o backend responde 409 e a conta deve ser desativada. */
  async removeExternalStudent(id: string): Promise<void> {
    await request<void>(`/boost-alunos-externos/${id}`, { method: "DELETE" });
  },

  // ---------- Matrícula pela gestão ----------
  async getEnrollmentCandidates(courseId: string, search?: string): Promise<EnrollmentCandidates> {
    const qs = search?.trim() ? `?busca=${encodeURIComponent(search.trim())}` : "";
    const r = await request<{
      externos: Array<{ id: string; nome: string; email: string }>;
      internos: Array<{ usuarioId: string; nome: string; email: string; ra: string | null }>;
    }>(`/cursos-boost/${courseId}/candidatos-matricula${qs}`);
    return {
      external: r.externos.map((e) => ({ boostUserId: e.id, name: e.nome, email: e.email })),
      internal: r.internos.map((i) => ({ userId: i.usuarioId, name: i.nome, email: i.email, ra: i.ra })),
    };
  },
  async enrollStudent(courseId: string, target: { boostUserId: string } | { userId: string }): Promise<void> {
    const body = "boostUserId" in target ? { boostUsuarioId: target.boostUserId } : { usuarioId: target.userId };
    await request(`/cursos-boost/${courseId}/matriculas`, { method: "POST", body });
  },
  async cancelEnrollment(enrollmentId: string): Promise<void> {
    await request(`/matriculas-boost/${enrollmentId}/cancelar`, { method: "PATCH" });
  },
  /** Gera e devolve uma senha temporária (visível só nesta resposta) para a conta externa. */
  async resetExternalStudentPassword(id: string): Promise<{ email: string; temporaryPassword: string }> {
    const { email, senhaTemporaria } = await request<{ email: string; senhaTemporaria: string }>(
      `/boost-alunos-externos/${id}/redefinir-senha`,
      { method: "POST" },
    );
    return { email, temporaryPassword: senhaTemporaria };
  },

  // ---------- Conversas com alunos (orientador) ----------
  /** Caixa de entrada: só as conversas dos cursos em que o professor logado é orientador. */
  async listConversations(): Promise<BoostConversation[]> {
    return (await request<ConversaBack[]>("/boost-conversas")).map(conversationToFront);
  },
  async getConversationMessages(conversationId: string): Promise<BoostMessage[]> {
    return (await request<MensagemBack[]>(`/boost-conversas/${conversationId}/mensagens`)).map(messageToFront);
  },
  async sendConversationMessage(conversationId: string, text: string): Promise<BoostMessage> {
    return messageToFront(await request<MensagemBack>(`/boost-conversas/${conversationId}/mensagens`, { method: "POST", body: { mensagem: text } }));
  },
  async markConversationRead(conversationId: string): Promise<void> {
    await request(`/boost-conversas/${conversationId}/lida`, { method: "PATCH" });
  },
};
