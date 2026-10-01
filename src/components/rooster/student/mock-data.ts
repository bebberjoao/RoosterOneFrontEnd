import { fmtData, dataLocalIso } from "@/lib/formatacao";
// Mock data for Rooster Student (portal do aluno)
export const isoOf = (d: Date) => dataLocalIso(d);
export const today = isoOf(new Date());
export const formatDate = (iso: string) => fmtData(iso);

export const shiftDate = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return isoOf(d);
};

export type Situation = "aprovado" | "reprovado" | "cursando" | "reprovado-falta" | "trancado";

export const NOTICES = [
  { id: "av1", title: "Semana Acadêmica 2026", text: "Inscrições abertas até sexta-feira para oficinas e palestras.", tone: "oklch(0.55 0.19 265)" },
  { id: "av2", title: "Biblioteca com horário estendido", text: "Durante o período de provas, atendimento até 23h.", tone: "oklch(0.68 0.14 195)" },
  { id: "av3", title: "Renovação de matrícula 2026.2", text: "Período de renovação inicia em 3 semanas.", tone: "oklch(0.72 0.16 90)" },
];

export const money = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
