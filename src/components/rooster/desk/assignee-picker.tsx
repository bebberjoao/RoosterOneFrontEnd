import { useMemo, useState } from "react";
import { Check, Search, X, Users } from "lucide-react";
import { AGENTS } from "./categories-store";

export function AgentAvatar({ name, className = "" }: { name: string; className?: string }) {
  const initials = name.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <span className={"flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground " + className}>
      {initials}
    </span>
  );
}

export function AssigneePicker({
  value,
  onChange,
  agents = AGENTS,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  agents?: string[];
}) {
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const s = q.toLowerCase().trim();
    return agents.filter((a) => !s || a.toLowerCase().includes(s));
  }, [agents, q]);

  const toggle = (a: string) =>
    onChange(value.includes(a) ? value.filter((x) => x !== a) : [...value, a]);

  return (
    <div className="rounded-lg border">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar atendente por nome"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {q ? (
          <button type="button" onClick={() => setQ("")} className="text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>

      {value.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5 border-b px-3 py-2">
          {value.map((a) => (
            <span key={a} className="inline-flex items-center gap-1.5 rounded-full border bg-accent/60 py-0.5 pl-1 pr-1.5 text-xs">
              <AgentAvatar name={a} className="h-5 w-5 text-[9px]" />
              {a}
              <button type="button" onClick={() => toggle(a)} className="text-muted-foreground hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button type="button" onClick={() => onChange([])} className="ml-auto text-xs text-muted-foreground underline-offset-2 hover:underline">
            Limpar
          </button>
        </div>
      ) : null}

      <div className="max-h-56 overflow-y-auto p-1">
        {list.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-muted-foreground">Nenhum atendente encontrado.</p>
        ) : (
          list.map((a) => {
            const on = value.includes(a);
            return (
              <button
                key={a}
                type="button"
                onClick={() => toggle(a)}
                className={
                  "flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition " +
                  (on ? "bg-accent" : "hover:bg-accent/50")
                }
              >
                <span className="flex items-center gap-2"><AgentAvatar name={a} /> {a}</span>
                {on ? <Check className="h-4 w-4" /> : null}
              </button>
            );
          })
        )}
      </div>

      <div className="flex items-center gap-1.5 border-t px-3 py-2 text-xs text-muted-foreground">
        <Users className="h-3.5 w-3.5" /> {value.length} de {agents.length} selecionados
      </div>
    </div>
  );
}
