import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { FilterInput } from "./primitives";

/** Standard header for every administrative screen: title, description and actions. */
export function CrudHeader({
  title,
  description,
  actions,
  breadcrumbs,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: ReactNode;
}) {
  return (
    <header className="mb-5">
      {breadcrumbs}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

/** Standard search + filters toolbar placed above every table. */
export function CrudToolbar({
  search,
  onSearch,
  placeholder = "Pesquisar...",
  filters,
  trailing,
  className,
}: {
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  filters?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-center gap-2", className)}>
      <FilterInput value={search} onChange={onSearch} placeholder={placeholder} icon={Search} />
      {filters}
      {trailing ? <div className="ml-auto flex items-center gap-2">{trailing}</div> : null}
    </div>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; onClick?: () => void }[] }) {
  return (
    <nav className="mb-2 flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-1">
          {i > 0 ? <span className="opacity-50">/</span> : null}
          {item.onClick ? (
            <button type="button" onClick={item.onClick} className="hover:text-foreground">
              {item.label}
            </button>
          ) : (
            <span className={i === items.length - 1 ? "text-foreground" : undefined}>{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}