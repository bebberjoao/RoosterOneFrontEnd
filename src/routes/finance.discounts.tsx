import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/rooster/page-header";
import { DISCOUNTS } from "@/components/rooster/finance/mock-data";
import { Plus, TicketPercent, Award, Users, Calendar } from "lucide-react";

export const Route = createFileRoute("/finance/discounts")({ component: Discounts });

const KIND_META: Record<string, { label: string; tone: string }> = {
  "bolsa-integral": { label: "Bolsa Integral", tone: "oklch(0.62 0.18 155)" },
  "bolsa-parcial": { label: "Bolsa Parcial", tone: "oklch(0.68 0.14 195)" },
  "desc-percent": { label: "Desconto %", tone: "oklch(0.6 0.18 260)" },
  "desc-fixo": { label: "Desconto fixo", tone: "oklch(0.55 0.19 265)" },
  "convenio": { label: "Convênio", tone: "oklch(0.72 0.16 90)" },
  "promocao": { label: "Promoção", tone: "oklch(0.68 0.18 40)" },
};

function Discounts() {
  return (
    <>
      <PageHeader
        eyebrow="Rooster Finance"
        title="Descontos e Bolsas"
        description="Sistema flexível de bolsas, descontos, convênios e promoções aplicáveis às mensalidades."
        actions={
          <button className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90">
            <Plus className="h-4 w-4" /> Nova regra
          </button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {DISCOUNTS.map((d) => {
          const meta = KIND_META[d.kind];
          const isBolsa = d.kind.includes("bolsa");
          return (
            <div key={d.id} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `color-mix(in oklab, ${meta.tone} 12%, transparent)`, color: meta.tone }}>
                  {isBolsa ? <Award className="h-5 w-5" /> : <TicketPercent className="h-5 w-5" />}
                </span>
                <span className="rounded-md px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: `color-mix(in oklab, ${meta.tone} 12%, transparent)`, color: meta.tone }}>
                  {meta.label}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold">{d.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{d.reason}</p>

              <div className="mt-4 flex items-end justify-between border-t pt-3">
                <div>
                  <div className="text-xs text-muted-foreground">Valor</div>
                  <div className="text-lg font-semibold">
                    {d.unit === "percent" ? `${d.value}%` : `R$ ${d.value.toFixed(2)}`}
                  </div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div className="flex items-center justify-end gap-1"><Users className="h-3 w-3" /> {d.beneficiaries} beneficiários</div>
                  <div className="mt-1 flex items-center justify-end gap-1"><Calendar className="h-3 w-3" /> {d.validity}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">Responsável: <span className="text-foreground">{d.responsible}</span></div>
            </div>
          );
        })}
      </div>
    </>
  );
}