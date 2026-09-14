export type ChargeStatus = "pago" | "aberto" | "atrasado" | "cancelado" | "negociado";
export type BoletoStatus = "emitido" | "pago" | "vencido" | "cancelado" | "processando";
export type NfeStatus = "emitida" | "cancelada" | "processando" | "rejeitada";
export type ServiceFreq = "unico" | "mensal" | "anual" | "semestral";

export type Product = {
  id: string; code: string; name: string; category: string; description: string;
  price: number; stock: number; minStock: number; unit: string; cover: string;
  active: boolean; updatedAt: string;
};

export type Service = {
  id: string; name: string; description: string; price: number;
  category: string; frequency: ServiceFreq; active: boolean; updatedAt: string;
};

export type Student = {
  id: string; name: string; email: string; course: string; klass: string;
  registration: string; initials: string; scholarship?: string;
};

export type Tuition = {
  id: string; studentId: string; competence: string; dueDate: string;
  value: number; discount: number; fine: number; interest: number;
  paid: number; paidAt?: string; status: ChargeStatus; installment: string;
};

export type Boleto = {
  id: string; code: string; ourNumber: string; studentId: string;
  description: string; dueDate: string; value: number; status: BoletoStatus;
  emittedAt: string; paidAt?: string;
};

export type Nfe = {
  id: string; number: string; type: "servico" | "produto"; studentId: string;
  description: string; value: number; issuedAt: string; status: NfeStatus;
};

export type Discount = {
  id: string; name: string; kind: "bolsa-integral" | "bolsa-parcial" | "desc-percent" | "desc-fixo" | "convenio" | "promocao";
  value: number; unit: "percent" | "fixo"; reason: string; responsible: string;
  validity: string; active: boolean; beneficiaries: number;
};

export type Charge = {
  id: string; studentId: string; description: string; dueDate: string;
  value: number; status: ChargeStatus; kind: "mensalidade" | "matricula" | "taxa" | "produto" | "servico" | "evento";
};

// ---------- Data ----------
// Fonte única: os arrays de seed vivem em src/mock/database/*.ts; aqui apenas
// tipamos e reexportamos com os nomes históricos usados pelas telas.
import { financeStudents } from "@/mock/database/financeStudents";
import { products } from "@/mock/database/products";
import { services } from "@/mock/database/services";
import { tuitions, charges } from "@/mock/database/charges";
import { boletos } from "@/mock/database/boletos";
import { nfes } from "@/mock/database/nfes";
import { discounts } from "@/mock/database/discounts";

export const STUDENTS: Student[] = financeStudents;

export function studentById(id: string) { return STUDENTS.find((s) => s.id === id); }

export const PRODUCT_CATEGORIES = ["Livros", "Uniformes", "Materiais", "Kits", "Crachás", "Equipamentos"];

export const PRODUCTS: Product[] = products;

export const SERVICES: Service[] = services;

export const TUITIONS: Tuition[] = tuitions;

export const BOLETOS: Boleto[] = boletos;

export const NFES: Nfe[] = nfes;

export const DISCOUNTS: Discount[] = discounts;

export const CHARGES: Charge[] = charges;


// Charts
export const REVENUE_BY_MONTH = [
  { m: "Jan", prev: 420000, rec: 398000 },
  { m: "Fev", prev: 425000, rec: 410000 },
  { m: "Mar", prev: 430000, rec: 421000 },
  { m: "Abr", prev: 432000, rec: 415000 },
  { m: "Mai", prev: 438000, rec: 430000 },
  { m: "Jun", prev: 440000, rec: 428000 },
  { m: "Jul", prev: 445000, rec: 432000 },
  { m: "Ago", prev: 450000, rec: 210000 },
];

export const CASHFLOW = [
  { d: "01", entrada: 12500, saida: 8200 },
  { d: "05", entrada: 34200, saida: 12100 },
  { d: "08", entrada: 28800, saida: 9400 },
  { d: "12", entrada: 41200, saida: 15300 },
  { d: "15", entrada: 58800, saida: 22100 },
  { d: "20", entrada: 32900, saida: 18800 },
  { d: "25", entrada: 24700, saida: 12400 },
];

export const DEFAULT_RATE = [
  { m: "Jan", v: 3.1 },
  { m: "Fev", v: 3.4 },
  { m: "Mar", v: 2.9 },
  { m: "Abr", v: 3.2 },
  { m: "Mai", v: 3.6 },
  { m: "Jun", v: 3.8 },
  { m: "Jul", v: 4.1 },
  { m: "Ago", v: 3.9 },
];

export const CHARGE_STATUS_LABEL: Record<ChargeStatus, string> = {
  pago: "Pago", aberto: "Em aberto", atrasado: "Atrasado", cancelado: "Cancelado", negociado: "Negociado",
};
export const CHARGE_STATUS_TONE: Record<ChargeStatus, string> = {
  pago: "oklch(0.62 0.18 155)",
  aberto: "oklch(0.6 0.18 260)",
  atrasado: "oklch(0.6 0.22 25)",
  cancelado: "oklch(0.55 0.02 260)",
  negociado: "oklch(0.72 0.16 90)",
};

export const BOLETO_STATUS_LABEL: Record<BoletoStatus, string> = {
  emitido: "Emitido", pago: "Pago", vencido: "Vencido", cancelado: "Cancelado", processando: "Processando",
};
export const BOLETO_STATUS_TONE: Record<BoletoStatus, string> = {
  emitido: "oklch(0.6 0.18 260)",
  pago: "oklch(0.62 0.18 155)",
  vencido: "oklch(0.6 0.22 25)",
  cancelado: "oklch(0.55 0.02 260)",
  processando: "oklch(0.72 0.16 90)",
};

export const NFE_STATUS_LABEL: Record<NfeStatus, string> = {
  emitida: "Emitida", cancelada: "Cancelada", processando: "Processando", rejeitada: "Rejeitada",
};
export const NFE_STATUS_TONE: Record<NfeStatus, string> = {
  emitida: "oklch(0.62 0.18 155)",
  cancelada: "oklch(0.55 0.02 260)",
  processando: "oklch(0.72 0.16 90)",
  rejeitada: "oklch(0.6 0.22 25)",
};

export const FREQ_LABEL: Record<ServiceFreq, string> = {
  unico: "Único", mensal: "Mensal", anual: "Anual", semestral: "Semestral",
};

export function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
export function fmtDate(iso: string) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

// Aggregations
export function sum(arr: number[]) { return arr.reduce((a, b) => a + b, 0); }

// Alerts
export type Alert = { id: string; kind: "warning" | "info" | "danger"; title: string; description: string };
export const ALERTS: Alert[] = [
  { id: "a1", kind: "danger", title: "12 boletos vencendo hoje", description: "Enviar lembrete automático via e-mail e SMS." },
  { id: "a2", kind: "warning", title: "Estoque abaixo do mínimo — Kit Química", description: "Somente 12 unidades disponíveis (mínimo 15)." },
  { id: "a3", kind: "info", title: "Convênio Empresarial A expira em 60 dias", description: "Iniciar renovação com o parceiro." },
  { id: "a4", kind: "danger", title: "3 NFS-e rejeitadas pela prefeitura", description: "Revisar dados fiscais e reenviar." },
];