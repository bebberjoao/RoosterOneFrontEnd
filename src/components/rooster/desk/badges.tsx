import { PRIORITY_LABEL, PRIORITY_TONE, STATUS_LABEL, STATUS_TONE, type TicketPriority, type TicketStatus } from "./mock-data";

export function StatusBadge({ status }: { status: TicketStatus }) {
  const tone = STATUS_TONE[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{ borderColor: `color-mix(in oklab, ${tone} 40%, transparent)`, color: tone, backgroundColor: `color-mix(in oklab, ${tone} 10%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone }} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const tone = PRIORITY_TONE[priority];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium"
      style={{ color: tone, backgroundColor: `color-mix(in oklab, ${tone} 12%, transparent)` }}
    >
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

export function SlaBar({ percent }: { percent: number }) {
  const tone = percent > 60 ? "oklch(0.62 0.18 155)" : percent > 30 ? "oklch(0.72 0.14 90)" : "oklch(0.6 0.22 25)";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: tone }} />
      </div>
      <span className="text-xs tabular-nums text-muted-foreground">{percent}%</span>
    </div>
  );
}