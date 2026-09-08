import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type DropdownOption = { value: string; label: string };

/**
 * Custom popover-based select. Replaces native <select> so the dropdown panel
 * matches the rounded, themed aesthetic of the rest of the system instead of
 * the browser's default square-cornered option list.
 */
export function PopoverSelect({
  value,
  onChange,
  options,
  placeholder = "Selecione",
  className,
  disabled,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  function compute() {
    const el = btnRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const popH = popRef.current?.offsetHeight ?? 240;
    const spaceBelow = window.innerHeight - r.bottom;
    const up = spaceBelow < popH + 8 && r.top > popH + 8;
    setPos({
      top: up ? r.top - popH - 6 : r.bottom + 6,
      left: r.left,
      width: r.width,
    });
  }

  useLayoutEffect(() => {
    if (!open) return;
    compute();
    const reposition = () => compute();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popRef.current?.contains(t)) return;
      if (btnRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    compute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options]);

  return (
    <span className={cn("relative block", className)}>
      <button
        type="button"
        id={id}
        ref={btnRef}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors hover:bg-accent/40 focus:ring-2 focus:ring-ring/40",
          disabled && "cursor-not-allowed opacity-50",
          open && "ring-2 ring-ring/40",
        )}
      >
        <span className={cn("truncate text-left", !selected && "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && pos
        ? createPortal(
            <div
              ref={popRef}
              className="z-[100] overflow-hidden rounded-xl border bg-card shadow-lg"
              style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width }}
            >
              <div className="max-h-60 overflow-y-auto p-1">
                {options.length === 0 ? (
                  <p className="px-3 py-6 text-center text-xs text-muted-foreground">Nenhuma opção</p>
                ) : (
                  options.map((o) => {
                    const active = o.value === value;
                    return (
                      <button
                        key={o.value}
                        type="button"
                        onClick={() => {
                          onChange(o.value);
                          setOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors",
                          active ? "bg-accent" : "hover:bg-accent/60",
                        )}
                      >
                        <span className="truncate">{o.label}</span>
                        {active ? <Check className="h-4 w-4 shrink-0 text-foreground" /> : null}
                      </button>
                    );
                  })
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </span>
  );
}
