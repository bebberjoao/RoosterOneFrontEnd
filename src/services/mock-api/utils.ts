// Shared helpers for the in-memory mock services.

/** Simulates network latency so UI loading states behave like a real API. */
export const delay = <T>(value: T, ms = 250): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(value), ms));

let seq = 1;
/** Generates a reasonably unique id for records created at runtime. */
export const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${seq++}`;

export type Filters<T> = Partial<Record<keyof T, unknown>>;

/** Naive equality filter used by getAll(filters) in every mock service. */
export function applyFilters<T extends object>(items: T[], filters?: Filters<T>): T[] {
  if (!filters) return items;
  const entries = (Object.entries(filters) as [keyof T, unknown][]).filter(
    ([, v]) => v !== undefined && v !== null && v !== "",
  );
  if (!entries.length) return items;
  return items.filter((item) => entries.every(([key, value]) => item[key] === value));
}
