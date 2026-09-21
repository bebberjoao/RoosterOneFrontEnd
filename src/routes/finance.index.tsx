import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StatCard, SectionCard, TONE, Breadcrumbs, CrudHeader, Avatar, LoadingCards } from "@/components/shared";
import { financeService, type DashboardFinanceiro } from "@/services/mock-api/finance.service";
import { brl, fmtDate, valorDevido } from "@/components/rooster/finance/format";
import { CobrancaStatusBadge } from "@/components/rooster/finance/badges";
import {
  Wallet, TrendingUp, AlertTriangle, FileWarning, Users,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";

export const Route = createFileRoute("/finance/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Rooster Finance" },
      { name: "description", content: "Indicadores financeiros: receita, mensalidades, boletos e inadimplência." },
      { property: "og:title", content: "Dashboard — Rooster Finance" },
      { property: "og:description", content: "Visão geral do financeiro institucional." },
    ],
  }),
  component: FinanceDashboard,
});

const MES_LABEL: Record<string, string> = { jan: "Jan", fev: "Fev", mar: "Mar", abr: "Abr", mai: "Mai", jun: "Jun", jul: "Jul", ago: "Ago", set: "Set", out: "Out", nov: "Nov", dez: "Dez" };

function FinanceDashboard() {
  const [data, setData] = useState<DashboardFinanceiro | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    financeService.getDashboard().then(setData).catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar o painel financeiro"));
  }, []);

  if (error) {
    return (
      <div>
        <CrudHeader breadcrumbs={<Breadcrumbs items={[{ label: "Rooster One" }, { label: "Finance" }]} />} title="Painel financeiro" />
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div>
        <CrudHeader breadcrumbs={<Breadcrumbs items={[{ label: "Rooster One" }, { label: "Finance" }]} />} title="Painel financeiro" />
        <LoadingCards />
      </div>
    );
  }

  const receitaChart = data.receitaPorMes.map((m) => ({ ...m, mesLabel: MES_LABEL[m.mes] ?? m.mes }));

  return (
    <div>
      <CrudHeader
        breadcrumbs={<Breadcrumbs items={[{ label: "Rooster One" }, { label: "Finance" }]} />}
        title="Painel financeiro"
        description="Indicadores de cobranças, recebimentos e inadimplência — ano corrente."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Receita prevista" value={brl(data.previsto)} hint="acumulado no ano" icon={Wallet} tone={TONE.info} />
        <StatCard label="Receita recebida" value={brl(data.recebido)} hint="no ano" icon={TrendingUp} tone={TONE.ok} />
        <StatCard label="Cobranças em atraso" value={String(data.atrasadas)} hint="requer cobrança" icon={AlertTriangle} tone={TONE.danger} />
        <StatCard label="Boletos vencidos" value={String(data.boletosVencidos)} hint="em aberto" icon={FileWarning} tone={TONE.danger} />
        <StatCard label="Inadimplentes" value={String(data.inadimplentes)} hint="alunos com cobrança vencida" icon={Users} tone={TONE.warn} />
      </div>

      {data.alertasEstoqueBaixo.length > 0 && (
        <div className="mt-4 rounded-xl border border-dashed p-4 text-xs" style={{ borderColor: "color-mix(in oklab, oklch(0.6 0.22 25) 40%, transparent)" }}>
          <strong className="text-foreground">Estoque baixo:</strong>{" "}
          {data.alertasEstoqueBaixo.map((p) => `${p.nome} (${p.estoque}/${p.estoqueMinimo})`).join(" · ")}
        </div>
      )}

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <SectionCard className="xl:col-span-2" title="Receita por mês" description="Previsto vs recebido — ano corrente">
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={receitaChart}>
                <defs>
                  <linearGradient id="prev" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.6 0.18 260)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="oklch(0.6 0.18 260)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rec" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="oklch(0.62 0.18 155)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="oklch(0.62 0.18 155)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 260)" />
                <XAxis dataKey="mesLabel" stroke="oklch(0.6 0.02 260)" fontSize={11} />
                <YAxis stroke="oklch(0.6 0.02 260)" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="previsto" name="Previsto" stroke="oklch(0.6 0.18 260)" fill="url(#prev)" strokeWidth={2} />
                <Area type="monotone" dataKey="recebido" name="Recebido" stroke="oklch(0.62 0.18 155)" fill="url(#rec)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Mensalidades recentes" description="Últimos vencimentos lançados.">
          <ul className="divide-y">
            {data.ultimasMensalidades.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{t.aluno?.usuario.nome ?? "—"}</p>
                  <p className="text-[11px] text-muted-foreground">{t.competencia ?? "—"} · {fmtDate(t.vencimento)}</p>
                </div>
                <CobrancaStatusBadge status={t.status} />
              </li>
            ))}
            {data.ultimasMensalidades.length === 0 && <li className="py-4 text-center text-xs text-muted-foreground">Nenhuma mensalidade lançada.</li>}
          </ul>
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Últimos pagamentos" description="Cobranças compensadas recentemente.">
          <div className="space-y-3">
            {data.ultimosPagamentos.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <Avatar initials={(c.aluno?.usuario.nome ?? "—").split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase()} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{c.aluno?.usuario.nome ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{c.descricao}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{brl(c.valorPago ?? valorDevido(c))}</div>
                  <div className="text-xs text-muted-foreground">{fmtDate(c.pagoEm)}</div>
                </div>
              </div>
            ))}
            {data.ultimosPagamentos.length === 0 && <p className="text-xs text-muted-foreground">Nenhum pagamento recente.</p>}
          </div>
        </SectionCard>

        <SectionCard title="Próximos vencimentos" description="Cobranças em aberto ou vencidas.">
          <div className="space-y-3">
            {data.proximosVencimentos.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <Avatar initials={(c.aluno?.usuario.nome ?? "—").split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase()} tone="oklch(0.6 0.18 260)" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{c.aluno?.usuario.nome ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">Vence em {fmtDate(c.vencimento)}</div>
                </div>
                <CobrancaStatusBadge status={c.status} />
              </div>
            ))}
            {data.proximosVencimentos.length === 0 && <p className="text-xs text-muted-foreground">Nenhum vencimento próximo.</p>}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
