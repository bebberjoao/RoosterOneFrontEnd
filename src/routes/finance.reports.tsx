import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, Download, Users, Wallet } from "lucide-react";
import { financeService, type ReceitaMensal, type FluxoCaixaMes, type Inadimplencia } from "@/services/mock-api/finance.service";
import { Btn, StatCard, SectionCard, TONE } from "@/components/shared";
import { brl, downloadBlob } from "@/components/rooster/finance/format";
import { PageHeader } from "@/components/rooster/page-header";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, AreaChart, Area } from "recharts";
import { fmtPercentual } from "@/lib/formatacao";

export const Route = createFileRoute("/finance/reports")({ component: Reports });

const MES_LABEL: Record<string, string> = { jan: "Jan", fev: "Fev", mar: "Mar", abr: "Abr", mai: "Mai", jun: "Jun", jul: "Jul", ago: "Ago", set: "Set", out: "Out", nov: "Nov", dez: "Dez" };

function Reports() {
  const [receita, setReceita] = useState<ReceitaMensal[]>([]);
  const [fluxo, setFluxo] = useState<FluxoCaixaMes[]>([]);
  const [inadimplencia, setInadimplencia] = useState<Inadimplencia | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      financeService.relatorios.receitaMensal(),
      financeService.relatorios.fluxoCaixa(),
      financeService.relatorios.inadimplencia(),
    ]).then(([r, f, i]) => {
      setReceita(r);
      setFluxo(f);
      setInadimplencia(i);
    }).catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar relatórios"));
  }, []);

  const previsto = receita.reduce((s, m) => s + m.previsto, 0);
  const recebido = receita.reduce((s, m) => s + m.recebido, 0);
  const pendente = previsto - recebido;

  async function doExportar() {
    try {
      const blob = await financeService.relatorios.exportarCsv();
      downloadBlob(blob, "relatorio-financeiro.csv");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao exportar relatório");
    }
  }

  const receitaChart = receita.map((m) => ({ ...m, mesLabel: MES_LABEL[m.mes] ?? m.mes }));
  const fluxoChart = fluxo.map((m) => ({ ...m, mesLabel: MES_LABEL[m.mes] ?? m.mes }));

  return (
    <>
      <PageHeader
        eyebrow="Rooster Finance"
        title="Relatórios"
        description="Analytics financeiro do ano corrente — receita mensal, fluxo de caixa e inadimplência, com exportação em CSV."
        actions={<Btn onClick={doExportar}><Download className="h-4 w-4" /> Exportar CSV</Btn>}
      />

      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Receita prevista (ano)" value={brl(previsto)} icon={Wallet} tone={TONE.info} />
        <StatCard label="Recebido" value={brl(recebido)} icon={Wallet} tone={TONE.ok} />
        <StatCard label="A receber" value={brl(pendente)} icon={AlertTriangle} tone={TONE.danger} />
      </div>

      {inadimplencia && (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <StatCard label="Taxa de inadimplência" value={fmtPercentual(inadimplencia.taxaInadimplencia)} icon={AlertTriangle} tone={TONE.danger} />
          <StatCard label="Valor vencido" value={brl(inadimplencia.valorVencido)} icon={Wallet} tone={TONE.warn} />
          <StatCard label="Alunos inadimplentes" value={String(inadimplencia.alunosInadimplentes)} icon={Users} tone={TONE.warn} />
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Receita mensal" description="Previsto vs recebido — ano corrente" className="shadow-sm">
          <div className="h-64">
            <ResponsiveContainer>
              <AreaChart data={receitaChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 260)" />
                <XAxis dataKey="mesLabel" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="previsto" name="Previsto" stroke="oklch(0.6 0.18 260)" fill="oklch(0.6 0.18 260)" fillOpacity={0.15} strokeWidth={2} />
                <Area type="monotone" dataKey="recebido" name="Recebido" stroke="oklch(0.62 0.18 155)" fill="oklch(0.62 0.18 155)" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Pendente por mês" description="Previsto menos recebido" className="shadow-sm">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={fluxoChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 260)" />
                <XAxis dataKey="mesLabel" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="pendente" stroke="oklch(0.6 0.22 25)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Fluxo de caixa" description="Entradas e pendências por mês" className="shadow-sm lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={fluxoChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 260)" />
                <XAxis dataKey="mesLabel" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="entradas" name="Entradas" fill="oklch(0.62 0.18 155)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="pendente" name="Pendente" fill="oklch(0.6 0.22 25)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </>
  );
}
