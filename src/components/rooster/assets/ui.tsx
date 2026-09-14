import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight, X } from "lucide-react";
import { Chip } from "@/components/rooster/student/ui";
import { CONDITION_META, MOVEMENT_META, STATUS_META, type AssetCondition, type AssetStatus, type MovementType } from "./mock-data";

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  const it = STATUS_META[status];
  return <Chip tone={it.tone}>{it.label}</Chip>;
}

export function ConditionBadge({ condition }: { condition: AssetCondition }) {
  const it = CONDITION_META[condition];
  return <Chip tone={it.tone}>{it.label}</Chip>;
}

export function MovementBadge({ type }: { type: MovementType }) {
  const it = MOVEMENT_META[type];
  return <Chip tone={it.tone}>{it.label}</Chip>;
}

export function CategoryChip({ name, tone }: { name: string; tone: string }) {
  return <Chip tone={tone}>{name}</Chip>;
}

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="mb-3 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      {items.map((it, i) => (
        <span key={`${it.label}-${i}`} className="inline-flex items-center gap-1">
          {i > 0 ? <ChevronRight className="h-3 w-3 opacity-60" /> : null}
          {it.to ? (
            <Link to={it.to} className="transition-colors hover:text-foreground">{it.label}</Link>
          ) : (
            <span className="font-medium text-foreground">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-background/70 p-4 backdrop-blur-sm">
      <div
        className={
          "my-8 w-full rounded-2xl border bg-card shadow-xl " + (wide ? "max-w-3xl" : "max-w-lg")
        }
      >
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" aria-label="Fechar">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer ? <div className="flex justify-end gap-2 border-t px-5 py-3">{footer}</div> : null}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] text-muted-foreground">{hint}</span> : null}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/40";
