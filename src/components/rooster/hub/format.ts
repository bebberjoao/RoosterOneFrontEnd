import { fmtData, fmtDataHora as fmtDataHoraBr } from "@/lib/formatacao";
export const fmtDate = (v?: string | null) => fmtData(v);

export const fmtDateTime = (v?: string | null) => fmtDataHoraBr(v);

export const fmtCpf = (v?: string | null) =>
  v && v.length === 11 ? `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}` : (v ?? "—");

export const initials = (name: string) =>
  name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();