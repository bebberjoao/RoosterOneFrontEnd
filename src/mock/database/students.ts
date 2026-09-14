// Table: students — array owned here (seed source of truth), enriched with finance scholarship info.
// src/components/rooster/academy/mock-data.ts re-exports STUDENTS from this file for compatibility.
import type { Student as SrcStudent } from "@/components/rooster/academy/mock-data";
import { financeStudents } from "./financeStudents";

export type Student = SrcStudent & { userId: string; scholarship?: string };

const NAMES = [
  "Ana Prado","Bruno Costa","Carla Vieira","Daniel Souza","Elisa Ramos","Felipe Braga",
  "Gabriela Reis","Henrique Lopes","Isabela Rocha","João Neves","Karen Souza","Lucas Andrade",
  "Marina Freitas","Nicolas Vieira","Olivia Mota","Pedro Amaral","Quéren Lira","Rafael Sales",
  "Sabrina Melo","Thiago Nunes","Ursula Gomes","Vinícius Faria","Yasmin Duarte","Zeca Barbosa",
  "Bianca Peixoto","Caio Ferreira","Diana Barros","Eduardo Sant’Anna","Fernanda Alves","Gustavo Lima",
];

function ini(name: string) {
  const parts = name.split(" ");
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

/** Mirrors the COURSES ids/order defined in ./disciplines.ts, used only to distribute students. */
const COURSE_IDS = ["c-eng", "c-adm", "c-let", "c-dir", "c-med", "c-pos-edu"];

const STUDENTS_SEED: SrcStudent[] = NAMES.map((n, i) => ({
  id: `s${i + 1}`,
  ra: `2024${(1000 + i).toString()}`,
  name: n,
  initials: ini(n),
  email: `${n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/['’]/g, "").replace(/\s+/g, ".")}@modelo.edu`,
  courseId: COURSE_IDS[i % COURSE_IDS.length],
  semester: (i % 8) + 1,
}));

const scholarshipByName = new Map(financeStudents.map((s) => [s.name, s.scholarship]));

export const students: Student[] = STUDENTS_SEED.map((s) => ({
  ...s,
  userId: `user-${s.id}`,
  scholarship: scholarshipByName.get(s.name),
}));

export const studentById = (id: string) => students.find((s) => s.id === id);
export const studentsByCourse = (courseId: string) => students.filter((s) => s.courseId === courseId);
