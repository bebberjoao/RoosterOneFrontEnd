// Rooster Academy — 100% ligado ao backend real via client HTTP compartilhado
// (sem fallback para dado mockado nos recursos com relações complexas —
// segue o padrão de src/services/mock-api/room.service.ts). Os tipos aqui são
// "front" (nomes em inglês/camelCase que as telas de Academy já conhecem);
// os tipos "*Back" refletem os DTOs em português do backend NestJS.
import { mapResource } from "@/services/hub/mapped-resource";
import { createResource as createRawResource } from "@/services/hub/index";
import { request, uploadFile, requestBlob } from "@/services/hub/client";
import { fmtNumeroLivre } from "@/lib/formatacao";

// ---------- Cosmetic helpers (backend não guarda cor/iniciais) ----------
const PALETTE = [
  "oklch(0.55 0.19 265)", "oklch(0.68 0.14 195)", "oklch(0.68 0.18 40)",
  "oklch(0.62 0.18 155)", "oklch(0.55 0.1 260)", "oklch(0.6 0.2 305)",
  "oklch(0.65 0.18 25)", "oklch(0.7 0.16 90)",
];
function hashStr(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
export function toneFor(id: string) {
  return PALETTE[hashStr(id) % PALETTE.length];
}
export function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const s = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return s ? s.toUpperCase() : "—";
}
const dateOnly = (iso?: string | null) => (iso ? iso.slice(0, 10) : "");
/** Campos Decimal do Prisma (peso, notaMaxima, valor da nota) chegam como string no JSON. */
function num(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

// ================= Tipos "front" usados pelas telas =================

export type Term = { id: string; name: string; startDate: string; endDate: string; active: boolean };

export type Course = {
  id: string; name: string; code: string;
  degree: "Graduação" | "Pós-graduação" | "Técnico" | "Extensão"; active: boolean;
};

export type Teacher = {
  id: string; usuarioId: string; name: string; email: string; title: string; department: string;
  weeklyHours: number; status: "ativo" | "afastado" | "inativo"; initials: string; tone: string; active: boolean;
};

export type Discipline = {
  id: string; code: string; name: string; description: string; courseId: string; workload: number;
  status: "ativa" | "arquivada" | "inativa"; accent: string;
};

export type Student = {
  id: string; usuarioId: string; ra: string; name: string; email: string; initials: string;
  courseId: string; semester: number; status: "ativo" | "trancado" | "formado" | "inativo"; active: boolean;
};

export type SchoolClass = {
  id: string; code: string; disciplineId: string; termId: string; teacherId?: string;
  shift: "Matutino" | "Vespertino" | "Noturno"; capacity: number; roomLabel: string; schedule: string;
  status: "aberta" | "em-andamento" | "encerrada"; enrolledCount: number;
  /**
   * Vêm embutidos na própria resposta de `/turmas` (o backend já inclui `disciplina`).
   * Usados por telas como `academy.attendance.tsx`/`academy.grades.tsx`, que um professor
   * acessa sem a permissão `academy.manage.acessar` — chamar `getAll()` (lista completa de
   * disciplinas) pra resolver esses campos 403ava pra professor. Evite depender de `getAll()`
   * pra exibir nome/código/carga horária de disciplina quando já se tem a turma em mãos.
   */
  disciplineName?: string; disciplineCode?: string; disciplineWorkload?: number;
};

export type Enrollment = { id: string; studentId: string; classId: string; status: string; student?: Student };

export type CalendarEvent = {
  id: string; title: string; date: string; end?: string; time?: string;
  type: "semestre" | "prova" | "feriado" | "reuniao" | "apresentacao" | "semana" | "institucional";
  audience: string; location?: string;
};

export type GradeItem = { id: string; classId: string; name: string; weight: number; max: number; origin: "manual" | "learn" };

export type AttendanceStatus = "presente" | "falta" | "atraso" | "justificado";
export type AttendanceRecord = { id?: string; studentId: string; classId: string; date: string; status: AttendanceStatus };

export type AcademyDoc = {
  id: string; name: string; kind: "Plano de ensino" | "Ementa" | "Regulamento" | "Institucional";
  disciplineId?: string; updatedAt: string; size: string; author: string;
};

// ================= Curso =================
type CursoBack = { id: string; nome: string; codigo: string; grau: Course["degree"]; ativo: boolean };
const cursoResource = mapResource<Course, CursoBack>(
  "/cursos", "curso", [],
  (b) => ({ id: b.id, name: b.nome, code: b.codigo, degree: b.grau, active: b.ativo }),
  (f) => ({
    ...(f.name !== undefined && { nome: f.name }),
    ...(f.code !== undefined && { codigo: f.code }),
    ...(f.degree !== undefined && { grau: f.degree }),
    ...(f.active !== undefined && { ativo: f.active }),
  }),
);

// ================= Período letivo =================
type PeriodoBack = { id: string; nome: string; dataInicio: string; dataFim: string; ativo: boolean };
const periodoResource = mapResource<Term, PeriodoBack>(
  "/periodos-letivos", "periodo", [],
  (b) => ({ id: b.id, name: b.nome, startDate: dateOnly(b.dataInicio), endDate: dateOnly(b.dataFim), active: b.ativo }),
  (f) => ({
    ...(f.name !== undefined && { nome: f.name }),
    ...(f.startDate !== undefined && { dataInicio: f.startDate }),
    ...(f.endDate !== undefined && { dataFim: f.endDate }),
    ...(f.active !== undefined && { ativo: f.active }),
  }),
);

// ================= Disciplina =================
type DisciplinaBack = {
  id: string; codigo: string; nome: string; descricao?: string | null; cursoId: string;
  cargaHoraria: number; status: Discipline["status"];
};
function disciplinaToFront(b: DisciplinaBack): Discipline {
  return { id: b.id, code: b.codigo, name: b.nome, description: b.descricao ?? "", courseId: b.cursoId, workload: b.cargaHoraria, status: b.status, accent: toneFor(b.id) };
}
function disciplinaToDto(f: Partial<Discipline>): Partial<DisciplinaBack> {
  return {
    ...(f.code !== undefined && { codigo: f.code }),
    ...(f.name !== undefined && { nome: f.name }),
    ...(f.description !== undefined && { descricao: f.description }),
    ...(f.courseId !== undefined && { cursoId: f.courseId }),
    ...(f.workload !== undefined && { cargaHoraria: f.workload }),
    ...(f.status !== undefined && { status: f.status }),
  };
}
const disciplinaResource = createRawResource<DisciplinaBack>("/disciplinas", "disc", []);

// ================= Professor =================
type ProfessorBack = {
  id: string; usuarioId: string; titulacao?: string | null; departamento?: string | null;
  cargaHorariaSemanal?: number | null; status: Teacher["status"];
  usuario?: { id: string; nome: string; email: string; ativo: boolean };
};
function professorToFront(b: ProfessorBack): Teacher {
  const nome = b.usuario?.nome ?? "—";
  return {
    id: b.id, usuarioId: b.usuarioId, name: nome, email: b.usuario?.email ?? "",
    title: b.titulacao ?? "", department: b.departamento ?? "", weeklyHours: b.cargaHorariaSemanal ?? 0,
    status: b.status, initials: initialsOf(nome), tone: toneFor(b.id), active: b.usuario?.ativo ?? true,
  };
}
function professorToDto(f: Partial<Teacher> & { usuarioId?: string }): Partial<ProfessorBack> {
  return {
    ...(f.usuarioId !== undefined && { usuarioId: f.usuarioId }),
    ...(f.title !== undefined && { titulacao: f.title }),
    ...(f.department !== undefined && { departamento: f.department }),
    ...(f.weeklyHours !== undefined && { cargaHorariaSemanal: f.weeklyHours }),
    ...(f.status !== undefined && { status: f.status }),
  };
}
const professorResource = createRawResource<ProfessorBack>("/professores", "prof", []);

// ================= Aluno =================
type AlunoBack = {
  id: string; usuarioId: string; ra: string; cursoId: string; semestre?: number | null; situacao: Student["status"];
  usuario?: { id: string; nome: string; email: string; ativo: boolean };
};
function alunoToFront(b: AlunoBack): Student {
  const nome = b.usuario?.nome ?? "—";
  return {
    id: b.id, usuarioId: b.usuarioId, ra: b.ra, name: nome, email: b.usuario?.email ?? "",
    initials: initialsOf(nome), courseId: b.cursoId, semester: b.semestre ?? 1, status: b.situacao,
    active: b.usuario?.ativo ?? true,
  };
}
function alunoToDto(f: Partial<Student> & { usuarioId?: string }): Partial<AlunoBack> {
  return {
    ...(f.usuarioId !== undefined && { usuarioId: f.usuarioId }),
    ...(f.ra !== undefined && { ra: f.ra }),
    ...(f.courseId !== undefined && { cursoId: f.courseId }),
    ...(f.semester !== undefined && { semestre: f.semester }),
    ...(f.status !== undefined && { situacao: f.status }),
  };
}
const alunoResource = createRawResource<AlunoBack>("/alunos", "aluno", []);

// ================= Turma =================
type TurmaBack = {
  id: string; codigo: string; disciplinaId: string; periodoLetivoId: string; professorId?: string | null;
  turno: SchoolClass["shift"]; capacidade: number; sala?: string | null; horario?: string | null;
  status: SchoolClass["status"]; _count?: { matriculas?: number };
  disciplina?: { id: string; codigo: string; nome: string; cargaHoraria: number };
};
function turmaToFront(b: TurmaBack): SchoolClass {
  return {
    id: b.id, code: b.codigo, disciplineId: b.disciplinaId, termId: b.periodoLetivoId,
    teacherId: b.professorId ?? undefined, shift: b.turno, capacity: b.capacidade,
    roomLabel: b.sala ?? "", schedule: b.horario ?? "", status: b.status,
    enrolledCount: b._count?.matriculas ?? 0,
    disciplineName: b.disciplina?.nome, disciplineCode: b.disciplina?.codigo, disciplineWorkload: b.disciplina?.cargaHoraria,
  };
}
function turmaToDto(f: Partial<SchoolClass>): Partial<TurmaBack> {
  return {
    ...(f.code !== undefined && { codigo: f.code }),
    ...(f.disciplineId !== undefined && { disciplinaId: f.disciplineId }),
    ...(f.termId !== undefined && { periodoLetivoId: f.termId }),
    ...(f.teacherId !== undefined && { professorId: f.teacherId || null }),
    ...(f.shift !== undefined && { turno: f.shift }),
    ...(f.capacity !== undefined && { capacidade: f.capacity }),
    ...(f.roomLabel !== undefined && { sala: f.roomLabel }),
    ...(f.schedule !== undefined && { horario: f.schedule }),
    ...(f.status !== undefined && { status: f.status }),
  };
}
const turmaResource = createRawResource<TurmaBack>("/turmas", "turma", []);

// ================= Matrícula =================
type MatriculaBack = { id: string; alunoId: string; turmaId: string; status: string; aluno?: AlunoBack };
function matriculaToFront(b: MatriculaBack): Enrollment {
  return { id: b.id, studentId: b.alunoId, classId: b.turmaId, status: b.status, student: b.aluno ? alunoToFront(b.aluno) : undefined };
}

// ================= Evento de calendário =================
type EventoBack = {
  id: string; titulo: string; data: string; dataFim?: string | null; horario?: string | null;
  tipo: CalendarEvent["type"]; publico?: string | null; local?: string | null;
};
const eventoResource = mapResource<CalendarEvent, EventoBack>(
  "/eventos-calendario", "evt", [],
  (b) => ({
    id: b.id, title: b.titulo, date: dateOnly(b.data), end: b.dataFim ? dateOnly(b.dataFim) : undefined,
    time: b.horario ?? undefined, type: b.tipo, audience: b.publico ?? "Todos", location: b.local ?? undefined,
  }),
  (f) => ({
    ...(f.title !== undefined && { titulo: f.title }),
    ...(f.date !== undefined && { data: f.date }),
    ...(f.end !== undefined && { dataFim: f.end || null }),
    ...(f.time !== undefined && { horario: f.time || null }),
    ...(f.type !== undefined && { tipo: f.type }),
    ...(f.audience !== undefined && { publico: f.audience }),
    ...(f.location !== undefined && { local: f.location }),
  }),
);

// ================= Item avaliativo / Nota =================
// `peso` e `notaMaxima` são Decimal no Prisma — chegam como string no JSON (ver `num()`).
type ItemAvaliativoBack = { id: string; turmaId: string; nome: string; peso: number | string; notaMaxima?: number | string | null; origem?: "manual" | "learn" };
function itemToFront(b: ItemAvaliativoBack): GradeItem {
  return { id: b.id, classId: b.turmaId, name: b.nome, weight: num(b.peso) ?? 0, max: num(b.notaMaxima) ?? 10, origin: b.origem ?? "manual" };
}

/** Um item avaliativo com as notas já lançadas de todos os alunos matriculados (chave = alunoId). */
export type GradeItemWithScores = GradeItem & { scores: Record<string, number | null> };
type NotaBack = { id: string; itemAvaliativoId: string; alunoId: string; valor: number | string | null };
type ItemAvaliativoComNotasBack = ItemAvaliativoBack & { notas: NotaBack[] };
function itemComNotasToFront(b: ItemAvaliativoComNotasBack): GradeItemWithScores {
  const scores: Record<string, number | null> = {};
  for (const n of b.notas) scores[n.alunoId] = num(n.valor);
  return { ...itemToFront(b), scores };
}

// ================= Documento acadêmico =================
type DocumentoBack = {
  id: string; nome: string; tipo: "plano-de-ensino" | "ementa" | "regulamento" | "institucional";
  disciplinaId?: string | null; autorId?: string | null; tamanho?: number; criadoEm: string;
};
const KIND_TO_TIPO: Record<AcademyDoc["kind"], DocumentoBack["tipo"]> = {
  "Plano de ensino": "plano-de-ensino", "Ementa": "ementa", "Regulamento": "regulamento", "Institucional": "institucional",
};
const TIPO_TO_KIND: Record<DocumentoBack["tipo"], AcademyDoc["kind"]> = {
  "plano-de-ensino": "Plano de ensino", ementa: "Ementa", regulamento: "Regulamento", institucional: "Institucional",
};
function fmtSize(bytes?: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${fmtNumeroLivre(bytes / 1024, 0)} KB`;
  return `${fmtNumeroLivre(bytes / 1024 / 1024, 1)} MB`;
}
function docToFront(b: DocumentoBack): AcademyDoc {
  return { id: b.id, name: b.nome, kind: TIPO_TO_KIND[b.tipo], disciplineId: b.disciplinaId ?? undefined, updatedAt: dateOnly(b.criadoEm), size: fmtSize(b.tamanho), author: "—" };
}

function qs(params: Record<string, string | undefined>) {
  const entries = Object.entries(params).filter(([, v]) => v);
  if (!entries.length) return "";
  return `?${entries.map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join("&")}`;
}

export const academyService = {
  // ---------- Disciplinas ----------
  async getAll(filters?: { cursoId?: string }): Promise<Discipline[]> {
    const rows = await request<DisciplinaBack[]>(`/disciplinas${qs({ cursoId: filters?.cursoId })}`);
    return rows.map(disciplinaToFront);
  },
  async getById(id: string): Promise<Discipline | undefined> {
    try {
      return disciplinaToFront(await disciplinaResource.get(id));
    } catch {
      return undefined;
    }
  },
  async create(dto: Omit<Discipline, "id" | "accent">): Promise<Discipline> {
    return disciplinaToFront(await disciplinaResource.create(disciplinaToDto(dto)));
  },
  async update(id: string, dto: Partial<Discipline>): Promise<Discipline | undefined> {
    return disciplinaToFront(await disciplinaResource.update(id, disciplinaToDto(dto)));
  },
  async remove(id: string): Promise<boolean> {
    await disciplinaResource.remove(id);
    return true;
  },
  async search(query: string): Promise<Discipline[]> {
    const q = query.toLowerCase();
    const all = await this.getAll();
    return all.filter((d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q));
  },

  // ---------- Cursos / Períodos letivos ----------
  async getCourses(): Promise<Course[]> {
    return cursoResource.list();
  },
  async createCourse(dto: Omit<Course, "id">): Promise<Course> {
    return cursoResource.create(dto);
  },
  async updateCourse(id: string, dto: Partial<Course>): Promise<Course | undefined> {
    return cursoResource.update(id, dto);
  },
  async getTerms(): Promise<Term[]> {
    return periodoResource.list();
  },
  async createTerm(dto: Omit<Term, "id">): Promise<Term> {
    return periodoResource.create(dto);
  },
  async updateTerm(id: string, dto: Partial<Term>): Promise<Term | undefined> {
    return periodoResource.update(id, dto);
  },
  async removeTerm(id: string): Promise<boolean> {
    await periodoResource.remove(id);
    return true;
  },

  // ---------- Turmas ----------
  async getClasses(filters?: { disciplinaId?: string; periodoLetivoId?: string; minhas?: boolean }): Promise<SchoolClass[]> {
    const rows = await request<TurmaBack[]>(`/turmas${qs({ disciplinaId: filters?.disciplinaId, periodoLetivoId: filters?.periodoLetivoId, minhas: filters?.minhas ? "true" : undefined })}`);
    return rows.map(turmaToFront);
  },
  async getClassById(id: string): Promise<SchoolClass | undefined> {
    try {
      return turmaToFront(await turmaResource.get(id));
    } catch {
      return undefined;
    }
  },
  async createClass(dto: Omit<SchoolClass, "id" | "enrolledCount">): Promise<SchoolClass> {
    return turmaToFront(await turmaResource.create(turmaToDto(dto)));
  },
  async updateClass(id: string, dto: Partial<SchoolClass>): Promise<SchoolClass | undefined> {
    return turmaToFront(await turmaResource.update(id, turmaToDto(dto)));
  },
  async removeClass(id: string): Promise<boolean> {
    await turmaResource.remove(id);
    return true;
  },

  // ---------- Professores ----------
  async getTeachers(): Promise<Teacher[]> {
    return (await professorResource.list()).map(professorToFront);
  },
  async getTeacherById(id: string): Promise<Teacher | undefined> {
    try {
      return professorToFront(await professorResource.get(id));
    } catch {
      return undefined;
    }
  },
  /** `usuarioId` deve ser um Usuario já existente no Hub — nunca cria um usuário novo aqui. */
  async createTeacher(dto: { usuarioId: string; title?: string; department?: string; weeklyHours?: number; status?: Teacher["status"] }): Promise<Teacher> {
    return professorToFront(await professorResource.create(professorToDto(dto)));
  },
  async updateTeacher(id: string, dto: Partial<Teacher>): Promise<Teacher | undefined> {
    return professorToFront(await professorResource.update(id, professorToDto(dto)));
  },
  async removeTeacher(id: string): Promise<boolean> {
    await professorResource.remove(id);
    return true;
  },

  // ---------- Alunos ----------
  async getStudents(filters?: { cursoId?: string }): Promise<Student[]> {
    const rows = await request<AlunoBack[]>(`/alunos${qs({ cursoId: filters?.cursoId })}`);
    return rows.map(alunoToFront);
  },
  async getStudentById(id: string): Promise<Student | undefined> {
    try {
      return alunoToFront(await alunoResource.get(id));
    } catch {
      return undefined;
    }
  },
  /** `usuarioId` deve ser um Usuario já existente no Hub — nunca cria um usuário novo aqui. */
  async createStudent(dto: { usuarioId: string; ra: string; courseId: string; semester?: number; status?: Student["status"] }): Promise<Student> {
    return alunoToFront(await alunoResource.create(alunoToDto(dto)));
  },
  async updateStudent(id: string, dto: Partial<Student>): Promise<Student | undefined> {
    return alunoToFront(await alunoResource.update(id, alunoToDto(dto)));
  },
  async removeStudent(id: string): Promise<boolean> {
    await alunoResource.remove(id);
    return true;
  },

  // ---------- Matrículas ----------
  async getEnrollmentsByClass(classId: string): Promise<Enrollment[]> {
    const rows = await request<MatriculaBack[]>(`/turmas/${classId}/matriculas`);
    return rows.map(matriculaToFront);
  },
  async enrollStudent(classId: string, studentId: string): Promise<Enrollment> {
    const created = await request<MatriculaBack>(`/turmas/${classId}/matriculas`, { method: "POST", body: { alunoId: studentId } });
    return matriculaToFront(created);
  },
  async unenrollStudent(matriculaId: string): Promise<boolean> {
    await request<void>(`/matriculas/${matriculaId}`, { method: "DELETE" });
    return true;
  },

  // ---------- Frequência ----------
  async getFrequencia(classId: string, date?: string): Promise<AttendanceRecord[]> {
    const rows = await request<Array<{ id: string; alunoId: string; turmaId: string; data: string; presenca: AttendanceStatus }>>(`/turmas/${classId}/frequencia${qs({ data: date })}`);
    return rows.map((r) => ({ id: r.id, studentId: r.alunoId, classId: r.turmaId, date: dateOnly(r.data), status: r.presenca }));
  },
  async registrarFrequencia(classId: string, date: string, registros: { alunoId: string; presenca: AttendanceStatus }[]): Promise<void> {
    await request(`/turmas/${classId}/frequencia`, { method: "POST", body: { data: date, registros: registros.map((r) => ({ ...r, data: date })) } });
  },

  // ---------- Itens avaliativos / Notas ----------
  async getGradeItems(classId: string): Promise<GradeItem[]> {
    const rows = await request<ItemAvaliativoBack[]>(`/turmas/${classId}/itens-avaliativos`);
    return rows.map(itemToFront);
  },
  /** Itens avaliativos da turma já com as notas de cada aluno matriculado — usado pela tela de lançamento de notas (professor/coordenador; nunca o aluno). */
  async getGradeItemsWithScores(classId: string): Promise<GradeItemWithScores[]> {
    const rows = await request<ItemAvaliativoComNotasBack[]>(`/turmas/${classId}/notas`);
    return rows.map(itemComNotasToFront);
  },
  async createGradeItem(dto: { classId: string; name: string; weight: number; max?: number }): Promise<GradeItem> {
    const created = await request<ItemAvaliativoBack>(`/turmas/${dto.classId}/itens-avaliativos`, { method: "POST", body: { nome: dto.name, peso: dto.weight, notaMaxima: dto.max } });
    return itemToFront(created);
  },
  async updateGradeItem(id: string, dto: Partial<{ name: string; weight: number; max: number }>): Promise<GradeItem> {
    const updated = await request<ItemAvaliativoBack>(`/itens-avaliativos/${id}`, { method: "PATCH", body: { ...(dto.name !== undefined && { nome: dto.name }), ...(dto.weight !== undefined && { peso: dto.weight }), ...(dto.max !== undefined && { notaMaxima: dto.max }) } });
    return itemToFront(updated);
  },
  async removeGradeItem(id: string): Promise<boolean> {
    await request<void>(`/itens-avaliativos/${id}`, { method: "DELETE" });
    return true;
  },
  async setGrade(itemId: string, studentId: string, value: number | null): Promise<void> {
    await request(`/itens-avaliativos/${itemId}/notas`, { method: "PATCH", body: { alunoId: studentId, valor: value } });
  },

  // ---------- Calendário ----------
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return eventoResource.list();
  },
  async createCalendarEvent(dto: Omit<CalendarEvent, "id">): Promise<CalendarEvent> {
    return eventoResource.create(dto);
  },
  async updateCalendarEvent(id: string, dto: Partial<CalendarEvent>): Promise<CalendarEvent | undefined> {
    return eventoResource.update(id, dto);
  },
  async removeCalendarEvent(id: string): Promise<boolean> {
    await eventoResource.remove(id);
    return true;
  },

  // ---------- Documentos ----------
  async getDocs(filters?: { disciplineId?: string }): Promise<AcademyDoc[]> {
    const rows = await request<DocumentoBack[]>(`/documentos-academicos${qs({ disciplinaId: filters?.disciplineId })}`);
    return rows.map(docToFront);
  },
  async createDoc(dto: { file: File; kind: AcademyDoc["kind"]; disciplineId?: string }): Promise<AcademyDoc> {
    const form = new FormData();
    form.append("arquivo", dto.file);
    form.append("tipo", KIND_TO_TIPO[dto.kind]);
    if (dto.disciplineId) form.append("disciplinaId", dto.disciplineId);
    const created = await uploadFile<DocumentoBack>("/documentos-academicos", form);
    return docToFront(created);
  },
  async removeDoc(id: string): Promise<boolean> {
    await request<void>(`/documentos-academicos/${id}`, { method: "DELETE" });
    return true;
  },
  async downloadDoc(id: string): Promise<Blob> {
    return requestBlob(`/documentos-academicos/${id}/arquivo`);
  },
};
