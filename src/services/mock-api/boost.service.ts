// Mock service for Rooster Boost (corporate courses/certificates).
import { db } from "@/mock/database";
import type { BoostCourse } from "@/mock/database/boostCourses";
import type { Certificate } from "@/mock/database/certificates";
import { delay, nextId, applyFilters, type Filters } from "./utils";

let boostCourses = [...db.boostCourses];
let certificates = [...db.certificates];

export const boostService = {
  async getAll(filters?: Filters<BoostCourse>): Promise<BoostCourse[]> {
    return delay(applyFilters(boostCourses, filters));
  },
  async getById(id: string): Promise<BoostCourse | undefined> {
    return delay(boostCourses.find((c) => c.id === id));
  },
  async create(dto: Omit<BoostCourse, "id" | "slug">): Promise<BoostCourse> {
    const id = nextId("bcourse");
    const created: BoostCourse = { ...dto, id, slug: id };
    boostCourses = [...boostCourses, created];
    return delay(created);
  },
  async update(id: string, dto: Partial<BoostCourse>): Promise<BoostCourse | undefined> {
    boostCourses = boostCourses.map((c) => (c.id === id ? { ...c, ...dto } : c));
    return delay(boostCourses.find((c) => c.id === id));
  },
  async remove(id: string): Promise<boolean> {
    const before = boostCourses.length;
    boostCourses = boostCourses.filter((c) => c.id !== id);
    return delay(boostCourses.length < before);
  },
  async search(query: string): Promise<BoostCourse[]> {
    const q = query.toLowerCase();
    return delay(boostCourses.filter((c) => c.title.toLowerCase().includes(q)));
  },

  // Domain-specific helpers
  async getCertificates(filters?: Filters<Certificate>) {
    return delay(applyFilters(certificates, filters));
  },
  async issueCertificate(dto: Omit<Certificate, "id" | "code">): Promise<Certificate> {
    const id = nextId("cert");
    const created: Certificate = { ...dto, id, code: `RB-${id}` };
    certificates = [...certificates, created];
    return delay(created);
  },
};
