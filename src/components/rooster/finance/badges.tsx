import {
  CHARGE_STATUS_LABEL, CHARGE_STATUS_TONE,
  BOLETO_STATUS_LABEL, BOLETO_STATUS_TONE,
  NFE_STATUS_LABEL, NFE_STATUS_TONE,
  type ChargeStatus, type BoletoStatus, type NfeStatus,
} from "./mock-data";

function Pill({ tone, label }: { tone: string; label: string }) {
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

export function ChargeStatusBadge({ status }: { status: ChargeStatus }) {
  return <Pill tone={CHARGE_STATUS_TONE[status]} label={CHARGE_STATUS_LABEL[status]} />;
}
export function BoletoStatusBadge({ status }: { status: BoletoStatus }) {
  return <Pill tone={BOLETO_STATUS_TONE[status]} label={BOLETO_STATUS_LABEL[status]} />;
}
export function NfeStatusBadge({ status }: { status: NfeStatus }) {
  return <Pill tone={NFE_STATUS_TONE[status]} label={NFE_STATUS_LABEL[status]} />;
}

export function ProgressBar({ value, tone = "oklch(0.62 0.18 155)" }: { value: number; tone?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, value))}%`, backgroundColor: tone }} />
    </div>
  );
}

export function Avatar({ initials, tone = "oklch(0.62 0.18 155)" }: { initials: string; tone?: string }) {
  return (
    <span
      className="inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium"
      style={{ backgroundColor: `color-mix(in oklab, ${tone} 15%, transparent)`, color: tone }}
    >
      {initials}
    </span>
  );
}