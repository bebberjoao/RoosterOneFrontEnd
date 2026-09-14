import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { CHARGES, studentById, brl, fmtDate } from "@/components/rooster/finance/mock-data";
import { ChargeStatusBadge, Avatar } from "@/components/rooster/finance/badges";
import { Search, Plus, Download } from "lucide-react";
import { SelectInput } from "@/components/shared";

export const Route = createFileRoute("/finance/charges")({ component: Charges });

function Charges() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>("todos");

  const filtered = useMemo(() => CHARGES.filter((c) => {
    if (status !== "todos" && c.status !== status) return false;
    if (!q) return true;
    const s = studentById(c.studentId);
    return (s?.name.toLowerCase().includes(q.toLowerCase()) || c.description.toLowerCase().includes(q.toLowerCase()));
  }), [q, status]);

  return (
    <>
      <PageHeader
        eyebrow="Rooster Finance"
        title="Cobranças"
        description="Todas as cobranças ativas, emitidas e negociadas com os alunos e responsáveis."
        actions={
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"><Download className="h-4 w-4" /> Exportar</button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"><Plus className="h-4 w-4" /> Nova cobrança</button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 rounded-xl border bg-card p-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por aluno ou descrição…"
            className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40" />
        </div>
        <SelectInput value={status} onChange={(e) => setStatus(e.target.value)} options={[
          { value: "todos", label: "Todos os status" },
          { value: "pago", label: "Pago" },
          { value: "aberto", label: "Em aberto" },
          { value: "atrasado", label: "Atrasado" },
          { value: "negociado", label: "Negociado" },
          { value: "cancelado", label: "Cancelado" },
        ]} />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Aluno</th>
              <th className="p-3 text-left">Descrição</th>
              <th className="p-3 text-left">Vencimento</th>
              <th className="p-3 text-right">Valor</th>
              <th className="p-3 text-left">Situação</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map((c) => {
              const s = studentById(c.studentId);
              return (
                <tr key={c.id} className="hover:bg-muted/30">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar initials={s?.initials ?? "—"} />
                      <div>
                        <div className="font-medium">{s?.name}</div>
                        <div className="text-xs text-muted-foreground">{s?.klass}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{c.description}</td>
                  <td className="p-3">{fmtDate(c.dueDate)}</td>
                  <td className="p-3 text-right font-medium">{brl(c.value)}</td>
                  <td className="p-3"><ChargeStatusBadge status={c.status} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}