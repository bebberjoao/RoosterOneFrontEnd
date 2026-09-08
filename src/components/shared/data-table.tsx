import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { Pagination } from "./primitives";

export type Column<T> = {
  key: string;
  header: string;
  /** cell renderer */
  cell: (row: T) => ReactNode;
  /** value used for sorting; enables sorting when provided */
  sortValue?: (row: T) => string | number;
  className?: string;
};

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  onRowClick,
  pageSize = 10,
  emptyMessage = "Nenhum registro encontrado",
}: {
  rows: T[];
  columns: Column<T>[];
  onRowClick?: (row: T) => void;
  pageSize?: number;
  emptyMessage?: string;
}) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col?.sortValue) return rows;
    const factor = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      const va = col.sortValue!(a);
      const vb = col.sortValue!(b);
      if (typeof va === "number" && typeof vb === "number") return (va - vb) * factor;
      return String(va).localeCompare(String(vb), "pt-BR") * factor;
    });
  }, [rows, sort, columns]);

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pages);
  const slice = sorted.slice((current - 1) * pageSize, current * pageSize);

  function toggleSort(key: string) {
    setSort((s) => (s?.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
    setPage(1);
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed bg-background/40 p-10 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Inbox className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
              {columns.map((c) => (
                <th key={c.key} className={cn("whitespace-nowrap px-3 py-2.5 font-medium", c.className)}>
                  {c.sortValue ? (
                    <button
                      type="button"
                      onClick={() => toggleSort(c.key)}
                      className="inline-flex items-center gap-1 uppercase hover:text-foreground"
                    >
                      {c.header}
                      {sort?.key === c.key ? (
                        sort.dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                      ) : null}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {slice.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn("transition-colors", onRowClick && "cursor-pointer hover:bg-accent/50")}
              >
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-3 py-2.5 align-middle", c.className)}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Pagination page={current} pages={pages} onPage={setPage} total={sorted.length} />
    </div>
  );
}