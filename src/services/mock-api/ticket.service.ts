// Mock service for Rooster Desk (helpdesk tickets).
import { db } from "@/mock/database";
import type { Ticket } from "@/mock/database/tickets";
import { delay, nextId, applyFilters, type Filters } from "./utils";

let tickets = [...db.tickets];
const ticketCategories = [...db.ticketCategories];

export const ticketService = {
  async getAll(filters?: Filters<Ticket>): Promise<Ticket[]> {
    return delay(applyFilters(tickets, filters));
  },
  async getById(id: string): Promise<Ticket | undefined> {
    return delay(tickets.find((t) => t.id === id));
  },
  async create(dto: Omit<Ticket, "id" | "number" | "events">): Promise<Ticket> {
    const id = nextId("tk");
    const created: Ticket = { ...dto, id, number: `#${id}`, events: [] };
    tickets = [...tickets, created];
    return delay(created);
  },
  async update(id: string, dto: Partial<Ticket>): Promise<Ticket | undefined> {
    tickets = tickets.map((t) => (t.id === id ? { ...t, ...dto } : t));
    return delay(tickets.find((t) => t.id === id));
  },
  async remove(id: string): Promise<boolean> {
    const before = tickets.length;
    tickets = tickets.filter((t) => t.id !== id);
    return delay(tickets.length < before);
  },
  async search(query: string): Promise<Ticket[]> {
    const q = query.toLowerCase();
    return delay(tickets.filter((t) => t.title.toLowerCase().includes(q) || t.number.includes(q)));
  },

  // Domain-specific helpers
  async getCategories() {
    return delay(ticketCategories);
  },
  async getByCategory(categoryId: string) {
    return delay(tickets.filter((t) => t.categoryId === categoryId));
  },
};
