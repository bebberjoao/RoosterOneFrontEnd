// Mock service for the Student Portal (Rooster Student).
import { db } from "@/mock/database";
import type { Student } from "@/mock/database/students";
import { delay, nextId, applyFilters, type Filters } from "./utils";

let students = [...db.students];

export const studentService = {
  async getAll(filters?: Filters<Student>): Promise<Student[]> {
    return delay(applyFilters(students, filters));
  },
  async getById(id: string): Promise<Student | undefined> {
    return delay(students.find((s) => s.id === id));
  },
  async create(dto: Omit<Student, "id" | "userId">): Promise<Student> {
    const id = nextId("stu");
    const created: Student = { ...dto, id, userId: `user-${id}` };
    students = [...students, created];
    return delay(created);
  },
  async update(id: string, dto: Partial<Student>): Promise<Student | undefined> {
    students = students.map((s) => (s.id === id ? { ...s, ...dto } : s));
    return delay(students.find((s) => s.id === id));
  },
  async remove(id: string): Promise<boolean> {
    const before = students.length;
    students = students.filter((s) => s.id !== id);
    return delay(students.length < before);
  },
  async search(query: string): Promise<Student[]> {
    const q = query.toLowerCase();
    return delay(students.filter((s) => s.name.toLowerCase().includes(q) || s.ra.includes(q)));
  },

  // Domain-specific helpers
  async getEnrollments(studentId: string) {
    return delay(db.enrollments.filter((e) => e.studentId === studentId));
  },
  async getAttendance(studentId: string) {
    return delay(db.attendance.filter((a) => a.studentId === studentId));
  },
  async getGrades(studentId: string) {
    return delay(db.grades.filter((g) => g.studentId === studentId));
  },
  async getCharges(studentId: string) {
    return delay(db.tuitions.filter((t) => t.studentId === studentId));
  },
  async getNotifications(userId: string) {
    return delay(db.notifications.filter((n) => n.userId === userId));
  },
};
