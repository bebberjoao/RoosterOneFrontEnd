// Table: notifications — migrated from rooster/student/mock-data.ts (NOTIFICATIONS). FK: userId.
// NOTIFICATIONS (Rooster Student "Central de notificações") ficou deliberadamente fora do
// escopo da integração real com o backend — ver src/routes/student.notifications.tsx.
import { NOTIFICATIONS as SRC } from "@/components/rooster/student/mock-data";
import type { Notification as SrcNotification } from "@/components/rooster/student/mock-data";
import { studentById } from "./students";

export type Notification = SrcNotification & { userId: string };

const currentStudent = studentById("s1"); // aluno mock de referência (histórico/legado, não mais a fonte de identidade real).

export const notifications: Notification[] = SRC.map((n) => ({
  ...n,
  userId: currentStudent?.userId ?? "user-s1",
}));

export const notificationsByUser = (userId: string) => notifications.filter((n) => n.userId === userId);
