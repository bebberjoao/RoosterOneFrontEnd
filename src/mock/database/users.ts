// Table: users — synthesized from teachers + students, the canonical identity table (`userId` FK target).
import { teachers } from "./teachers";
import { students } from "./students";

export interface User {
  id: string;
  name: string;
  email: string;
  active: boolean;
}

export const users: User[] = [
  ...teachers.map((t) => ({ id: t.userId, name: t.name, email: t.email, active: t.status === "ativo" })),
  ...students.map((s) => ({ id: s.userId, name: s.name, email: s.email, active: true })),
];

export const userById = (id: string) => users.find((u) => u.id === id);
export const userByEmail = (email: string) => users.find((u) => u.email === email);
