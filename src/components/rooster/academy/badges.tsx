import type { ReactNode } from "react";

function Chip({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium"
      style={{
        color: tone,
        background: `color-mix(in oklab, ${tone} 14%, transparent)`,
        border: `1px solid color-mix(in oklab, ${tone} 30%, transparent)`,
      }}
    >
      {children}
    </span>
  );
}

export function DisciplineStatusBadge({ status }: { status: "ativa" | "arquivada" | "inativa" }) {
  const map = {
    ativa: { tone: "oklch(0.62 0.18 155)", label: "Ativa" },
    arquivada: { tone: "oklch(0.55 0.1 260)", label: "Arquivada" },
    inativa: { tone: "oklch(0.65 0.05 260)", label: "Inativa" },
  } as const;
  const it = map[status];
  return <Chip tone={it.tone}>{it.label}</Chip>;
}

export function KlassStatusBadge({ status }: { status: "aberta" | "em-andamento" | "encerrada" }) {
  const map = {
    aberta: { tone: "oklch(0.68 0.14 195)", label: "Aberta" },
    "em-andamento": { tone: "oklch(0.55 0.19 265)", label: "Em andamento" },
    encerrada: { tone: "oklch(0.65 0.05 260)", label: "Encerrada" },
  } as const;
  const it = map[status];
  return <Chip tone={it.tone}>{it.label}</Chip>;
}

export function TeacherStatusBadge({ status }: { status: "ativo" | "afastado" | "inativo" }) {
  const map = {
    ativo: { tone: "oklch(0.62 0.18 155)", label: "Ativo" },
    afastado: { tone: "oklch(0.72 0.14 90)", label: "Afastado" },
    inativo: { tone: "oklch(0.65 0.05 260)", label: "Inativo" },
  } as const;
  const it = map[status];
  return <Chip tone={it.tone}>{it.label}</Chip>;
}

export function EventTypeBadge({ tone, label }: { tone: string; label: string }) {
  return <Chip tone={tone}>{label}</Chip>;
}

export function ProgressBar({ value, tone = "oklch(0.55 0.19 265)" }: { value: number; tone?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: tone }} />
    </div>
  );
}