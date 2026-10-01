// Formatação de exibição no padrão brasileiro, centralizada.
//
// Datas: sempre dd/mm/aaaa. As colunas de data pura do banco (`@db.Date`, como a data da
// reserva, o vencimento e a data de aquisição) chegam da API como meia-noite UTC
// ("2026-10-03T00:00:00.000Z"); convertê-las com `new Date()` no fuso de Brasília exibiria o dia
// anterior. Por isso, valores de data pura são lidos pelo texto, sem conversão de fuso, e apenas
// os carimbos de data e hora (criadoEm, enviadoEm etc.) passam pelo fuso local.
//
// Números: vírgula como separador decimal e ponto como separador de milhar.

const DATA_PURA = /^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.0+)?Z)?$/;

/** Reduz um valor de data pura a "aaaa-mm-dd" (formato interno de calendário e de formulário). */
export function soData(v?: string | null): string {
  if (!v) return "";
  const m = String(v).match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : "";
}

/** dd/mm/aaaa. Aceita "aaaa-mm-dd", ISO de data pura ou carimbo de data e hora. */
export function fmtData(v?: string | Date | null): string {
  if (!v) return "—";
  if (typeof v === "string") {
    const m = v.match(DATA_PURA);
    if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  }
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** dd/mm/aaaa · hh:mm, no fuso local. */
export function fmtDataHora(v?: string | Date | null): string {
  if (!v) return "—";
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return `${fmtData(d)} · ${fmtHora(d)}`;
}

/** hh:mm. Aceita "07:00", "07:00:00" ou data/ISO. */
export function fmtHora(v?: string | Date | null): string {
  if (!v) return "—";
  if (typeof v === "string") {
    const m = v.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
    if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
  }
  const d = v instanceof Date ? v : new Date(v);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

/** Converte para número valores que a API devolve como texto (Decimal do Prisma). */
export function paraNumero(v: unknown): number {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** Número com casas decimais fixas e vírgula decimal: fmtNumero(8.926, 2) → "8,93". */
export function fmtNumero(v: number | string | null | undefined, casas = 1): string {
  if (v === null || v === undefined || v === "") return "—";
  return paraNumero(v).toLocaleString("pt-BR", { minimumFractionDigits: casas, maximumFractionDigits: casas });
}

/** Número com até `max` casas, sem zeros à direita: fmtNumeroLivre(0.4) → "0,4"; (0.033, 3) → "0,033". */
export function fmtNumeroLivre(v: number | string | null | undefined, max = 2): string {
  if (v === null || v === undefined || v === "") return "—";
  return paraNumero(v).toLocaleString("pt-BR", { maximumFractionDigits: max });
}

/** Percentual: fmtPercentual(33.271) → "33,27%". */
export function fmtPercentual(v: number | string | null | undefined, casas = 2): string {
  if (v === null || v === undefined || v === "") return "—";
  return `${paraNumero(v).toLocaleString("pt-BR", { maximumFractionDigits: casas })}%`;
}

/** Moeda brasileira: fmtMoeda(1287.5) → "R$ 1.287,50". */
export function fmtMoeda(v: number | string | null | undefined): string {
  return paraNumero(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Tamanho de arquivo: 1536 → "1,5 KB". */
export function fmtTamanho(bytes: number | null | undefined): string {
  const b = paraNumero(bytes);
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${fmtNumeroLivre(b / 1024, 0)} KB`;
  return `${fmtNumeroLivre(b / 1024 / 1024, 1)} MB`;
}

/** "aaaa-mm-dd" da data no fuso local (e não em UTC, como `toISOString()`). */
export function dataLocalIso(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Título de calendário: "Outubro de 2026" (somente a inicial do mês em maiúscula). */
export function fmtMesAno(d: Date): string {
  const t = d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return t.charAt(0).toUpperCase() + t.slice(1);
}
