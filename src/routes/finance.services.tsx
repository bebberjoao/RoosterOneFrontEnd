import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { SERVICES, FREQ_LABEL, brl, fmtDate } from "@/components/rooster/finance/mock-data";
import { Plus, Wrench } from "lucide-react";

export const Route = createFileRoute("/finance/services")({ component: Services });

function Services() {
  const [q, setQ] = useState("");
  const rows = SERVICES.filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()));
  return (
    <>
      <PageHeader
        eyebrow="Rooster Finance"
        title="Serviços"
        description="Serviços oferecidos pela instituição, com histórico de valores e frequência de cobrança."
        actions={
          <button className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">
            <Plus className="h-4 w-4" /> Novo serviço
          </button>
        }
      />

      <div className="mb-4 rounded-xl border bg-card p-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar serviço…"
          className="w-full rounded-lg border bg-background px-3 py-2 text-sm" />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {rows.map((s) => (
          <div key={s.id} className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "color-mix(in oklab, oklch(0.68 0.14 195) 12%, transparent)", color: "oklch(0.68 0.14 195)" }}>
                  <Wrench className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-xs text-muted-foreground">{s.category}</div>
                  <div className="text-sm font-semibold">{s.name}</div>
                </div>
              </div>
              <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium">{FREQ_LABEL[s.frequency]}</span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{s.description}</p>
            <div className="mt-4 flex items-end justify-between border-t pt-3">
              <div>
                <div className="text-xs text-muted-foreground">Valor atual</div>
                <div className="text-lg font-semibold">{brl(s.price)}</div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <div>Atualizado em</div>
                <div>{fmtDate(s.updatedAt)}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}