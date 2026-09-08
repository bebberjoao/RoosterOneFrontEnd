export const fmtDate = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) : "—";

export const fmtDateTime = (v?: string | null) =>
  v
    ? new Date(v).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "—";

export const fmtCpf = (v?: string | null) =>
  v && v.length === 11 ? `${v.slice(0, 3)}.${v.slice(3, 6)}.${v.slice(6, 9)}-${v.slice(9)}` : (v ?? "—");

export const initials = (name: string) =>
  name.split(" ").filter(Boolean).map((n) => n[0]).slice(0, 2).join("").toUpperCase();