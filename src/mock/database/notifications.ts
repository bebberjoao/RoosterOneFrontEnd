// Table: notifications — migrated from rooster/student/mock-data.ts (NOTIFICATIONS). FK: userId.
import { NOTIFICATIONS as SRC, PROFILE } from "@/components/rooster/student/mock-data";
import type { Notification as SrcNotification } from "@/components/rooster/student/mock-data";
import { studentById } from "./students";

export type Notification = SrcNotification & { userId: string };

const currentStudent = studentById("s1"); // PROFILE ("Ana Prado") maps to academy student s1.

export const notifications: Notification[] = SRC.map((n) => ({
  ...n,
  userId: currentStudent?.userId ?? "user-s1",
}));

export const notificationsByUser = (userId: string) => notifications.filter((n) => n.userId === userId);
export { PROFILE };
