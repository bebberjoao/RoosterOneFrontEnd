// Mock service for cross-module notifications.
import { db } from "@/mock/database";
import type { Notification } from "@/mock/database/notifications";
import { delay, nextId, applyFilters, type Filters } from "./utils";

let notifications = [...db.notifications];

export const notificationService = {
  async getAll(filters?: Filters<Notification>): Promise<Notification[]> {
    return delay(applyFilters(notifications, filters));
  },
  async getById(id: string): Promise<Notification | undefined> {
    return delay(notifications.find((n) => n.id === id));
  },
  async create(dto: Omit<Notification, "id">): Promise<Notification> {
    const created: Notification = { ...dto, id: nextId("notif") };
    notifications = [...notifications, created];
    return delay(created);
  },
  async update(id: string, dto: Partial<Notification>): Promise<Notification | undefined> {
    notifications = notifications.map((n) => (n.id === id ? { ...n, ...dto } : n));
    return delay(notifications.find((n) => n.id === id));
  },
  async remove(id: string): Promise<boolean> {
    const before = notifications.length;
    notifications = notifications.filter((n) => n.id !== id);
    return delay(notifications.length < before);
  },
  async search(query: string): Promise<Notification[]> {
    const q = query.toLowerCase();
    return delay(notifications.filter((n) => n.title.toLowerCase().includes(q)));
  },

  // Domain-specific helpers
  async getByUser(userId: string) {
    return delay(notifications.filter((n) => n.userId === userId));
  },
  async markAsRead(id: string): Promise<Notification | undefined> {
    notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    return delay(notifications.find((n) => n.id === id));
  },
};
