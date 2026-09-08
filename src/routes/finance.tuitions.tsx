import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { TUITIONS, studentById, brl, fmtDate } from "@/components/rooster/finance/mock-data";
import { ChargeStatusBadge, Avatar } from "@/components/rooster/finance/badges";
import { Search, RefreshCcw, Plus } from "lucide-react";
import { SelectInput } from "@/components/shared";

export const Route = createFileRoute("/finance/tuitions")({ component: Tuitions });

function Tuitions() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");
  const [comp, setComp] = useState("todas");

  const competences = Array.from(new Set(TUITIONS.map((t) => t.competence))).sort();

  const rows = useMemo(() => TUITIONS.filter((t) => {
    if (status !== "todos" && t.status !== status) return false;
    if (comp !== "todas" && t.competence !== comp) return false;
    if (!q) return true;
    const s = studentById(t.studentId);
    return s?.name.toLowerCase().includes(q.toLowerCase()) ?? false;
  }), [q, status, comp]);

  return (
    <>
      <PageHeader
        eyebrow="Rooster Finance"
        title="Mensalidades"
        description="Gestão completa de mensalidades por competência, incluindo parcelamentos, descontos e negociações."
        actions={
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"><RefreshCcw className="h-4 w-4" /> Gerar em lote</button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"><Plus className="h-4 w-4" /> Individual</button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 rounded-xl border bg-card p-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por aluno…"
            className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm" />
        </div>
        <SelectInput value={comp} onChange={(e) => setComp(e.target.value)} options={[{ value: "todas", label: "Todas competências" }, ...competences.map((c) => ({ value: c, label: c }))]} />
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Aluno</th>
                <th className="p-3 text-left">Competência</th>
                <th className="p-3 text-left">Parcela</th>
                <th className="p-3 text-left">Venc.</th>
                <th className="p-3 text-right">Valor</th>
                <th className="p-3 text-right">Desconto</th>
                <th className="p-3 text-right">Juros/Multa</th>
                <th className="p-3 text-right">Total</th>
                <th className="p-3 text-left">Situação</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((t) => {
                const s = studentById(t.studentId);
                const total = t.value - t.discount + t.fine + t.interest;
                return (
                  <tr key={t.id} className="hover:bg-muted/30">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={s?.initials ?? "—"} />
                        <div>
                          <div className="font-medium">{s?.name}</div>
                          {s?.scholarship && <div className="text-xs" style={{ color: "oklch(0.62 0.18 155)" }}>{s.scholarship}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{t.competence}</td>
                    <td className="p-3 text-muted-foreground">{t.installment}</td>
                    <td className="p-3">{fmtDate(t.dueDate)}</td>
                    <td className="p-3 text-right">{brl(t.value)}</td>
                    <td className="p-3 text-right" style={{ color: "oklch(0.62 0.18 155)" }}>{t.discount > 0 ? `- ${brl(t.discount)}` : "—"}</td>
                    <td className="p-3 text-right" style={{ color: "oklch(0.6 0.22 25)" }}>{t.fine + t.interest > 0 ? `+ ${brl(t.fine + t.interest)}` : "—"}</td>
                    <td className="p-3 text-right font-semibold">{brl(total)}</td>
                    <td className="p-3"><ChargeStatusBadge status={t.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}