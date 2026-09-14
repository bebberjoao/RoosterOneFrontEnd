export type CourseLevel = "iniciante" | "intermediario" | "avancado";
export type CourseStatus = "publicado" | "rascunho" | "revisao" | "arquivado";
export type ContentType =
  | "texto"
  | "video-upload"
  | "youtube"
  | "vimeo"
  | "pdf"
  | "doc"
  | "slide"
  | "planilha"
  | "imagem"
  | "audio"
  | "link"
  | "codigo"
  | "download";

export type Instructor = { id: string; name: string; role: string; avatar: string };

export type Lesson = {
  id: string;
  title: string;
  duration: string;
  blocks: { type: ContentType; label: string }[];
  hasQuiz?: boolean;
};

export type Module = {
  id: string;
  title: string;
  summary: string;
  lessons: Lesson[];
};

export type Course = {
  id: string;
  slug: string;
  title: string;
  category: string;
  categoryColor: string;
  cover: string;
  instructor: Instructor;
  description: string;
  objectives: string[];
  prerequisites: string[];
  audience: string;
  workload: string;
  lessonsCount: number;
  students: number;
  rating: number;
  reviews: number;
  level: CourseLevel;
  status: CourseStatus;
  certificate: boolean;
  price: "gratuito" | "restrito";
  publishedAt: string;
  tags: string[];
  modules: Module[];
  completionRate: number;
};

export type VideoAsset = {
  id: string;
  title: string;
  description: string;
  duration: string;
  author: string;
  category: string;
  thumb: string;
  size: string;
  usedIn: number;
  uploadedAt: string;
};

export type Certificate = {
  id: string;
  code: string;
  student: string;
  course: string;
  workload: string;
  issuedAt: string;
  status: "emitido" | "pendente" | "revogado";
};

export type Enrollment = {
  id: string;
  student: string;
  studentSector: string;
  course: string;
  progress: number;
  lastAccess: string;
  status: "ativo" | "concluido" | "atrasado" | "cancelado";
  grade: number | null;
};

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

export const STATUS_LABEL: Record<CourseStatus, string> = {
  publicado: "Publicado",
  rascunho: "Rascunho",
  revisao: "Em revisão",
  arquivado: "Arquivado",
};

export const STATUS_TONE: Record<CourseStatus, string> = {
  publicado: "oklch(0.62 0.18 155)",
  rascunho: "oklch(0.6 0.02 260)",
  revisao: "oklch(0.72 0.14 90)",
  arquivado: "oklch(0.55 0.02 260)",
};

// Fonte única: os arrays de seed vivem em src/mock/database/*.ts.
import { boostCategories } from "@/mock/database/boostCategories";
import { instructors } from "@/mock/database/instructors";
import { boostCourses } from "@/mock/database/boostCourses";
import { videos } from "@/mock/database/videos";
import { certificates } from "@/mock/database/certificates";
import { boostEnrollments } from "@/mock/database/boostEnrollments";

export const CATEGORIES: { id: string; name: string; color: string }[] = boostCategories;
export const INSTRUCTORS: Instructor[] = instructors;
export const COURSES: Course[] = boostCourses;
export const VIDEOS: VideoAsset[] = videos;
export const CERTIFICATES: Certificate[] = certificates;
export const ENROLLMENTS: Enrollment[] = boostEnrollments;

export const ENROLLMENTS_PER_MONTH = [
  { m: "Jan", v: 42 },
  { m: "Fev", v: 61 },
  { m: "Mar", v: 88 },
  { m: "Abr", v: 74 },
  { m: "Mai", v: 112 },
  { m: "Jun", v: 138 },
  { m: "Jul", v: 156 },
];

export const AVG_COMPLETION_TIME = [
  { m: "Fev", h: 22 },
  { m: "Mar", h: 19 },
  { m: "Abr", h: 18 },
  { m: "Mai", h: 16 },
  { m: "Jun", h: 14 },
  { m: "Jul", h: 13 },
];

export function categoryName(id: string) {
  return CATEGORIES.find((c) => c.id === id)?.name ?? id;
}
export function categoryColor(id: string) {
  return CATEGORIES.find((c) => c.id === id)?.color ?? "oklch(0.6 0.02 260)";
}

export function formatDate(iso: string) {
  if (!iso || iso === "—") return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}
