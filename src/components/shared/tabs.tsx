import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type TabItem = { value: string; label: string; badge?: ReactNode };

/** Lightweight, design-system consistent tab bar used by every consolidated module screen. */
export function TabBar({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: TabItem[];
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-1 rounded-xl border bg-card p-1", className)}>
      {tabs.map((t) => {
        const active = t.value === value;
        return (
          <button
            key={t.value}
            type="button"
            onClick={() => onChange(t.value)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active ? "bg-foreground text-background" : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {t.label}
            {t.badge != null ? (
              <span className={cn("rounded-md px-1.5 py-0.5 text-[10px]", active ? "bg-background/20" : "bg-muted")}>
                {t.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}