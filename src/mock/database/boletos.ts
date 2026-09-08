// Table: boletos — moved from rooster/finance/mock-data.ts (BOLETOS). FK: studentId.
import { tuitions } from "./charges";

type BoletoStatus = "emitido" | "pago" | "vencido" | "cancelado" | "processando";

export const boletos = tuitions.slice(0, 24).map((t, i) => ({
  id: `b-${t.id}`,
  code: `23793.${(38100 + i).toString()}.${(60000 + i * 3).toString()}.${(400001 + i).toString()}.${(90000 + i).toString()}`,
  ourNumber: `NN-${(1000 + i).toString()}`,
  studentId: t.studentId,
  description: `Mensalidade ${t.competence}`,
  dueDate: t.dueDate,
  value: t.value - t.discount + t.fine + t.interest,
  status: (t.status === "pago" ? "pago" : t.status === "atrasado" ? "vencido" : t.status === "cancelado" ? "cancelado" : "emitido") as BoletoStatus,
  emittedAt: `${t.competence}-01`,
  paidAt: t.paidAt,
}));

export const boletoById = (id: string) => boletos.find((b) => b.id === id);
export const boletosByStudent = (studentId: string) => boletos.filter((b) => b.studentId === studentId);
