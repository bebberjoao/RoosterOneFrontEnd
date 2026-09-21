import { LEVEL_LABEL, LEVEL_TONE, BOOST_STATUS_LABEL, BOOST_STATUS_TONE, type CourseLevel, type CourseStatus } from "@/services/mock-api/boost.service";

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  const tone = BOOST_STATUS_TONE[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{ borderColor: `color-mix(in oklab, ${tone} 40%, transparent)`, color: tone, backgroundColor: `color-mix(in oklab, ${tone} 10%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: tone }} />
      {BOOST_STATUS_LABEL[status]}
    </span>
  );
}

export function CourseLevelBadge({ level }: { level: CourseLevel }) {
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
