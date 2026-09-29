import type { Role } from "@/components/rooster/role-context";

export type FinancePerm =
  | "viewDashboard"
  | "manageCharges"
  | "manageProducts"
  | "manageServices"
  | "manageNfe"
  | "manageDiscounts"
  | "managePolicies"
  | "viewReports"
  | "manageSettings"
  | "viewOwnFinance";

const MATRIX: Record<Role, FinancePerm[]> = {
  admin: ["viewDashboard", "manageCharges", "manageProducts", "manageServices", "manageNfe", "manageDiscounts", "managePolicies", "viewReports", "manageSettings", "viewOwnFinance"],
  financeiro: ["viewDashboard", "manageCharges", "manageProducts", "manageServices", "manageNfe", "manageDiscounts", "managePolicies", "viewReports", "manageSettings"],
  coordenador: ["viewDashboard", "viewReports"],
  aluno: ["viewOwnFinance"],
  institucional: ["viewOwnFinance"],
  professor: [],
  tecnico: [],
};

export function financeCan(role: Role, perm: FinancePerm): boolean {
  return MATRIX[role].includes(perm);
}

export function financeHasAccess(role: Role): boolean {
  return MATRIX[role].length > 0;
}