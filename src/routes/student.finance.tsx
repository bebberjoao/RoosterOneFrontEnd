import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { SectionCard, Table, Select, FilterInput, StatCard, TONE, EmptyState, Pagination } from "@/components/rooster/student/ui";
import { LoadingCards } from "@/components/shared";
import { financeService, type Cobranca, type Desconto } from "@/services/mock-api/finance.service";
import { CobrancaStatusBadge } from "@/components/rooster/finance/badges";
import { brl, fmtDate, valorDevido, downloadBlob } from "@/components/rooster/finance/format";
import { Search, Download, Wallet, AlertTriangle, Percent, Receipt, FileText, Copy, Check } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export const Route = createFileRoute("/student/finance")({ component: StudentFinance });

const PER_PAGE = 6;

function StudentFinance() {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([]);
  const [desconto, setDesconto] = useState<Desconto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pixCopiado, setPixCopiado] = useState(false);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");
  const [page, setPage] = useState(1);

  useEffect(() => {
    Promise.all([financeService.me.getCobrancas(), financeService.me.getDesconto()])
      .then(([c, d]) => { setCobrancas(c); setDesconto(d); })
      .catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar seus dados financeiros"))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return cobrancas
      .filter((c) => (!n || c.descricao.toLowerCase().includes(n)) && (status === "todos" || c.status === status))
      .sort((a, b) => b.vencimento.localeCompare(a.vencimento));
  }, [cobrancas, q, status]);

  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const paged = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const open = cobrancas.filter((c) => c.status === "aberto");
  const overdue = cobrancas.filter((c) => c.status === "vencido");
  const paid = cobrancas.filter((c) => c.status === "pago");
  const nextDue = [...open].sort((a, b) => a.vencimento.localeCompare(b.vencimento))[0];

  const chart = paid.slice(0, 12).map((c) => ({ label: c.descricao.replace(/^Mensalidade\s*/, ""), valor: c.valorPago ?? valorDevido(c) })).reverse();

  async function baixarBoleto(c: Cobranca) {
    setBusyId(c.id);
    try {
      const blob = await financeService.me.baixarBoletoPdf(c.id);
      downloadBlob(blob, `boleto-${c.nossoNumero ?? c.id}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao baixar boleto");
    } finally {
      setBusyId(null);
    }
  }

  async function baixarNotaFiscal(c: Cobranca) {
    setBusyId(c.id);
    try {
      const blob = await financeService.me.baixarNotaFiscalPdf(c.id);
      downloadBlob(blob, `${c.notaFiscal?.numero ?? "nota-fiscal"}.pdf`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao baixar nota fiscal");
    } finally {
      setBusyId(null);
    }
  }

  async function copiarPix(c: Cobranca) {
    if (!c.pixCopiaECola) return;
    try {
      await navigator.clipboard.writeText(c.pixCopiaECola);
      setPixCopiado(true);
      setTimeout(() => setPixCopiado(false), 2000);
    } catch {
      setError("Não foi possível copiar o código PIX.");
    }
  }

  if (loading) {
    return (
      <>
        <PageHeader eyebrow="Rooster Student · integrado ao Rooster Finance" title="Financeiro" description="Mensalidades, boletos, pagamentos, descontos, notas fiscais e vencimentos." />
        <LoadingCards />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Rooster Student · integrado ao Rooster Finance"
        title="Financeiro"
        description="Mensalidades, boletos, pagamentos, descontos, notas fiscais e vencimentos."
      />

      {error && <p className="mb-4 text-xs text-destructive">{error}</p>}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Em aberto" value={brl(open.reduce((s, c) => s + valorDevido(c), 0))} hint={`${open.length} cobrança(s)`} icon={Wallet} tone={TONE.info} />
        <StatCard label="Vencido" value={brl(overdue.reduce((s, c) => s + valorDevido(c), 0))} hint={overdue.length ? "regularize para evitar bloqueio" : "sem pendências"} icon={AlertTriangle} tone={overdue.length ? TONE.danger : TONE.muted} />
        <StatCard label="Pago no ano" value={brl(paid.reduce((s, c) => s + (c.valorPago ?? 0), 0))} hint={`${paid.length} pagamento(s)`} icon={Receipt} tone={TONE.ok} />
        <StatCard label="Desconto ativo" value={desconto ? (desconto.unidade === "percent" ? `${desconto.valor}%` : brl(desconto.valor)) : "—"} hint={desconto?.nome ?? "Nenhum desconto ativo"} icon={Percent} tone={TONE.purple} />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Próximo vencimento" className="lg:col-span-1">
          {nextDue ? (
            <div>
              <p className="text-sm font-medium">{nextDue.descricao}</p>
              <p className="mt-1 text-2xl font-semibold">{brl(valorDevido(nextDue))}</p>
              <p className="mt-1 text-xs text-muted-foreground">Vence em {fmtDate(nextDue.vencimento)}{nextDue.formaPagamento ? ` · ${nextDue.formaPagamento}` : ""}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  disabled={!nextDue.nossoNumero || busyId === nextDue.id}
                  onClick={() => baixarBoleto(nextDue)}
                  title={nextDue.nossoNumero ? undefined : "Boleto ainda não emitido"}
                  className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-40"
                >
                  <Download className="h-4 w-4" /> Baixar boleto
                </button>
                <button
                  disabled={!nextDue.pixCopiaECola}
                  onClick={() => copiarPix(nextDue)}
                  className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent disabled:opacity-40"
                >
                  {pixCopiado ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {pixCopiado ? "Código copiado" : "Copiar código PIX"}
                </button>
              </div>
            </div>
          ) : (
            <EmptyState icon={Wallet} title="Nenhuma cobrança em aberto" />
          )}
        </SectionCard>

        <SectionCard title="Histórico de pagamentos" className="lg:col-span-2">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={10} stroke="var(--muted-foreground)" />
                <YAxis tickLine={false} axisLine={false} fontSize={11} stroke="var(--muted-foreground)" />
                <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="valor" name="Valor pago" fill="oklch(0.62 0.18 155)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      {desconto && (
        <div className="mb-4 rounded-2xl border bg-card p-4">
          <p className="text-sm font-semibold">{desconto.nome}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {desconto.unidade === "percent" ? `Desconto de ${desconto.valor}%` : `Desconto de ${brl(desconto.valor)}`} aplicado nas mensalidades
            {desconto.vigenciaFim ? ` · válido até ${fmtDate(desconto.vigenciaFim)}` : ""}{desconto.motivo ? ` · ${desconto.motivo}` : ""}
          </p>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
        <FilterInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Buscar cobrança" icon={Search} />
        <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[
          { value: "todos", label: "Todos os status" },
          { value: "aberto", label: "Em aberto" },
          { value: "vencido", label: "Vencidos" },
          { value: "pago", label: "Pagos" },
          { value: "negociado", label: "Negociados" },
          { value: "cancelado", label: "Cancelados" },
        ]} />
      </div>

      <SectionCard title="Cobranças e mensalidades" description={`${rows.length} registro(s)`}>
        <Table head={["Descrição", "Vencimento", "Valor", "Desconto", "Forma", "Nota fiscal", "Status", ""]}>
          {paged.map((c) => (
            <tr key={c.id} className="hover:bg-muted/30">
              <td className="px-3 py-2.5 font-medium">{c.descricao}</td>
              <td className={`px-3 py-2.5 ${c.status === "vencido" ? "text-destructive" : "text-muted-foreground"}`}>{fmtDate(c.vencimento)}</td>
              <td className="px-3 py-2.5">{brl(valorDevido(c))}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{c.valorDesconto > 0 ? brl(c.valorDesconto) : "—"}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{c.formaPagamento ?? "—"}</td>
              <td className="px-3 py-2.5">{c.notaFiscal ? c.notaFiscal.numero : <span className="text-muted-foreground">—</span>}</td>
              <td className="px-3 py-2.5"><CobrancaStatusBadge status={c.status} /></td>
              <td className="px-3 py-2.5 text-right">
                {c.notaFiscal ? (
                  <button disabled={busyId === c.id} onClick={() => baixarNotaFiscal(c)} className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] hover:bg-accent disabled:opacity-40">
                    <FileText className="h-3.5 w-3.5" /> Comprovante
                  </button>
                ) : (
                  <button disabled={!c.nossoNumero || busyId === c.id} onClick={() => baixarBoleto(c)} className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] hover:bg-accent disabled:opacity-40">
                    <Download className="h-3.5 w-3.5" /> Boleto
                  </button>
                )}
              </td>
            </tr>
          ))}
        </Table>
        {paged.length === 0 && <p className="py-6 text-center text-xs text-muted-foreground">Nenhuma cobrança encontrada.</p>}
        <Pagination page={page} pages={pages} onPage={setPage} total={rows.length} />
      </SectionCard>
    </>
  );
}
