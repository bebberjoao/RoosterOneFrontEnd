import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/rooster/page-header";
import { NFES, studentById, brl, fmtDate } from "@/components/rooster/finance/mock-data";
import { NfeStatusBadge, Avatar } from "@/components/rooster/finance/badges";
import { FileText, Plus, Download } from "lucide-react";

export const Route = createFileRoute("/finance/nfe")({ component: Nfes });

function Nfes() {
  const [tab, setTab] = useState<"servico" | "produto">("servico");
  const rows = useMemo(() => NFES.filter((n) => n.type === tab), [tab]);

  return (
    <>
      <PageHeader
        eyebrow="Rooster Finance"
        title="Notas Fiscais"
        description="Emissão e histórico de NFS-e (serviços) e NF-e (produtos), com estrutura pronta para integração fiscal."
        actions={
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:bg-muted"><Download className="h-4 w-4" /> Exportar XML</button>
            <button className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90"><Plus className="h-4 w-4" /> Emitir nota</button>
          </div>
        }
      />

      <div className="mb-4 inline-flex rounded-xl border bg-card p-1">
        {(["servico", "produto"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={"rounded-lg px-4 py-1.5 text-sm font-medium transition-colors " + (tab === t ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {t === "servico" ? "NFS-e — Serviços" : "NF-e — Produtos"}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="p-3 text-left">Número</th>
              <th className="p-3 text-left">Destinatário</th>
              <th className="p-3 text-left">Descrição</th>
              <th className="p-3 text-left">Emissão</th>
              <th className="p-3 text-right">Valor</th>
              <th className="p-3 text-left">Situação</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((n) => {
              const s = studentById(n.studentId);
              return (
                <tr key={n.id} className="hover:bg-muted/30">
                  <td className="p-3 font-mono text-xs">{n.number}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar initials={s?.initials ?? "—"} tone="oklch(0.6 0.18 260)" />
                      <div className="font-medium">{s?.name}</div>
                    </div>
                  </td>
                  <td className="p-3 text-muted-foreground">{n.description}</td>
                  <td className="p-3">{fmtDate(n.issuedAt)}</td>
                  <td className="p-3 text-right font-medium">{brl(n.value)}</td>
                  <td className="p-3"><NfeStatusBadge status={n.status} /></td>
                  <td className="p-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button className="rounded-md border p-1.5 hover:bg-muted" title="Baixar"><Download className="h-3.5 w-3.5" /></button>
                      <button className="rounded-md border p-1.5 hover:bg-muted" title="Visualizar"><FileText className="h-3.5 w-3.5" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-xl border border-dashed bg-muted/30 p-4 text-xs text-muted-foreground">
        <strong className="text-foreground">Integração fiscal:</strong> a estrutura suporta conexão com prefeituras (NFS-e) e SEFAZ (NF-e) via provedores como NFE.io, Focus NFe e eNotas.
      </div>
    </>
  );
}