// Table: enrollments — derived from classes.studentIds (academy). Composite relation studentId <-> classId.
import { classes } from "./classes";

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  disciplineId: string;
  status: "aberta" | "em-andamento" | "encerrada";
}

export const enrollments: Enrollment[] = classes.flatMap((k) =>
  k.studentIds.map((studentId) => ({
    id: `enr-${k.id}-${studentId}`,
    studentId,
    classId: k.id,
    disciplineId: k.disciplineId,
    status: k.status,
  })),
);

export const enrollmentsByStudent = (studentId: string) => enrollments.filter((e) => e.studentId === studentId);
export const enrollmentsByClass = (classId: string) => enrollments.filter((e) => e.classId === classId);
