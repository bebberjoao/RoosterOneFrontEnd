// Mock service for Rooster Academy. Swap for an httpClient-backed implementation later.
import { db } from "@/mock/database";
import type { Discipline, Course, Term } from "@/mock/database/disciplines";
import type { SchoolClass } from "@/mock/database/classes";
import type { Teacher } from "@/mock/database/teachers";
import type { Student } from "@/mock/database/students";
import type { CalendarEvent } from "@/mock/database/calendarEvents";
import type { Enrollment } from "@/mock/database/enrollments";
import type { GradeItem, Grade } from "@/mock/database/grades";
import type { AttendanceRecord } from "@/mock/database/attendance";
import type { LessonContent } from "@/mock/database/lessonContents";
import type { AcademyDoc } from "@/mock/database/academyDocs";
import { delay, nextId, applyFilters, type Filters } from "./utils";

let disciplines = [...db.disciplines];
let classes = [...db.classes];
let teachers = [...db.teachers];
let terms = [...db.terms];
let events = [...db.calendarEvents];
let enrollments = [...db.enrollments];
let gradeItems = [...db.gradeItems];
let grades = [...db.grades];
let attendance = [...db.attendance];
let lessonContents = [...db.lessonContents];
let academyDocs = [...db.academyDocs];

export const academyService = {
  // Disciplines
  async getAll(filters?: Filters<Discipline>): Promise<Discipline[]> {
    return delay(applyFilters(disciplines, filters));
  },
  async getById(id: string): Promise<Discipline | undefined> {
    return delay(disciplines.find((d) => d.id === id));
  },
  async create(dto: Omit<Discipline, "id">): Promise<Discipline> {
    const created: Discipline = { ...dto, id: nextId("disc") };
    disciplines = [...disciplines, created];
    return delay(created);
  },
  async update(id: string, dto: Partial<Discipline>): Promise<Discipline | undefined> {
    disciplines = disciplines.map((d) => (d.id === id ? { ...d, ...dto } : d));
    return delay(disciplines.find((d) => d.id === id));
  },
  async remove(id: string): Promise<boolean> {
    const before = disciplines.length;
    disciplines = disciplines.filter((d) => d.id !== id);
    return delay(disciplines.length < before);
  },
  async search(query: string): Promise<Discipline[]> {
    const q = query.toLowerCase();
    return delay(disciplines.filter((d) => d.name.toLowerCase().includes(q) || d.code.toLowerCase().includes(q)));
  },

  // Courses / Terms
  async getCourses(): Promise<Course[]> {
    return delay(db.courses);
  },
  async getTerms(): Promise<Term[]> {
    return delay(terms);
  },
  async createTerm(dto: Omit<Term, "id">): Promise<Term> {
    const created: Term = { ...dto, id: nextId("term") };
    terms = [...terms, created];
    return delay(created);
  },
  async updateTerm(id: string, dto: Partial<Term>): Promise<Term | undefined> {
    terms = terms.map((t) => (t.id === id ? { ...t, ...dto } : t));
    return delay(terms.find((t) => t.id === id));
  },
  async removeTerm(id: string): Promise<boolean> {
    const before = terms.length;
    terms = terms.filter((t) => t.id !== id);
    return delay(terms.length < before);
  },

  // Classes
  async getClasses(filters?: Filters<SchoolClass>): Promise<SchoolClass[]> {
    return delay(applyFilters(classes, filters));
  },
  async getClassById(id: string): Promise<SchoolClass | undefined> {
    return delay(classes.find((k) => k.id === id));
  },
  async createClass(dto: Omit<SchoolClass, "id">): Promise<SchoolClass> {
    const created: SchoolClass = { ...dto, id: nextId("class") };
    classes = [...classes, created];
    return delay(created);
  },
  async updateClass(id: string, dto: Partial<SchoolClass>): Promise<SchoolClass | undefined> {
    classes = classes.map((k) => (k.id === id ? { ...k, ...dto } : k));
    return delay(classes.find((k) => k.id === id));
  },
  async removeClass(id: string): Promise<boolean> {
    const before = classes.length;
    classes = classes.filter((k) => k.id !== id);
    return delay(classes.length < before);
  },

  // Teachers
  async getTeachers(filters?: Filters<Teacher>): Promise<Teacher[]> {
    return delay(applyFilters(teachers, filters));
  },
  async getTeacherById(id: string): Promise<Teacher | undefined> {
    return delay(teachers.find((t) => t.id === id));
  },
  async createTeacher(dto: Omit<Teacher, "id" | "userId">): Promise<Teacher> {
    const id = nextId("teacher");
    const created: Teacher = { ...dto, id, userId: `user-${id}` };
    teachers = [...teachers, created];
    return delay(created);
  },
  async updateTeacher(id: string, dto: Partial<Teacher>): Promise<Teacher | undefined> {
    teachers = teachers.map((t) => (t.id === id ? { ...t, ...dto } : t));
    return delay(teachers.find((t) => t.id === id));
  },
  async removeTeacher(id: string): Promise<boolean> {
    const before = teachers.length;
    teachers = teachers.filter((t) => t.id !== id);
    return delay(teachers.length < before);
  },

  // Students (read-only helpers reused from Rooster Student's repository)
  async getStudents(): Promise<Student[]> {
    return delay(db.students);
  },
  async getStudentById(id: string): Promise<Student | undefined> {
    return delay(db.students.find((s) => s.id === id));
  },

  // Calendar
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return delay(events);
  },
  async createCalendarEvent(dto: Omit<CalendarEvent, "id">): Promise<CalendarEvent> {
    const created: CalendarEvent = { ...dto, id: nextId("evt") };
    events = [...events, created];
    return delay(created);
  },
  async updateCalendarEvent(id: string, dto: Partial<CalendarEvent>): Promise<CalendarEvent | undefined> {
    events = events.map((e) => (e.id === id ? { ...e, ...dto } : e));
    return delay(events.find((e) => e.id === id));
  },
  async removeCalendarEvent(id: string): Promise<boolean> {
    const before = events.length;
    events = events.filter((e) => e.id !== id);
    return delay(events.length < before);
  },

  // Enrollments
  async getEnrollmentsByClass(classId: string): Promise<Enrollment[]> {
    return delay(enrollments.filter((e) => e.classId === classId));
  },
  async enrollStudent(classId: string, studentId: string): Promise<Enrollment> {
    const klass = classes.find((k) => k.id === classId);
    const enr: Enrollment = { id: nextId("enr"), studentId, classId, disciplineId: klass?.disciplineId ?? "", status: klass?.status ?? "aberta" };
    enrollments = [...enrollments, enr];
    classes = classes.map((k) => (k.id === classId ? { ...k, studentIds: [...k.studentIds, studentId] } : k));
    return delay(enr);
  },
  async unenrollStudent(classId: string, studentId: string): Promise<boolean> {
    enrollments = enrollments.filter((e) => !(e.classId === classId && e.studentId === studentId));
    classes = classes.map((k) => (k.id === classId ? { ...k, studentIds: k.studentIds.filter((id) => id !== studentId) } : k));
    return delay(true);
  },

  // Grades
  async getGradeItems(classId: string): Promise<GradeItem[]> {
    return delay(gradeItems.filter((g) => g.classId === classId));
  },
  async createGradeItem(dto: Omit<GradeItem, "id">): Promise<GradeItem> {
    const created: GradeItem = { ...dto, id: nextId("gi") };
    gradeItems = [...gradeItems, created];
    return delay(created);
  },
  async getGrades(classId: string): Promise<Grade[]> {
    const ids = gradeItems.filter((g) => g.classId === classId).map((g) => g.id);
    return delay(grades.filter((g) => ids.includes(g.itemId)));
  },
  async setGrade(studentId: string, itemId: string, value: number | null): Promise<Grade> {
    const id = `grade-${studentId}-${itemId}`;
    const existing = grades.find((g) => g.id === id);
    const record: Grade = { id, studentId, itemId, value };
    grades = existing ? grades.map((g) => (g.id === id ? record : g)) : [...grades, record];
    return delay(record);
  },

  // Attendance
  async getAttendanceByClass(classId: string): Promise<AttendanceRecord[]> {
    return delay(attendance.filter((a) => a.classId === classId));
  },

  // Lesson contents
  async getContentsByClass(classId: string): Promise<LessonContent[]> {
    return delay(lessonContents.filter((c) => c.classId === classId).sort((a, b) => b.date.localeCompare(a.date)));
  },
  async createContent(dto: Omit<LessonContent, "id">): Promise<LessonContent> {
    const created: LessonContent = { ...dto, id: nextId("lc") };
    lessonContents = [...lessonContents, created];
    return delay(created);
  },

  // Documents
  async getDocs(filters?: Filters<AcademyDoc>): Promise<AcademyDoc[]> {
    return delay(applyFilters(academyDocs, filters));
  },
  async createDoc(dto: Omit<AcademyDoc, "id">): Promise<AcademyDoc> {
    const created: AcademyDoc = { ...dto, id: nextId("doc") };
    academyDocs = [...academyDocs, created];
    return delay(created);
  },
  async removeDoc(id: string): Promise<boolean> {
    const before = academyDocs.length;
    academyDocs = academyDocs.filter((d) => d.id !== id);
    return delay(academyDocs.length < before);
  },
};
