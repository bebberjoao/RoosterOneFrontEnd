import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { CrudHeader, StatCard, SectionCard, TONE } from "@/components/shared";
import { Breadcrumbs, AssetStatusBadge, CategoryChip, MovementBadge } from "@/components/rooster/assets/ui";
import { useAssets } from "@/components/rooster/assets/store";
import { fmtDate, money } from "@/components/rooster/assets/mock-data";
import { Boxes, CheckCircle2, ArrowLeftRight, Wrench, Archive, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/assets/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Rooster Assets" },
      { name: "description", content: "Indicadores de patrimônio: disponíveis, emprestados, em manutenção e inativos." },
      { property: "og:title", content: "Dashboard — Rooster Assets" },
      { property: "og:description", content: "Visão geral do patrimônio institucional." },
    ],
  }),
  component: AssetsDashboard,
});

function AssetsDashboard() {
  const { assets, movements, categoryName, categoryTone } = useAssets();

  const stats = useMemo(() => {
    const by = (s: string) => assets.filter((a) => a.status === s).length;
    return {
      total: assets.length,
      disponivel: by("disponivel"),
      emprestado: by("emprestado"),
      manutencao: by("manutencao"),
      baixado: by("baixado"),
      valor: assets.reduce((s, a) => s + a.value, 0),
    };
  }, [assets]);

  const latest = useMemo(
    () => [...assets].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 6),
    [assets],
  );
  const lastMoves = useMemo(
    () => [...movements].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5),
    [movements],
  );

  return (
    <div>
      <CrudHeader
        breadcrumbs={<Breadcrumbs items={[{ label: "Rooster One", to: "/" }, { label: "Assets" }]} />}
        title="Patrimônio"
        description="Visão geral do inventário institucional, situação dos equipamentos e movimentações recentes."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Patrimônios" value={String(stats.total)} hint={`${money(stats.valor)} em ativos`} icon={Boxes} tone={TONE.info} />
        <StatCard label="Disponíveis" value={String(stats.disponivel)} icon={CheckCircle2} tone={TONE.ok} />
        <StatCard label="Emprestados" value={String(stats.emprestado)} icon={ArrowLeftRight} tone={TONE.cyan} />
        <StatCard label="Em manutenção" value={String(stats.manutencao)} icon={Wrench} tone={TONE.warn} />
        <StatCard label="Inativos / baixados" value={String(stats.baixado)} icon={Archive} tone={TONE.muted} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="Últimos patrimônios cadastrados"
          description="Itens incluídos recentemente no inventário."
          action={
            <Link to="/assets/inventory" className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
              Ver todos <ArrowUpRight className="h-3 w-3" />
            </Link>
          }
        >
          <ul className="divide-y">
            {latest.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.name}</p>
                  <p className="text-[11px] text-muted-foreground">{a.tag} · {a.location}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <CategoryChip name={categoryName(a.categoryId)} tone={categoryTone(a.categoryId)} />
                  <AssetStatusBadge status={a.status} />
                </div>
              </li>
            ))}
          </ul>
        </SectionCard>

        <SectionCard title="Movimentações recentes" description="Registros automáticos com data e responsável.">
          <ul className="space-y-3">
            {lastMoves.map((m) => {
              const asset = assets.find((a) => a.id === m.assetId);
              return (
                <li key={m.id} className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{asset?.name ?? "Patrimônio removido"}</p>
                    <p className="text-xs text-muted-foreground">{m.user} · {fmtDate(m.date)}{m.to ? ` → ${m.to}` : ""}</p>
                  </div>
                  <MovementBadge type={m.type} />
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
