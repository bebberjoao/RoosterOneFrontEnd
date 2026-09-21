import type { Role } from "../role-context";

export type AcademyPerm =
  | "viewDashboard"
  | "manageDisciplines"
  | "manageClasses"
  | "manageTeachers"
  | "manageStudents"
  | "manageEnrollments"
  | "manageCalendar"
  | "launchAttendance"
  | "launchContents"
  | "launchGrades"
  | "viewPerformance"
  | "manageTerms"
  | "manageDocuments";

const MATRIX: Record<Role, AcademyPerm[]> = {
  admin: [
    "viewDashboard","manageDisciplines","manageClasses","manageTeachers","manageStudents","manageEnrollments",
    "manageCalendar","launchAttendance","launchContents","launchGrades","viewPerformance",
    "manageTerms","manageDocuments",
  ],
  coordenador: [
    "viewDashboard","manageDisciplines","manageClasses","manageTeachers","manageStudents","manageEnrollments",
    "manageCalendar","launchGrades","viewPerformance","manageTerms","manageDocuments",
  ],
  // Professor NÃO tem "manageClasses"/"manageCalendar" — a criação/edição de turmas e
  // eventos do calendário é exclusiva de coordenação/admin no backend
  // (`academyProfessorKeys` em prisma/seed-dev.ts não inclui `academy.manage.gerenciar-turmas`/
  // `gerenciar-calendario`). Mostrar esses botões pro professor faria a API sempre recusar com 403.
  professor: [
    "viewDashboard","launchAttendance","launchContents","launchGrades",
  ],
  aluno: [],
  financeiro: [],
  tecnico: [],
  institucional: [],
};

export function academyCan(role: Role, perm: AcademyPerm): boolean {
  return MATRIX[role].includes(perm);
}

export function academyHasAccess(role: Role): boolean {
  return MATRIX[role].length > 0;
}