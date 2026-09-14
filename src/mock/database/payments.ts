// Table: payments — moved from rooster/finance/mock-data.ts (BOLETOS, treated as the payment instrument). FK: studentId, chargeId.
import { boletos } from "./boletos";

export type Payment = (typeof boletos)[number] & { chargeId: string };

export const payments: Payment[] = boletos.map((b) => ({ ...b, chargeId: b.id.replace(/^b-/, "t-") }));
export const paymentById = (id: string) => payments.find((p) => p.id === id);
export const paymentsByStudent = (studentId: string) => payments.filter((p) => p.studentId === studentId);
