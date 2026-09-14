import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { SectionCard, StatusChip, Table, Select, FilterInput, StatCard, Chip, TONE, EmptyState, Pagination } from "@/components/rooster/student/ui";
import { CHARGES, SCHOLARSHIP, money, formatDate, today } from "@/components/rooster/student/mock-data";
import { Search, Download, Wallet, AlertTriangle, Percent, Receipt, FileText, Copy } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export const Route = createFileRoute("/student/finance")({ component: StudentFinance });

const PER_PAGE = 6;

function StudentFinance() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");
  const [page, setPage] = useState(1);

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    return CHARGES.filter((c) => (!n || c.description.toLowerCase().includes(n)) && (status === "todos" || c.status === status))
      .sort((a, b) => b.due.localeCompare(a.due));
  }, [q, status]);

  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const paged = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const open = CHARGES.filter((c) => c.status === "aberto");
  const overdue = CHARGES.filter((c) => c.status === "vencido");
  const paid = CHARGES.filter((c) => c.status === "pago");
  const nextDue = [...open].sort((a, b) => a.due.localeCompare(b.due))[0];

  const chart = paid.map((c) => ({ label: c.description.replace("Mensalidade ", ""), valor: c.amount })).reverse();

  return (
    <>
      <PageHeader
        eyebrow="Rooster Student · integrado ao Rooster Finance"
        title="Financeiro"
        description="Mensalidades, boletos, pagamentos, descontos, notas fiscais e vencimentos."
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Em aberto" value={money(open.reduce((s, c) => s + c.amount, 0))} hint={`${open.length} cobrança(s)`} icon={Wallet} tone={TONE.info} />
        <StatCard label="Vencido" value={money(overdue.reduce((s, c) => s + c.amount, 0))} hint={overdue.length ? "regularize para evitar bloqueio" : "sem pendências"} icon={AlertTriangle} tone={overdue.length ? TONE.danger : TONE.muted} />
        <StatCard label="Pago em 2026" value={money(paid.reduce((s, c) => s + c.amount, 0))} hint={`${paid.length} pagamento(s)`} icon={Receipt} tone={TONE.ok} />
        <StatCard label="Desconto ativo" value={`${SCHOLARSHIP.percent}%`} hint={SCHOLARSHIP.name} icon={Percent} tone={TONE.purple} />
      </div>

      <div className="mb-4 grid gap-4 lg:grid-cols-3">
        <SectionCard title="Próximo vencimento" className="lg:col-span-1">
          {nextDue ? (
            <div>
              <p className="text-sm font-medium">{nextDue.description}</p>
              <p className="mt-1 text-2xl font-semibold">{money(nextDue.amount)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Vence em {formatDate(nextDue.due)} · {nextDue.method}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"><Download className="h-4 w-4" /> Baixar boleto</button>
                <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-accent"><Copy className="h-4 w-4" /> Copiar código PIX</button>
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
                <Tooltip formatter={(v: number) => money(v)} contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 12 }} />
                <Bar dataKey="valor" name="Valor pago" fill="oklch(0.62 0.18 155)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>

      <div className="mb-4 rounded-2xl border bg-card p-4">
        <p className="text-sm font-semibold">{SCHOLARSHIP.name}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Desconto de {SCHOLARSHIP.percent}% aplicado nas mensalidades · válido {SCHOLARSHIP.validity} · {SCHOLARSHIP.note}</p>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border bg-card p-3">
        <FilterInput value={q} onChange={(v) => { setQ(v); setPage(1); }} placeholder="Buscar cobrança" icon={Search} />
        <Select value={status} onChange={(v) => { setStatus(v); setPage(1); }} options={[
          { value: "todos", label: "Todos os status" },
          { value: "aberto", label: "Em aberto" },
          { value: "vencido", label: "Vencidos" },
          { value: "pago", label: "Pagos" },
          { value: "processando", label: "Processando" },
        ]} />
      </div>

      <SectionCard title="Cobranças e mensalidades" description={`${rows.length} registro(s)`}>
        <Table head={["Descrição", "Vencimento", "Valor", "Desconto", "Forma", "Nota fiscal", "Status", ""]}>
          {paged.map((c) => (
            <tr key={c.id} className="hover:bg-muted/30">
              <td className="px-3 py-2.5 font-medium">{c.description}</td>
              <td className={`px-3 py-2.5 ${c.status === "vencido" ? "text-destructive" : "text-muted-foreground"}`}>{formatDate(c.due)}</td>
              <td className="px-3 py-2.5">{money(c.amount)}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{c.discount ? `${c.discount}%` : "—"}</td>
              <td className="px-3 py-2.5 text-muted-foreground">{c.method}</td>
              <td className="px-3 py-2.5">{c.nfe ? <Chip tone={TONE.cyan}>{c.nfe}</Chip> : <span className="text-muted-foreground">—</span>}</td>
              <td className="px-3 py-2.5"><StatusChip status={c.status} /></td>
              <td className="px-3 py-2.5 text-right">
                <button className="inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[11px] hover:bg-accent">
                  {c.status === "pago" ? <><FileText className="h-3.5 w-3.5" /> Comprovante</> : <><Download className="h-3.5 w-3.5" /> Boleto</>}
                </button>
              </td>
            </tr>
          ))}
        </Table>
        <Pagination page={page} pages={pages} onPage={setPage} total={rows.length} />
      </SectionCard>
    </>
  );
}
