import type { Role } from "../role-context";

export type AcademyPerm =
  | "viewDashboard"
  | "manageDisciplines"
  | "manageClasses"
  | "manageTeachers"
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
    "viewDashboard","manageDisciplines","manageClasses","manageTeachers","manageEnrollments",
    "manageCalendar","launchAttendance","launchContents","launchGrades","viewPerformance",
    "manageTerms","manageDocuments",
  ],
  coordenador: [
    "viewDashboard","manageDisciplines","manageClasses","manageTeachers","manageEnrollments",
    "manageCalendar","launchGrades","viewPerformance","manageTerms","manageDocuments",
  ],
  professor: [
    "viewDashboard","manageClasses","launchAttendance","launchContents","launchGrades","manageCalendar",
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