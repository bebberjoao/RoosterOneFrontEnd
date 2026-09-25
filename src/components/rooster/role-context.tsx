import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { session } from "@/services/hub/session";

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
  { label: string; short: string; tone: string }
> = {
  admin: { label: "Administrador", short: "Admin", tone: "oklch(0.55 0.19 265)" },
  professor: { label: "Professor", short: "Professor", tone: "oklch(0.6 0.2 305)" },
  coordenador: { label: "Coordenador", short: "Coord.", tone: "oklch(0.68 0.14 195)" },
  aluno: { label: "Aluno", short: "Aluno", tone: "oklch(0.68 0.18 40)" },
  financeiro: { label: "Financeiro", short: "Financeiro", tone: "oklch(0.62 0.18 155)" },
  tecnico: { label: "Técnico de TI", short: "Técnico", tone: "oklch(0.65 0.18 25)" },
  institucional: { label: "Usuário institucional", short: "Institucional", tone: "oklch(0.55 0.1 260)" },
};

export const ROLES: Role[] = ["admin", "professor", "coordenador", "aluno", "financeiro", "tecnico", "institucional"];

type Ctx = { role: Role };
const RoleCtx = createContext<Ctx | null>(null);

/** Perfil de interface deduzido das permissões reais do usuário logado — não há mais troca manual de "visão". */
export function deriveRole(granted: ReadonlySet<string>): Role {
  if (granted.has("hub.acessos.gerenciar-permissoes")) return "admin";
  if (granted.has("finance.dashboard.acessar")) return "financeiro";
  if (granted.has("student.dashboard.acessar")) return "aluno";
  if (granted.has("academy.manage.acessar")) return "coordenador";
  if (granted.has("academy.dashboard.acessar")) return "professor";
  if (granted.has("desk.tickets.encerrar") || granted.has("assets.inventory.movimentar")) return "tecnico";
  return "institucional";
}

export function RoleProvider({ children }: { children: ReactNode }) {
  const [permissoes, setPermissoes] = useState<string[]>(() => session.permissoes);

  useEffect(() => {
    const sync = () => setPermissoes([...session.permissoes]);
    sync();
    const unsubscribe = session.subscribe(sync);
    return () => { unsubscribe(); };
  }, []);

  const role = useMemo(() => deriveRole(new Set(permissoes)), [permissoes]);
  return <RoleCtx.Provider value={{ role }}>{children}</RoleCtx.Provider>;
}

export function useRole() {
  const ctx = useContext(RoleCtx);
  return ctx ?? { role: "institucional" as Role };
}

export type CurrentPerson = { name: string; initials: string; caption: string };

/** Quem está realmente logado (nome do JWT/sessão), com iniciais e o rótulo do perfil deduzido. */
export function useCurrentPerson(): CurrentPerson {
  const { role } = useRole();
  const [nome, setNome] = useState<string | null>(() => session.usuario?.nome ?? null);
  useEffect(() => {
    const sync = () => setNome(session.usuario?.nome ?? null);
    sync();
    const unsubscribe = session.subscribe(sync);
    return () => { unsubscribe(); };
  }, []);
  const name = nome ?? "Usuário";
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "U";
  return { name, initials, caption: ROLE_META[role].label };
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