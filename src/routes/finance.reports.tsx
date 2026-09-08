import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/rooster/page-header";
import { REVENUE_BY_MONTH, DEFAULT_RATE, CASHFLOW, brl, TUITIONS, sum } from "@/components/rooster/finance/mock-data";
import { FileDown, FileSpreadsheet, Filter } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, AreaChart, Area } from "recharts";

export const Route = createFileRoute("/finance/reports")({ component: Reports });

function Reports() {
  const previsto = sum(TUITIONS.map((t) => t.value - t.discount));
  const recebido = sum(TUITIONS.filter((t) => t.status === "pago").map((t) => t.paid));
  const pendente = previsto - recebido;

  return (
    <>
      <PageHeader
        eyebrow="Rooster Finance"
        title="Relatórios"
        description="Analytics financeiro com exportação PDF/Excel e filtros por curso, turma, período, aluno, serviço ou produto."
        actions={
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"><FileDown className="h-4 w-4" /> PDF</button>
            <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"><FileSpreadsheet className="h-4 w-4" /> Excel</button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 rounded-xl border bg-card p-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground"><Filter className="h-4 w-4" /> Filtros:</div>
        {["Curso", "Turma", "Período", "Situação", "Aluno", "Serviço", "Produto"].map((f) => (
          <button key={f} className="rounded-lg border bg-background px-3 py-1.5 text-xs hover:bg-muted">{f}</button>
        ))}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="text-xs text-muted-foreground">Receita prevista</div>
          <div className="mt-2 text-xl font-semibold">{brl(previsto)}</div>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="text-xs text-muted-foreground">Recebido</div>
          <div className="mt-2 text-xl font-semibold" style={{ color: "oklch(0.62 0.18 155)" }}>{brl(recebido)}</div>
        </div>
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="text-xs text-muted-foreground">A receber</div>
          <div className="mt-2 text-xl font-semibold" style={{ color: "oklch(0.6 0.22 25)" }}>{brl(pendente)}</div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold">Receita mensal</h3>
          <p className="text-xs text-muted-foreground">Previsto vs recebido</p>
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={REVENUE_BY_MONTH}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 260)" />
                <XAxis dataKey="m" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="prev" name="Previsto" stroke="oklch(0.6 0.18 260)" fill="oklch(0.6 0.18 260)" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="rec" name="Recebido" stroke="oklch(0.62 0.18 155)" fill="oklch(0.62 0.18 155)" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <h3 className="text-sm font-semibold">Inadimplência</h3>
          <p className="text-xs text-muted-foreground">Evolução mensal</p>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={DEFAULT_RATE}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 260)" />
                <XAxis dataKey="m" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="v" stroke="oklch(0.6 0.22 25)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border bg-card p-5 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-semibold">Fluxo de caixa</h3>
          <p className="text-xs text-muted-foreground">Entradas e saídas do mês</p>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={CASHFLOW}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 260)" />
                <XAxis dataKey="d" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="entrada" name="Entradas" fill="oklch(0.62 0.18 155)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="saida" name="Saídas" fill="oklch(0.6 0.22 25)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}