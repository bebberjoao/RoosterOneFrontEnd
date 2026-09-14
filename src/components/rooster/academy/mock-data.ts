// Mock data for Rooster Academy

export type Term = {
  id: string;
  name: string; // 2025.1
  startDate: string;
  endDate: string;
  active: boolean;
};

export type Course = {
  id: string;
  name: string;
  code: string;
  degree: "Graduação" | "Pós-graduação" | "Técnico" | "Extensão";
};

export type Teacher = {
  id: string;
  name: string;
  initials: string;
  email: string;
  title: string; // Prof. Dr.
  department: string;
  weeklyHours: number;
  status: "ativo" | "afastado" | "inativo";
  tone: string;
};

export type Discipline = {
  id: string;
  code: string;
  name: string;
  description: string;
  courseId: string;
  termId: string;
  teacherId: string;
  workload: number; // horas
  status: "ativa" | "arquivada" | "inativa";
  accent: string;
};

export type Student = {
  id: string;
  ra: string;
  name: string;
  initials: string;
  email: string;
  courseId: string;
  semester: number;
};

export type Klass = {
  id: string;
  code: string;
  disciplineId: string;
  termId: string;
  shift: "Matutino" | "Vespertino" | "Noturno";
  capacity: number;
  teacherId: string;
  roomId: string; // reference to Rooms module (label only)
  schedule: string; // ex: Seg/Qua 19:00-22:30
  studentIds: string[];
  status: "aberta" | "em-andamento" | "encerrada";
};

export type CalendarEvent = {
  id: string;
  title: string;
  date: string; // ISO YYYY-MM-DD
  end?: string;
  time?: string; // HH:MM-HH:MM
  type: "semestre" | "prova" | "feriado" | "reuniao" | "apresentacao" | "semana" | "institucional";
  audience: string;
  location?: string;
};

export type AttendanceMark = "P" | "F" | "A" | "J"; // presente, falta, atraso, justificado

export type LessonContent = {
  id: string;
  klassId: string;
  date: string;
  title: string;
  summary: string;
  materials: { name: string; kind: "pdf" | "link" | "video" | "slide" }[];
  notes?: string;
};

export type GradeItem = {
  id: string;
  klassId: string;
  name: string; // Avaliação 1
  weight: number; // 0..1
  origin: "manual" | "learn";
  max: number; // default 10
};

export type StudentGrade = {
  studentId: string;
  itemId: string;
  value: number | null;
};

export type AcademyDoc = {
  id: string;
  name: string;
  kind: "Plano de ensino" | "Ementa" | "Regulamento" | "Institucional";
  disciplineId?: string;
  updatedAt: string;
  size: string;
  author: string;
};

// ---------- Helpers ----------
export const isoOf = (d: Date) => d.toISOString().slice(0, 10);
export const today = isoOf(new Date());
const shift = (n: number) => { const d = new Date(); d.setDate(d.getDate() + n); return isoOf(d); };
export const formatDate = (iso: string) =>
  new Date(iso + "T00:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });

// ---------- Seeds ----------
// Fonte única: os arrays vivem em src/mock/database/*. Aqui só re-exportamos
// com os nomes históricos usados pelas telas do Academy.
import { terms, courses, disciplines } from "@/mock/database/disciplines";
import { classesSeed } from "@/mock/database/classes";
import { calendarEvents } from "@/mock/database/calendarEvents";
import { gradeItemsSeed, studentGradesSeed } from "@/mock/database/grades";
import { academyDocs } from "@/mock/database/academyDocs";
import { teachers } from "@/mock/database/teachers";
import { students } from "@/mock/database/students";

export const TERMS = terms;
export const COURSES = courses;
export const DISCIPLINES = disciplines;
export const KLASSES = classesSeed;
export const EVENTS = calendarEvents;
export const GRADE_ITEMS = gradeItemsSeed;
export const STUDENT_GRADES = studentGradesSeed;
export const DOCS = academyDocs;
export const TEACHERS = teachers;
export const STUDENTS = students;

// deterministic pseudo-random helper usado nos cálculos simulados
const rnd = (seed: number) => { const x = Math.sin(seed) * 10000; return x - Math.floor(x); };


export const CONTENTS: LessonContent[] = [
  { id: "lc1", klassId: "k1", date: shift(-2), title: "Padrões de projeto — parte 1", summary: "Introdução aos padrões GoF: Singleton, Factory, Strategy.", materials: [{ name: "Slides - GoF", kind: "slide" }, { name: "Refactoring Guru", kind: "link" }] },
  { id: "lc2", klassId: "k1", date: shift(-9), title: "Arquitetura em camadas", summary: "Camadas, responsabilidades e organização do código.", materials: [{ name: "Handout.pdf", kind: "pdf" }] },
  { id: "lc3", klassId: "k2", date: shift(-1), title: "Árvores balanceadas", summary: "AVL e rotações. Exercícios em sala.", materials: [{ name: "Exercícios AVL.pdf", kind: "pdf" }] },
  { id: "lc4", klassId: "k3", date: shift(-3), title: "Regressão linear", summary: "Fundamentos e prática com scikit-learn.", materials: [{ name: "Notebook Colab", kind: "link" }, { name: "Aula gravada", kind: "video" }] },
  { id: "lc5", klassId: "k6", date: shift(-4), title: "Machado de Assis", summary: "Contexto histórico e obras principais.", materials: [{ name: "PDF antologia", kind: "pdf" }] },
];

// ---------- Lookups ----------
export const disciplineById = (id: string) => DISCIPLINES.find((d) => d.id === id);
export const teacherById = (id: string) => TEACHERS.find((t) => t.id === id);
export const courseById = (id: string) => COURSES.find((c) => c.id === id);
export const termById = (id: string) => TERMS.find((t) => t.id === id);
export const klassById = (id: string) => KLASSES.find((k) => k.id === id);
export const studentById = (id: string) => STUDENTS.find((s) => s.id === id);

export const EVENT_TONE: Record<CalendarEvent["type"], string> = {
  semestre: "oklch(0.55 0.19 265)",
  prova: "oklch(0.65 0.18 25)",
  feriado: "oklch(0.62 0.18 155)",
  reuniao: "oklch(0.6 0.2 305)",
  apresentacao: "oklch(0.68 0.18 40)",
  semana: "oklch(0.68 0.14 195)",
  institucional: "oklch(0.55 0.1 260)",
};

export const EVENT_LABEL: Record<CalendarEvent["type"], string> = {
  semestre: "Semestre",
  prova: "Prova",
  feriado: "Feriado",
  reuniao: "Reunião",
  apresentacao: "Apresentação",
  semana: "Semana acadêmica",
  institucional: "Institucional",
};

// simulate attendance percentage per student in a class (deterministic)
export function studentAttendance(studentId: string, klassId: string) {
  const seed = (studentId.charCodeAt(1) || 1) * (klassId.charCodeAt(1) || 1);
  const pct = 70 + Math.floor(rnd(seed) * 30);
  return pct;
}

export function computeAverage(studentId: string) {
  const items = GRADE_ITEMS;
  let sum = 0; let wsum = 0;
  items.forEach((gi) => {
    const g = STUDENT_GRADES.find((sg) => sg.studentId === studentId && sg.itemId === gi.id);
    if (g?.value != null) { sum += g.value * gi.weight; wsum += gi.weight; }
  });
  if (wsum === 0) return null;
  return +(sum / wsum * (Object.values(items).length ? 1 : 1)).toFixed(1);
}