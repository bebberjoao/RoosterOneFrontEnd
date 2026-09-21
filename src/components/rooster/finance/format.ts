export function brl(n: number | undefined | null) {
  return (n ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** Aceita "2026-07-10" ou um ISO completo com hora — sempre exibe só a data, no formato pt-BR. */
export function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

export function valorDevido(c: { valorOriginal: number; valorDesconto: number; multa: number; juros: number }) {
  return c.valorOriginal - c.valorDesconto + c.multa + c.juros;
}

/** Baixa um Blob já obtido via requestBlob (autenticado) como arquivo local. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
