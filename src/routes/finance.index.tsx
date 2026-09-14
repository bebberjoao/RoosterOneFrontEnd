import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { StatCard, SectionCard, TONE, Breadcrumbs, CrudHeader } from "@/components/shared";
import { useRole } from "@/components/rooster/role-context";
import {
  TUITIONS, BOLETOS, STUDENTS, studentById, brl, fmtDate, sum,
} from "@/components/rooster/finance/mock-data";
import { ChargeStatusBadge, BoletoStatusBadge, Avatar } from "@/components/rooster/finance/badges";
import {
  Wallet, TrendingUp, AlertTriangle, FileWarning, CheckCircle2, Users, ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import { REVENUE_BY_MONTH } from "@/components/rooster/finance/mock-data";

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

function FinanceDashboard() {
  const { role } = useRole();
  if (role === "aluno" || role === "institucional") return <StudentFinanceView />;

  const previsto = sum(TUITIONS.map((t) => t.value - t.discount));
  const recebido = sum(TUITIONS.filter((t) => t.status === "pago").map((t) => t.paid));
  const atrasadas = TUITIONS.filter((t) => t.status === "atrasado").length;
  const boletosVenc = BOLETOS.filter((b) => b.status === "vencido").length;
  const inadimplentes = new Set(TUITIONS.filter((t) => t.status === "atrasado").map((t) => t.studentId)).size;

  const upcoming = BOLETOS.filter((b) => b.status === "emitido" || b.status === "vencido")
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate)).slice(0, 6);
  const paidRecent = BOLETOS.filter((b) => b.status === "pago").slice(0, 6);

  const latestTuitions = useMemo(
    () => [...TUITIONS].sort((a, b) => (a.dueDate < b.dueDate ? 1 : -1)).slice(0, 6),
    [],
  );

  return (
    <div>
      <CrudHeader
        breadcrumbs={<Breadcrumbs items={[{ label: "Rooster One" }, { label: "Finance" }]} />}
        title="Painel financeiro"
        description="Indicadores de cobranças, recebimentos e inadimplência."
        actions={
          <Link to="/finance/manage" className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">
            Gerenciar financeiro <ArrowUpRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Receita prevista" value={brl(previsto)} hint="acumulado 2026" icon={Wallet} tone={TONE.info} />
        <StatCard label="Receita recebida" value={brl(recebido)} hint="no ano" icon={TrendingUp} tone={TONE.ok} />
        <StatCard label="Mensalidades em atraso" value={String(atrasadas)} hint="requer cobrança" icon={AlertTriangle} tone={TONE.danger} />
        <StatCard label="Boletos vencidos" value={String(boletosVenc)} hint="em aberto" icon={FileWarning} tone={TONE.danger} />
        <StatCard label="Inadimplentes" value={String(inadimplentes)} hint={`${STUDENTS.length} alunos ativos`} icon={Users} tone={TONE.warn} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        <SectionCard
          className="xl:col-span-2"
          title="Receita por mês"
          description="Previsto vs recebido — 2026"
        >
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={REVENUE_BY_MONTH}>
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
                <XAxis dataKey="m" stroke="oklch(0.6 0.02 260)" fontSize={11} />
                <YAxis stroke="oklch(0.6 0.02 260)" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="prev" name="Previsto" stroke="oklch(0.6 0.18 260)" fill="url(#prev)" strokeWidth={2} />
                <Area type="monotone" dataKey="rec" name="Recebido" stroke="oklch(0.62 0.18 155)" fill="url(#rec)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Mensalidades recentes" description="Últimos vencimentos lançados.">
          <ul className="divide-y">
            {latestTuitions.map((t) => {
              const s = studentById(t.studentId);
              return (
                <li key={t.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s?.name}</p>
                    <p className="text-[11px] text-muted-foreground">{t.competence} · {fmtDate(t.dueDate)}</p>
                  </div>
                  <ChargeStatusBadge status={t.status} />
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Últimos pagamentos" description="Boletos compensados recentemente.">
          <div className="space-y-3">
            {paidRecent.map((b) => {
              const s = studentById(b.studentId);
              return (
                <div key={b.id} className="flex items-center gap-3">
                  <Avatar initials={s?.initials ?? "—"} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{s?.name}</div>
                    <div className="text-xs text-muted-foreground">{b.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{brl(b.value)}</div>
                    <div className="text-xs text-muted-foreground">{fmtDate(b.paidAt ?? "")}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>

        <SectionCard title="Próximos vencimentos" description="Boletos emitidos ou vencidos.">
          <div className="space-y-3">
            {upcoming.map((b) => {
              const s = studentById(b.studentId);
              return (
                <div key={b.id} className="flex items-center gap-3">
                  <Avatar initials={s?.initials ?? "—"} tone="oklch(0.6 0.18 260)" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{s?.name}</div>
                    <div className="text-xs text-muted-foreground">Vence em {fmtDate(b.dueDate)}</div>
                  </div>
                  <BoletoStatusBadge status={b.status} />
                </div>
              );
            })}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function StudentFinanceView() {
  const student = STUDENTS[0];
  const myTuitions = TUITIONS.filter((t) => t.studentId === student.id);
  const myBoletos = BOLETOS.filter((b) => b.studentId === student.id);
  const totalPago = sum(myTuitions.filter((t) => t.status === "pago").map((t) => t.paid));
  const totalPend = sum(myTuitions.filter((t) => t.status !== "pago" && t.status !== "cancelado").map((t) => t.value - t.discount + t.fine + t.interest));
  const proximo = myBoletos.filter((b) => b.status === "emitido").sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0];

  return (
    <div>
      <CrudHeader
        breadcrumbs={<Breadcrumbs items={[{ label: "Rooster One" }, { label: "Finance" }]} />}
        title={`Olá, ${student.name.split(" ")[0]}`}
        description="Acompanhe suas mensalidades, boletos e comprovantes."
      />

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Total pago no ano" value={brl(totalPago)} icon={CheckCircle2} tone={TONE.ok} />
        <StatCard label="Valor pendente" value={brl(totalPend)} icon={AlertTriangle} tone={TONE.danger} />
        <StatCard label="Próximo vencimento" value={proximo ? fmtDate(proximo.dueDate) : "—"} hint={proximo ? brl(proximo.value) : "Sem pendências"} icon={FileWarning} tone={TONE.info} />
      </div>

      <SectionCard className="mt-6" title="Minhas mensalidades" description="Histórico de competências e situação de pagamento.">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted-foreground">
                <th className="pb-2">Competência</th>
                <th className="pb-2">Vencimento</th>
                <th className="pb-2">Valor</th>
                <th className="pb-2">Situação</th>
                <th className="pb-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {myTuitions.map((t) => (
                <tr key={t.id} className="hover:bg-muted/40">
                  <td className="py-3">{t.competence}</td>
                  <td className="py-3">{fmtDate(t.dueDate)}</td>
                  <td className="py-3 font-medium">{brl(t.value - t.discount + t.fine + t.interest)}</td>
                  <td className="py-3"><ChargeStatusBadge status={t.status} /></td>
                  <td className="py-3 text-right">
                    <button className="rounded-md border px-2 py-1 text-xs hover:bg-muted">2ª via</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
}
