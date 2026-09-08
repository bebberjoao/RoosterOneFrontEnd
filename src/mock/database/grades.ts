// Table: grades — arrays owned here (seed source of truth). FK: studentId, classId, itemId.
// src/components/rooster/academy/mock-data.ts re-exports GRADE_ITEMS/STUDENT_GRADES from this
// file for compatibility.
import type { StudentGrade as SrcStudentGrade, GradeItem as SrcGradeItem } from "@/components/rooster/academy/mock-data";
import { classes } from "./classes";

export type GradeItem = Omit<SrcGradeItem, "klassId"> & { classId: string };
export type Grade = SrcStudentGrade & { id: string };

const GRADE_ITEMS_SEED: SrcGradeItem[] = [
  { id: "gi1", klassId: "k1", name: "P1", weight: 0.3, origin: "manual", max: 10 },
  { id: "gi2", klassId: "k1", name: "P2", weight: 0.3, origin: "manual", max: 10 },
  { id: "gi3", klassId: "k1", name: "Projeto", weight: 0.25, origin: "learn", max: 10 },
  { id: "gi4", klassId: "k1", name: "Participação", weight: 0.15, origin: "manual", max: 10 },
];

// deterministic pseudo-random grade
function rnd(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

const STUDENT_GRADES_SEED: SrcStudentGrade[] = (() => {
  const arr: SrcStudentGrade[] = [];
  const klass = classes.find((k) => k.id === "k1")!;
  klass.studentIds.forEach((sid, si) => {
    GRADE_ITEMS_SEED.forEach((gi, gj) => {
      const r = rnd(si * 7 + gj * 13 + 1);
      const has = r > 0.15 || gj < 2;
      arr.push({ studentId: sid, itemId: gi.id, value: has ? +(4 + r * 6).toFixed(1) : null });
    });
  });
  return arr;
})();

export const gradeItemsSeed: SrcGradeItem[] = GRADE_ITEMS_SEED;
export const studentGradesSeed: SrcStudentGrade[] = STUDENT_GRADES_SEED;

export const gradeItems: GradeItem[] = GRADE_ITEMS_SEED.map(({ klassId, ...rest }) => ({ ...rest, classId: klassId }));
export const grades: Grade[] = STUDENT_GRADES_SEED.map((g) => ({ ...g, id: `grade-${g.studentId}-${g.itemId}` }));

export const gradesByStudent = (studentId: string) => grades.filter((g) => g.studentId === studentId);
export const gradeItemsByClass = (classId: string) => gradeItems.filter((i) => i.classId === classId);
