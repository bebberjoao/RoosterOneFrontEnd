import { LEVEL_LABEL, LEVEL_TONE, STATUS_LABEL, STATUS_TONE, type CourseLevel, type CourseStatus } from "./mock-data";

export function StatusBadge({ status }: { status: CourseStatus }) {
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

export function LevelBadge({ level }: { level: CourseLevel }) {
  const tone = LEVEL_TONE[level];
  return (
    <span
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium"
      style={{ color: tone, backgroundColor: `color-mix(in oklab, ${tone} 12%, transparent)` }}
    >
      {LEVEL_LABEL[level]}
    </span>
  );
}

export function ProgressBar({ value, tone = "oklch(0.62 0.18 155)" }: { value: number; tone?: string }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full" style={{ width: `${value}%`, backgroundColor: tone }} />
    </div>
  );
}

export function RatingStars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
      <span style={{ color: "oklch(0.75 0.17 60)" }}>★</span>
      <span className="tabular-nums">{value.toFixed(1)}</span>
    </span>
  );
}
