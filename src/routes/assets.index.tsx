import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CrudHeader, StatCard, SectionCard, TONE } from "@/components/shared";
import { Breadcrumbs, AssetStatusBadge, CategoryChip, MovementBadge } from "@/components/rooster/assets/ui";
import { useAssets } from "@/components/rooster/assets/store";
import { useAuth } from "@/components/rooster/auth-context";
import { fmtDate, money, type AssetMovement } from "@/components/rooster/assets/mock-data";
import { assetService } from "@/services/mock-api/asset.service";
import { Boxes, CheckCircle2, ArrowLeftRight, Wrench, Archive, ArrowUpRight, AlertTriangle } from "lucide-react";

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
  const { assets, movements, categories, categoryName, categoryTone, returnLoan } = useAssets();
  const { usuario } = useAuth();
  const [overdueLoans, setOverdueLoans] = useState<AssetMovement[]>([]);
  const me = usuario?.nome ?? "Sistema";

  useEffect(() => {
    assetService.getOverdueLoans().then(setOverdueLoans).catch(() => setOverdueLoans([]));
  }, []);

  async function handleReturn(movementId: string) {
    await returnLoan(movementId, me);
    setOverdueLoans((prev) => prev.filter((m) => m.id !== movementId));
  }

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

  const valueByCategory = useMemo(
    () =>
      categories
        .map((c) => ({
          ...c,
          count: assets.filter((a) => a.categoryId === c.id).length,
          value: assets.filter((a) => a.categoryId === c.id).reduce((s, a) => s + a.value, 0),
        }))
        .filter((c) => c.count > 0)
        .sort((a, b) => b.value - a.value),
    [assets, categories],
  );
  const maxCategoryValue = Math.max(1, ...valueByCategory.map((c) => c.value));

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

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Patrimônios" value={String(stats.total)} hint={`${money(stats.valor)} em ativos`} icon={Boxes} tone={TONE.info} />
        <StatCard label="Disponíveis" value={String(stats.disponivel)} icon={CheckCircle2} tone={TONE.ok} />
        <StatCard label="Emprestados" value={String(stats.emprestado)} icon={ArrowLeftRight} tone={TONE.cyan} />
        <StatCard label="Em manutenção" value={String(stats.manutencao)} icon={Wrench} tone={TONE.warn} />
        <StatCard label="Inativos / baixados" value={String(stats.baixado)} icon={Archive} tone={TONE.muted} />
        <StatCard label="Empréstimos atrasados" value={String(overdueLoans.length)} icon={AlertTriangle} tone={overdueLoans.length ? TONE.danger : TONE.ok} />
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

      {overdueLoans.length > 0 && (
        <div className="mt-4">
          <SectionCard title="Empréstimos atrasados" description="Itens emprestados com prazo de devolução vencido.">
            <ul className="divide-y">
              {overdueLoans.map((m) => {
                const asset = assets.find((a) => a.id === m.assetId);
                return (
                  <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{asset?.name ?? "Patrimônio removido"}</p>
                      <p className="text-xs text-destructive">
                        Com {m.to} desde {fmtDate(m.date)} · prazo era {fmtDate(m.dueDate!)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleReturn(m.id)}
                      className="flex-none rounded-md border px-2.5 py-1.5 text-xs font-medium hover:bg-accent"
                    >
                      Marcar como devolvido
                    </button>
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        </div>
      )}

      <div className="mt-4">
        <SectionCard title="Valor do patrimônio por categoria" description="Soma do valor de aquisição dos itens ativos, por categoria.">
          {valueByCategory.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhum patrimônio com categoria cadastrada.</p>
          ) : (
            <ul className="space-y-3">
              {valueByCategory.map((c) => (
                <li key={c.id} className="flex items-center gap-3">
                  <span className="w-40 truncate text-sm" style={{ color: c.tone }}>{c.name}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${(c.value / maxCategoryValue) * 100}%`, background: c.tone }} />
                  </div>
                  <span className="w-28 text-right text-xs font-medium tabular-nums">{money(c.value)}</span>
                  <span className="w-16 text-right text-xs text-muted-foreground">{c.count} item(ns)</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
