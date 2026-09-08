import {
  STATUS_LABEL, STATUS_TONE, TYPE_LABEL, TYPE_TONE, SUB_LABEL, SUB_TONE,
  type ActivityStatus, type ActivityType, type SubmissionStatus,
} from "./mock-data";

export function TypeBadge({ type }: { type: ActivityType }) {
  const tone = TYPE_TONE[type];
  return (
    <span
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium"
      style={{ color: tone, backgroundColor: `color-mix(in oklab, ${tone} 12%, transparent)` }}
    >
      {TYPE_LABEL[type]}
    </span>
  );
}

export function ActivityStatusBadge({ status }: { status: ActivityStatus }) {
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

export function SubmissionBadge({ status }: { status: SubmissionStatus }) {
  const tone = SUB_TONE[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{ borderColor: `color-mix(in oklab, ${tone} 40%, transparent)`, color: tone, backgroundColor: `color-mix(in oklab, ${tone} 10%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone }} />
      {SUB_LABEL[status]}
    </span>
  );
}

export function ProgressBar({ value, tone = "oklch(0.62 0.18 155)" }: { value: number; tone?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, value))}%`, backgroundColor: tone }} />
    </div>
  );
}