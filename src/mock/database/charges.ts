// Table: charges — moved from rooster/finance/mock-data.ts (TUITIONS + CHARGES). FK: studentId.
import { financeStudents } from "./financeStudents";

type ChargeStatus = "pago" | "aberto" | "atrasado" | "cancelado" | "negociado";

function pad(n: number) { return n.toString().padStart(2, "0"); }
const YEAR = 2026;

const tuitionsTmp: {
  id: string; studentId: string; competence: string; dueDate: string;
  value: number; discount: number; fine: number; interest: number;
  paid: number; paidAt?: string; status: ChargeStatus; installment: string;
}[] = [];

financeStudents.forEach((s, idx) => {
  for (let m = 1; m <= 8; m++) {
    const value = 1250 + (idx % 3) * 120;
    const disc = s.scholarship ? (s.scholarship.includes("50%") ? value * 0.5 : value * 0.2) : 0;
    const dueDate = `${YEAR}-${pad(m)}-10`;
    const today = new Date();
    const due = new Date(dueDate);
    let status: ChargeStatus = "pago";
    let paid = value - disc;
    let paidAt: string | undefined = `${YEAR}-${pad(m)}-08`;
    let fine = 0, interest = 0;
    if (m >= 7) {
      if (due < today) { status = idx % 3 === 0 ? "atrasado" : idx % 5 === 0 ? "negociado" : "aberto"; }
      else { status = "aberto"; paid = 0; paidAt = undefined; }
      if (status === "atrasado") { fine = (value - disc) * 0.02; interest = (value - disc) * 0.01; paid = 0; paidAt = undefined; }
      if (status === "negociado") { paid = 0; paidAt = undefined; }
    }
    tuitionsTmp.push({
      id: `t-${s.id}-${m}`, studentId: s.id,
      competence: `${YEAR}-${pad(m)}`, dueDate, value,
      discount: disc, fine, interest, paid, paidAt, status,
      installment: `${m}/12`,
    });
  }
});

export type Tuition = (typeof tuitionsTmp)[number];
export const tuitions: Tuition[] = tuitionsTmp;

export const charges = tuitions.slice(-20).map((t) => ({
  id: `c-${t.id}`, studentId: t.studentId, description: `Mensalidade ${t.competence}`,
  dueDate: t.dueDate, value: t.value - t.discount, status: t.status, kind: "mensalidade" as const,
}));

export type Charge = (typeof charges)[number];

export const tuitionsByStudent = (studentId: string) => tuitions.filter((t) => t.studentId === studentId);
export const chargesByStudent = (studentId: string) => charges.filter((c) => c.studentId === studentId);
