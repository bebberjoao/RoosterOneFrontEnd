import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PopoverSelect } from "./dropdown";

export function Chip({ tone, children }: { tone: string; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-[11px] font-medium"
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

const TONE = {
  ok: "oklch(0.62 0.18 155)",
  info: "oklch(0.55 0.19 265)",
  cyan: "oklch(0.68 0.14 195)",
  warn: "oklch(0.72 0.14 90)",
  danger: "oklch(0.65 0.18 25)",
  muted: "oklch(0.65 0.05 260)",
  purple: "oklch(0.6 0.2 305)",
  orange: "oklch(0.68 0.18 40)",
};
export { TONE };

export function StatusChip({ status }: { status: string }) {
  const map: Record<string, { tone: string; label: string }> = {
    // situação acadêmica
    aprovado: { tone: TONE.ok, label: "Aprovado" },
    reprovado: { tone: TONE.danger, label: "Reprovado" },
    "reprovado-falta": { tone: TONE.danger, label: "Reprovado por falta" },
    cursando: { tone: TONE.info, label: "Cursando" },
    // atividades
    pendente: { tone: TONE.warn, label: "Pendente" },
    "em-andamento": { tone: TONE.info, label: "Em andamento" },
    entregue: { tone: TONE.cyan, label: "Entregue" },
    corrigida: { tone: TONE.ok, label: "Corrigida" },
    atrasada: { tone: TONE.danger, label: "Atrasada" },
    // financeiro
    pago: { tone: TONE.ok, label: "Pago" },
    aberto: { tone: TONE.info, label: "Em aberto" },
    vencido: { tone: TONE.danger, label: "Vencido" },
    processando: { tone: TONE.warn, label: "Processando" },
    // reservas
    confirmada: { tone: TONE.ok, label: "Confirmada" },
    cancelada: { tone: TONE.muted, label: "Cancelada" },
    concluida: { tone: TONE.cyan, label: "Concluída" },
    // documentos
    disponivel: { tone: TONE.ok, label: "Disponível" },
    "em-analise": { tone: TONE.warn, label: "Em análise" },
    recusado: { tone: TONE.danger, label: "Recusado" },
    // chamados
    aguardando: { tone: TONE.purple, label: "Aguardando" },
    resolvido: { tone: TONE.ok, label: "Resolvido" },
    // prioridade
    baixa: { tone: TONE.muted, label: "Baixa" },
    media: { tone: TONE.warn, label: "Média" },
    alta: { tone: TONE.danger, label: "Alta" },
  };
  const it = map[status] ?? { tone: TONE.muted, label: status };
  return <Chip tone={it.tone}>{it.label}</Chip>;
}

export function ProgressBar({ value, tone = TONE.info, className }: { value: number; tone?: string; className?: string }) {
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: tone }} />
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = TONE.info,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1.5 text-2xl font-semibold tracking-tight">{value}</p>
          {hint ? <p className="mt-1 truncate text-[11px] text-muted-foreground">{hint}</p> : null}
        </div>
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: `color-mix(in oklab, ${tone} 14%, transparent)`, color: tone }}
        >
          <Icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
        </div>
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border bg-card p-5", className)}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">{title}</h2>
          {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function Avatar({ initials, tone = TONE.info, size = 40 }: { initials: string; tone?: string; size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.36,
        background: `color-mix(in oklab, ${tone} 18%, transparent)`,
        color: tone,
        border: `1px solid color-mix(in oklab, ${tone} 32%, transparent)`,
      }}
    >
      {initials}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description?: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-background/40 p-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <p className="mt-3 text-sm font-medium">{title}</p>
      {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
    </div>
  );
}

export function FilterInput({
  value,
  onChange,
  placeholder,
  icon: Icon,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      {Icon ? <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /> : null}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-lg border bg-background py-2 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40",
          Icon ? "pl-9" : "pl-3",
        )}
      />
    </div>
  );
}

export function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  className?: string;
}) {
  return (
    <PopoverSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      className={className}
    />
  );
}

export function Btn({
  children,
  variant = "ghost",
  onClick,
  className,
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  variant?: "solid" | "ghost";
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        variant === "solid" ? "bg-foreground text-background hover:opacity-90" : "border hover:bg-accent",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
    >
      {children}
    </button>
  );

}

export function Table({ head, children }: { head: string[]; children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
            {head.map((h) => (
              <th key={h} className="whitespace-nowrap px-3 py-2.5 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">{children}</tbody>
      </table>
    </div>
  );
}

export function Pagination({
  page,
  pages,
  onPage,
  total,
}: {
  page: number;
  pages: number;
  onPage: (p: number) => void;
  total: number;
}) {
  if (pages <= 1) return <p className="mt-3 text-xs text-muted-foreground">{total} registro(s)</p>;
  return (
    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
      <span>{total} registro(s) · página {page} de {pages}</span>
      <div className="flex gap-1">
        <button onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1} className="rounded-md border px-2.5 py-1 disabled:opacity-40 hover:bg-accent">Anterior</button>
        <button onClick={() => onPage(Math.min(pages, page + 1))} disabled={page === pages} className="rounded-md border px-2.5 py-1 disabled:opacity-40 hover:bg-accent">Próxima</button>
      </div>
    </div>
  );
}
