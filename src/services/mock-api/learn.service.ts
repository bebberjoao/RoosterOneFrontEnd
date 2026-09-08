// Mock service for Rooster Learn (activities, submissions, grades).
import { db } from "@/mock/database";
import type { Activity } from "@/mock/database/activities";
import type { Submission } from "@/mock/database/submissions";
import { delay, nextId, applyFilters, type Filters } from "./utils";

let activities = [...db.activities];
let submissions = [...db.submissions];

export const learnService = {
  async getAll(filters?: Filters<Activity>): Promise<Activity[]> {
    return delay(applyFilters(activities, filters));
  },
  async getById(id: string): Promise<Activity | undefined> {
    return delay(activities.find((a) => a.id === id));
  },
  async create(dto: Omit<Activity, "id" | "code">): Promise<Activity> {
    const id = nextId("act");
    const created: Activity = { ...dto, id, code: `LRN-${id}` };
    activities = [...activities, created];
    return delay(created);
  },
  async update(id: string, dto: Partial<Activity>): Promise<Activity | undefined> {
    activities = activities.map((a) => (a.id === id ? { ...a, ...dto } : a));
    return delay(activities.find((a) => a.id === id));
  },
  async remove(id: string): Promise<boolean> {
    const before = activities.length;
    activities = activities.filter((a) => a.id !== id);
    return delay(activities.length < before);
  },
  async search(query: string): Promise<Activity[]> {
    const q = query.toLowerCase();
    return delay(activities.filter((a) => a.title.toLowerCase().includes(q) || a.code.toLowerCase().includes(q)));
  },

  // Domain-specific helpers
  async getSubmissions(filters?: Filters<Submission>) {
    return delay(applyFilters(submissions, filters));
  },
  async gradeSubmission(id: string, grade: number, feedback?: string): Promise<Submission | undefined> {
    submissions = submissions.map((s) => (s.id === id ? { ...s, grade, feedback, status: "corrigida" as const } : s));
    return delay(submissions.find((s) => s.id === id));
  },
  async getByClass(classId: string) {
    return delay(activities.filter((a) => a.classId === classId));
  },
};
