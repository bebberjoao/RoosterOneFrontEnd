// Validações de cliente espelhando os DTOs (class-validator) do backend.
export type ValidationErrors = Record<string, string>;

export const len = (v: string | undefined | null, min: number, max: number, label: string) => {
  const s = (v ?? "").trim();
  if (s.length < min || s.length > max) return `${label} deve ter entre ${min} e ${max} caracteres`;
  return undefined;
};

export const required = (v: unknown, label: string) =>
  v === undefined || v === null || String(v).trim() === "" ? `${label} é obrigatório` : undefined;

export const isEmail = (v: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? undefined : "E-mail inválido";

export const isCpf = (v: string) => (/^\d{11}$/.test(v.trim()) ? undefined : "CPF deve conter 11 dígitos");

export const isIso = (v: string) => (Number.isNaN(Date.parse(v)) ? "Data inválida (use ISO 8601)" : undefined);

export function firstError(...checks: (string | undefined)[]) {
  return checks.find(Boolean);
}