import type { StatusCobranca, StatusNotaFiscal } from "@/services/mock-api/finance.service";

function Chip({ tone, label }: { tone: string; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{
        borderColor: `color-mix(in oklab, ${tone} 40%, transparent)`,
        color: tone,
        backgroundColor: `color-mix(in oklab, ${tone} 10%, transparent)`,
      }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone }} />
      {label}
    </span>
  );
}

const COBRANCA_STATUS: Record<StatusCobranca, { label: string; tone: string }> = {
  aberto: { label: "Em aberto", tone: "oklch(0.6 0.18 260)" },
  pago: { label: "Pago", tone: "oklch(0.62 0.18 155)" },
  vencido: { label: "Vencido", tone: "oklch(0.6 0.22 25)" },
  negociado: { label: "Negociado", tone: "oklch(0.72 0.16 90)" },
  cancelado: { label: "Cancelado", tone: "oklch(0.55 0.02 260)" },
  processando: { label: "Processando", tone: "oklch(0.68 0.14 195)" },
};

/** Status único de Cobrança — cobre mensalidade, boleto, produto e serviço (o backend usa a mesma entidade para todos). */
export function CobrancaStatusBadge({ status }: { status: StatusCobranca }) {
  const it = COBRANCA_STATUS[status];
  return <Chip tone={it.tone} label={it.label} />;
}

const NFE_STATUS: Record<StatusNotaFiscal, { label: string; tone: string }> = {
  emitida: { label: "Emitida", tone: "oklch(0.62 0.18 155)" },
  cancelada: { label: "Cancelada", tone: "oklch(0.55 0.02 260)" },
};

export function NotaFiscalStatusBadge({ status }: { status: StatusNotaFiscal }) {
  const it = NFE_STATUS[status];
  return <Chip tone={it.tone} label={it.label} />;
}
