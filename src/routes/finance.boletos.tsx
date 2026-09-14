import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { BOLETOS, studentById, brl, fmtDate } from "@/components/rooster/finance/mock-data";
import { BoletoStatusBadge, Avatar } from "@/components/rooster/finance/badges";
import { Search, Download, Plus, RefreshCcw } from "lucide-react";
import { SelectInput } from "@/components/shared";

export const Route = createFileRoute("/finance/boletos")({ component: Boletos });

function Boletos() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");

  const rows = useMemo(() => BOLETOS.filter((b) => {
    if (status !== "todos" && b.status !== status) return false;
    if (!q) return true;
    const s = studentById(b.studentId);
    return s?.name.toLowerCase().includes(q.toLowerCase()) || b.code.includes(q) || b.ourNumber.toLowerCase().includes(q.toLowerCase());
  }), [q, status]);

  return (
    <>
      <PageHeader
        eyebrow="Rooster Finance"
        title="Boletos"
        description="Emissão, reemissão e controle de boletos bancários. Arquitetura pronta para integração via API."
        actions={
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"><Download className="h-4 w-4" /> Remessa</button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"><Plus className="h-4 w-4" /> Emitir boleto</button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2 rounded-xl border bg-card p-3">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por aluno, nosso número ou linha digitável…"
            className="w-full rounded-lg border bg-background pl-9 pr-3 py-2 text-sm" />
        </div>
        <SelectInput value={status} onChange={(e) => setStatus(e.target.value)} options={[
          { value: "todos", label: "Todos os status" },
          { value: "emitido", label: "Emitido" },
          { value: "pago", label: "Pago" },
          { value: "vencido", label: "Vencido" },
          { value: "processando", label: "Processando" },
          { value: "cancelado", label: "Cancelado" },
        ]} />
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="p-3 text-left">Nosso nº</th>
                <th className="p-3 text-left">Aluno</th>
                <th className="p-3 text-left">Descrição</th>
                <th className="p-3 text-left">Emissão</th>
                <th className="p-3 text-left">Vencimento</th>
                <th className="p-3 text-right">Valor</th>
                <th className="p-3 text-left">Situação</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((b) => {
                const s = studentById(b.studentId);
                return (
                  <tr key={b.id} className="hover:bg-muted/30">
                    <td className="p-3 font-mono text-xs">{b.ourNumber}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar initials={s?.initials ?? "—"} />
                        <div>
                          <div className="font-medium">{s?.name}</div>
                          <div className="text-xs text-muted-foreground">{s?.registration}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{b.description}</td>
                    <td className="p-3">{fmtDate(b.emittedAt)}</td>
                    <td className="p-3">{fmtDate(b.dueDate)}</td>
                    <td className="p-3 text-right font-medium">{brl(b.value)}</td>
                    <td className="p-3"><BoletoStatusBadge status={b.status} /></td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button title="Reemitir" className="rounded-md border p-1.5 hover:bg-muted"><RefreshCcw className="h-3.5 w-3.5" /></button>
                        <button title="PDF" className="rounded-md border p-1.5 hover:bg-muted"><Download className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-dashed bg-muted/30 p-4 text-xs text-muted-foreground">
        <strong className="text-foreground">Integração bancária:</strong> a estrutura de emissão está preparada para conectar com APIs de bancos (Itaú, Bradesco, Sicredi, Banco do Brasil, Santander) via CNAB240 ou API PIX/Boleto.
      </div>
    </>
  );
}