// Mock service for identity/users (used across modules for auth-like lookups).
import { db } from "@/mock/database";
import type { User } from "@/mock/database/users";
import { delay, nextId, applyFilters, type Filters } from "./utils";

let users = [...db.users];

export const userService = {
  async getAll(filters?: Filters<User>): Promise<User[]> {
    return delay(applyFilters(users, filters));
  },
  async getById(id: string): Promise<User | undefined> {
    return delay(users.find((u) => u.id === id));
  },
  async create(dto: Omit<User, "id">): Promise<User> {
    const created: User = { ...dto, id: nextId("user") };
    users = [...users, created];
    return delay(created);
  },
  async update(id: string, dto: Partial<User>): Promise<User | undefined> {
    users = users.map((u) => (u.id === id ? { ...u, ...dto } : u));
    return delay(users.find((u) => u.id === id));
  },
  async remove(id: string): Promise<boolean> {
    const before = users.length;
    users = users.filter((u) => u.id !== id);
    return delay(users.length < before);
  },
  async search(query: string): Promise<User[]> {
    const q = query.toLowerCase();
    return delay(users.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)));
  },

  // Domain-specific helpers
  async getByEmail(email: string) {
    return delay(users.find((u) => u.email === email));
  },
};
