import {
  STATUS_LABEL, STATUS_TONE, SPACE_STATUS_LABEL, SPACE_STATUS_TONE,
  SPACE_TYPE_LABEL, SPACE_TYPE_TONE,
  type ReservationStatus, type SpaceStatus, type SpaceType,
} from "./labels";

export function StatusBadge({ status }: { status: ReservationStatus }) {
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

export function SpaceStatusBadge({ status }: { status: SpaceStatus }) {
  const tone = SPACE_STATUS_TONE[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{ borderColor: `color-mix(in oklab, ${tone} 40%, transparent)`, color: tone, backgroundColor: `color-mix(in oklab, ${tone} 10%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone }} />
      {SPACE_STATUS_LABEL[status]}
    </span>
  );
}

export function TypeBadge({ type }: { type: SpaceType }) {
  const tone = SPACE_TYPE_TONE[type];
  return (
    <span
      className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium"
      style={{ color: tone, backgroundColor: `color-mix(in oklab, ${tone} 12%, transparent)` }}
    >
      {SPACE_TYPE_LABEL[type]}
    </span>
  );
}
