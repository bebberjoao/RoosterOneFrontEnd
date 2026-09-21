import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Role =
  | "admin"
  | "professor"
  | "coordenador"
  | "aluno"
  | "financeiro"
  | "tecnico"
  | "institucional";

export const ROLE_META: Record<
  Role,
  { label: string; short: string; tone: string; person: { name: string; initials: string; caption: string } }
> = {
  admin: { label: "Administrador", short: "Admin", tone: "oklch(0.55 0.19 265)", person: { name: "Marina Ribeiro", initials: "MR", caption: "Administradora" } },
  professor: { label: "Professor", short: "Professor", tone: "oklch(0.6 0.2 305)", person: { name: "Helena Duarte", initials: "HD", caption: "Prof. de Letras" } },
  coordenador: { label: "Coordenador", short: "Coord.", tone: "oklch(0.68 0.14 195)", person: { name: "Camila Souza", initials: "CS", caption: "Coord. Acadêmica" } },
  aluno: { label: "Aluno", short: "Aluno", tone: "oklch(0.68 0.18 40)", person: { name: "Ana Prado", initials: "AP", caption: "Engenharia · 3º sem" } },
  financeiro: { label: "Financeiro", short: "Financeiro", tone: "oklch(0.62 0.18 155)", person: { name: "Fábio Nogueira", initials: "FN", caption: "Financeiro" } },
  tecnico: { label: "Técnico de TI", short: "Técnico", tone: "oklch(0.65 0.18 25)", person: { name: "Bruno Alves", initials: "BA", caption: "Suporte TI" } },
  institucional: { label: "Usuário institucional", short: "Institucional", tone: "oklch(0.55 0.1 260)", person: { name: "Júlia Castro", initials: "JC", caption: "Extensão" } },
};

export const ROLES: Role[] = ["admin", "professor", "coordenador", "aluno", "financeiro", "tecnico", "institucional"];

type Ctx = { role: Role; setRole: (r: Role) => void };
const RoleCtx = createContext<Ctx | null>(null);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<Role>("admin");

  useEffect(() => {
    try {
      const saved = typeof window !== "undefined" ? window.localStorage.getItem("rooster.role") : null;
      if (saved && (ROLES as string[]).includes(saved)) setRoleState(saved as Role);
    } catch {}
  }, []);

  const setRole = (r: Role) => {
    setRoleState(r);
    try { window.localStorage.setItem("rooster.role", r); } catch {}
  };

  return <RoleCtx.Provider value={{ role, setRole }}>{children}</RoleCtx.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleCtx);
  if (!ctx) return { role: "admin" as Role, setRole: () => {} };
  return ctx;
}

// Learn module permissions
export type LearnPerm =
  | "createActivity"
  | "gradeActivity"
  | "manageQuestions"
  | "manageClasses"
  | "viewAllGrades"
  | "viewReports"
  | "submitActivity";

export function learnCan(role: Role, perm: LearnPerm): boolean {
  const M: Record<Role, LearnPerm[]> = {
    admin: ["createActivity", "gradeActivity", "manageQuestions", "manageClasses", "viewAllGrades", "viewReports", "submitActivity"],
    professor: ["createActivity", "gradeActivity", "manageQuestions", "manageClasses", "viewAllGrades", "viewReports"],
    // Coordenação tem acesso amplo ao Learn no backend (`academyCoordenadorKeys` em
    // prisma/seed-dev.ts inclui `learn.classes.gerenciar-turmas`/`criar-atividade`/`corrigir`) —
    // precisa das mesmas permissões de gestão do professor, senão a tela de atividades
    // barra a coordenação mesmo o backend autorizando.
    coordenador: ["createActivity", "gradeActivity", "manageQuestions", "manageClasses", "viewAllGrades", "viewReports"],
    aluno: ["submitActivity"],
    financeiro: [],
    tecnico: [],
    institucional: [],
  };
  return M[role].includes(perm);
}

export function learnHasAccess(role: Role): boolean {
  return role !== "financeiro" && role !== "institucional";
}