// Rooster Student — portal do aluno ligado ao backend real via os endpoints
// `/me/*` (identidade sempre resolvida no servidor a partir do JWT — nunca
// passamos um id de aluno/usuário aqui). Segue o mesmo padrão Back/Front de
// src/services/mock-api/academy.service.ts.
import { request } from "@/services/hub/client";
import { session } from "@/services/hub/session";
import { toneFor, initialsOf } from "./academy.service";

export type Situation = "aprovado" | "reprovado" | "cursando" | "reprovado-falta" | "trancado";

/** Frequência mínima institucional exigida (regra de negócio, não vem do backend). */
export const MIN_ATTENDANCE = 75;

export type StudentProfile = {
  id: string; usuarioId: string; ra: string; name: string; email: string; initials: string;
  courseId: string; courseName: string; courseCode: string; degree: string; semester: number;
  status: string; photoTone: string;
};

export type StudentDiscipline = {
  id: string; // matricula id
  classId: string; disciplineId: string; code: string; name: string; term: string; shift: string;
  teacher: string; teacherInitials: string; workload: number; schedule: string; room: string;
  attendance: number; absences: number; classesGiven: number; average: number | null;
  situation: Situation; accent: string; matriculaStatus: string;
};

export type Assessment = { id: string; classId: string; name: string; weight: number; max: number; value: number | null; origin: "manual" | "learn" };

export type ClassGrades = { classId: string; items: Assessment[]; average: number | null };

export type HistoryRow = { id: string; classId: string; term: string; code: string; name: string; workload: number; grade: number | null; attendance: number; situation: Situation };

export type StudentAttendanceStatus = "presente" | "falta" | "atraso" | "justificado";
export type StudentAttendanceRecord = { id: string; classId: string; className: string; date: string; status: StudentAttendanceStatus };

// ================= Tipos "back" =================
type CursoBack = { id: string; nome: string; codigo: string; grau: string; ativo: boolean };
type AlunoBack = { id: string; usuarioId: string; ra: string; cursoId: string; semestre: number; situacao: string; curso?: CursoBack };

type TurmaAninhadaBack = {
  id: string; codigo: string; disciplinaId: string; periodoLetivoId: string; professorId?: string | null;
  turno: string; capacidade: number; sala?: string | null; horario?: string | null; status: string;
  disciplina?: { id: string; codigo: string; nome: string; cargaHoraria: number };
  periodoLetivo?: { id: string; nome: string };
  professor?: { id: string; usuario?: { id: string; nome: string } };
};
type MatriculaBack = { id: string; alunoId: string; turmaId: string; status: string; turma: TurmaAninhadaBack };

type FrequenciaBack = { id: string; turmaId: string; alunoId: string; data: string; presenca: StudentAttendanceStatus; turma?: TurmaAninhadaBack };

type ItemComNotaBack = { id: string; turmaId: string; nome: string; peso: number | string; notaMaxima: number | string; origem?: "manual" | "learn"; nota: number | string | null };
type NotasTurmaBack = { turmaId: string; itens: ItemComNotaBack[]; media: number | string | null };

type HistoricoBack = { turma: TurmaAninhadaBack; status: string; media: number | string | null };

