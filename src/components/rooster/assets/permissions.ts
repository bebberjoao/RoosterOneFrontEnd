import type { Role } from "../role-context";

export type AssetsPerm = "view" | "create" | "edit" | "delete" | "move" | "manageCategories";

const MATRIX: Record<Role, AssetsPerm[]> = {
  admin: ["view", "create", "edit", "delete", "move", "manageCategories"],
  tecnico: ["view", "create", "edit", "move", "manageCategories"],
  coordenador: ["view"],
  institucional: ["view"],
  financeiro: ["view"],
  professor: [],
  aluno: [],
};

export function assetsCan(role: Role, perm: AssetsPerm): boolean {
  return MATRIX[role].includes(perm);
}

export function assetsHasAccess(role: Role): boolean {
  return MATRIX[role].length > 0;
}
