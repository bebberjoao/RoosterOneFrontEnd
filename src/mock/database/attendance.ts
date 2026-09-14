// Table: attendance — derived deterministically (as the source screens do) from Academy's studentAttendance().
import { studentAttendance } from "@/components/rooster/academy/mock-data";
import { classes } from "./classes";

export interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  percent: number; // 0-100
}

export const attendance: AttendanceRecord[] = classes.flatMap((k) =>
  k.studentIds.map((studentId) => ({
    id: `att-${k.id}-${studentId}`,
    studentId,
    classId: k.id,
    percent: studentAttendance(studentId, k.id),
  })),
);

export const attendanceByStudent = (studentId: string) => attendance.filter((a) => a.studentId === studentId);
export const attendanceByClass = (classId: string) => attendance.filter((a) => a.classId === classId);