function num(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function situacaoFromMatricula(status: string, media: number | null): Situation {
  if (status === "concluida") return media !== null && media >= 6 ? "aprovado" : "reprovado";
  if (status === "cancelada") return "reprovado-falta";
  if (status === "trancada") return "trancado";
  return "cursando";
}

/** Agrupa registros de frequência por turma e calcula o % de presença. */
function attendanceSummary(records: FrequenciaBack[]) {
  const byClass = new Map<string, { total: number; present: number; absent: number }>();
  for (const r of records) {
    const entry = byClass.get(r.turmaId) ?? { total: 0, present: 0, absent: 0 };
    entry.total += 1;
    if (r.presenca === "presente" || r.presenca === "justificado") entry.present += 1;
    if (r.presenca === "falta") entry.absent += 1;
    byClass.set(r.turmaId, entry);
  }
  return byClass;
}

export const studentService = {
  /** `undefined` quando o usuário logado não tem vínculo de aluno (ex.: admin usando o seletor de "Visão"). */
  async getMe(): Promise<StudentProfile | undefined> {
    let aluno: AlunoBack;
    try {
      aluno = await request<AlunoBack>("/me/aluno");
    } catch {
      return undefined;
    }
    const name = session.usuario?.nome ?? "—";
    return {
      id: aluno.id, usuarioId: aluno.usuarioId, ra: aluno.ra, name, email: session.usuario?.email ?? "",
      initials: initialsOf(name), courseId: aluno.cursoId, courseName: aluno.curso?.nome ?? "—",
      courseCode: aluno.curso?.codigo ?? "", degree: aluno.curso?.grau ?? "", semester: aluno.semestre,
      status: aluno.situacao, photoTone: toneFor(aluno.id),
    };
  },

  async getMyEnrollments(): Promise<StudentDiscipline[]> {
    const [matriculas, frequencia] = await Promise.all([
      request<MatriculaBack[]>("/me/turmas"),
      request<FrequenciaBack[]>("/me/frequencia"),
    ]);
    const attendance = attendanceSummary(frequencia);
    const grades = await request<NotasTurmaBack[]>("/me/notas");
    const mediaByClass = new Map(grades.map((g) => [g.turmaId, num(g.media)]));

    return matriculas.map((m) => {
      const t = m.turma;
      const att = attendance.get(m.turmaId) ?? { total: 0, present: 0, absent: 0 };
      const average = mediaByClass.get(m.turmaId) ?? null;
      const teacherName = t.professor?.usuario?.nome ?? "—";
      return {
        id: m.id, classId: m.turmaId, disciplineId: t.disciplinaId, code: t.disciplina?.codigo ?? t.codigo, name: t.disciplina?.nome ?? t.codigo,
        term: t.periodoLetivo?.nome ?? "—", shift: t.turno,
        teacher: teacherName, teacherInitials: initialsOf(teacherName),
        workload: t.disciplina?.cargaHoraria ?? 0, schedule: t.horario ?? "", room: t.sala ?? "",
        attendance: att.total ? Math.round((att.present / att.total) * 100) : 100,
        absences: att.absent, classesGiven: att.total, average,
        situation: situacaoFromMatricula(m.status, average), accent: toneFor(m.turmaId), matriculaStatus: m.status,
      };
    });
  },

  async getMyAttendance(classId?: string): Promise<StudentAttendanceRecord[]> {
    const rows = await request<FrequenciaBack[]>(`/me/frequencia${classId ? `?turmaId=${encodeURIComponent(classId)}` : ""}`);
    return rows.map((r) => ({
      id: r.id, classId: r.turmaId, className: r.turma?.disciplina?.nome ?? r.turma?.codigo ?? "—",
      date: r.data.slice(0, 10), status: r.presenca,
    }));
  },

  async getMyGrades(classId?: string): Promise<ClassGrades[]> {
    const rows = await request<NotasTurmaBack[]>(`/me/notas${classId ? `?turmaId=${encodeURIComponent(classId)}` : ""}`);
    return rows.map((r) => ({
      classId: r.turmaId, average: num(r.media),
      items: r.itens.map((i) => ({
        id: i.id, classId: i.turmaId, name: i.nome, weight: num(i.peso) ?? 0, max: num(i.notaMaxima) ?? 10,
        value: num(i.nota), origin: i.origem ?? "manual",
      })),
    }));
  },

  async getMyHistory(): Promise<HistoryRow[]> {
    const [rows, frequencia] = await Promise.all([
      request<HistoricoBack[]>("/me/historico"),
      request<FrequenciaBack[]>("/me/frequencia"),
    ]);
    const attendance = attendanceSummary(frequencia);
    return rows.map((r, idx) => {
      const t = r.turma;
      const att = attendance.get(t.id) ?? { total: 0, present: 0, absent: 0 };
      const media = num(r.media);
      return {
        id: `${t.id}-${idx}`, classId: t.id, term: t.periodoLetivo?.nome ?? "—",
        code: t.disciplina?.codigo ?? t.codigo, name: t.disciplina?.nome ?? t.codigo,
        workload: t.disciplina?.cargaHoraria ?? 0, grade: media,
        attendance: att.total ? Math.round((att.present / att.total) * 100) : 100,
        situation: situacaoFromMatricula(r.status, media),
      };
    });
  },
};

// ---------- Helpers de agregação (puros — usados pelas telas) ----------
export function overallAverage(disciplines: StudentDiscipline[]): number | null {
  const withAvg = disciplines.filter((d) => d.average !== null);
  if (!withAvg.length) return null;
  return withAvg.reduce((s, d) => s + (d.average as number), 0) / withAvg.length;
}
export function overallAttendance(disciplines: StudentDiscipline[]): number {
  if (!disciplines.length) return 100;
  return disciplines.reduce((s, d) => s + d.attendance, 0) / disciplines.length;
}
/** Coeficiente de rendimento ponderado pela carga horária das disciplinas já concluídas. */
export function computeCR(history: HistoryRow[]): number | null {
  const done = history.filter((h) => h.grade !== null);
  if (!done.length) return null;
  const w = done.reduce((s, h) => s + h.workload, 0);
  if (!w) return null;
  return done.reduce((s, h) => s + (h.grade as number) * h.workload, 0) / w;
}
export function totalHoursDone(history: HistoryRow[]): number {
  return history.filter((h) => h.situation === "aprovado").reduce((s, h) => s + h.workload, 0);
}
export function money(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
