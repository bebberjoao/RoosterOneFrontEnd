// Table: roles — simulates a `roles` table in the relational DB.
export interface Role {
  id: string;
  name: string;
  description: string;
}

export const roles: Role[] = [
  { id: "role-admin", name: "Administrador", description: "Acesso total à plataforma." },
  { id: "role-coordenador", name: "Coordenador", description: "Gestão acadêmica de curso/setor." },
  { id: "role-professor", name: "Professor", description: "Docente responsável por turmas e disciplinas." },
  { id: "role-aluno", name: "Aluno", description: "Estudante matriculado." },
  { id: "role-financeiro", name: "Financeiro", description: "Time financeiro/cobranças." },
  { id: "role-suporte", name: "Suporte", description: "Atendimento de chamados (Rooster Desk)." },
  { id: "role-gestor-espacos", name: "Gestor de Espaços", description: "Gestão de campi, blocos e salas." },
  { id: "role-gestor-ativos", name: "Gestor de Ativos", description: "Gestão de patrimônio (Rooster Assets)." },
];

export const roleById = (id: string) => roles.find((r) => r.id === id);
export const ROLES = roles;
