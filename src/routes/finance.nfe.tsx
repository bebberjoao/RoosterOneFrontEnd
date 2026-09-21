import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, FileText, Plus } from "lucide-react";
import { financeService, type NotaFiscal, type Cobranca } from "@/services/mock-api/finance.service";
import { CrudToolbar, Modal, Field, SelectInput, Btn, Avatar } from "@/components/shared";
import { brl, fmtDate, downloadBlob } from "@/components/rooster/finance/format";
import { NotaFiscalStatusBadge } from "@/components/rooster/finance/badges";
import { financeCan } from "@/components/rooster/finance/permissions";
import { useRole } from "@/components/rooster/role-context";
import { PageHeader } from "@/components/rooster/page-header";

export const Route = createFileRoute("/finance/nfe")({ component: Nfes });

function Nfes() {
  const { role } = useRole();
  const canManage = financeCan(role, "manageNfe");
  const [tab, setTab] = useState<"servico" | "produto">("servico");
  const [rows, setRows] = useState<NotaFiscal[]>([]);
  const [pendentes, setPendentes] = useState<Cobranca[]>([]);
  const [q, setQ] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [cobrancaId, setCobrancaId] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    financeService.notasFiscais.getAll().then(setRows).catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar notas fiscais"));
    Promise.all([
      financeService.cobrancas.getAll({ tipo: "produto" }),
      financeService.cobrancas.getAll({ tipo: "servico" }),
    ]).then(([produtos, servicos]) => {
      setPendentes([...produtos, ...servicos].filter((c) => !c.notaFiscal && c.status !== "cancelado"));
    }).catch(() => {});
  }, [refresh]);

  const filtered = useMemo(() => rows.filter((n) => {
    if (n.tipo !== tab) return false;
    if (!q) return true;
    return n.aluno.nome.toLowerCase().includes(q.toLowerCase()) || n.numero.toLowerCase().includes(q.toLowerCase());
  }), [rows, tab, q]);

  async function doEmitir() {
    if (!cobrancaId) { setError("Selecione uma cobrança."); return; }
    try {
      await financeService.notasFiscais.emitir(cobrancaId);
      setModalOpen(false);
      setCobrancaId("");
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Nota fiscal emitida com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao emitir nota fiscal";
      setError(message);
      toast.error(message);
    }
  }

  async function baixarPdf(n: NotaFiscal) {
    setBusyId(n.id);
    try {
      const blob = await financeService.notasFiscais.baixarPdf(n.id);
      downloadBlob(blob, `${n.numero}.pdf`);
      toast.success("PDF baixado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao baixar PDF";
      setError(message);
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  async function baixarXml(n: NotaFiscal) {
    setBusyId(n.id);
    try {
      const blob = await financeService.notasFiscais.baixarXml(n.id);
      downloadBlob(blob, `${n.numero}.xml`);
      toast.success("XML baixado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao baixar XML";
      setError(message);
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Rooster Finance"
        title="Notas Fiscais"
        description="Emissão e histórico de notas fiscais de serviço e de produto — documento interno do Rooster Finance."
        actions={canManage ? <Btn variant="solid" onClick={() => { setCobrancaId(""); setError(null); setModalOpen(true); }}><Plus className="h-4 w-4" /> Emitir nota</Btn> : undefined}
      />

      <div className="mb-4 inline-flex rounded-xl border bg-card p-1">
        {(["servico", "produto"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={"rounded-lg px-4 py-1.5 text-sm font-medium transition-colors " + (tab === t ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground")}>
            {t === "servico" ? "NFS — Serviços" : "NFP — Produtos"}
          </button>
        ))}
      </div>

      <CrudToolbar search={q} onSearch={setQ} placeholder="Buscar por aluno ou número…" />

      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

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
            {filtered.map((n) => (
              <tr key={n.id} className="hover:bg-muted/30">
                <td className="p-3 font-mono text-xs">{n.numero}</td>
                <td className="p-3">
                  <div className="flex items-center gap-3">
                    <Avatar initials={n.aluno.nome.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "—"} size={32} tone="oklch(0.6 0.18 260)" />
                    <div className="font-medium">{n.aluno.nome}</div>
                  </div>
                </td>
                <td className="p-3 text-muted-foreground">{n.descricao}</td>
                <td className="p-3">{fmtDate(n.emitidoEm)}</td>
                <td className="p-3 text-right font-medium">{brl(n.valor)}</td>
                <td className="p-3"><NotaFiscalStatusBadge status={n.status} /></td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button disabled={busyId === n.id} onClick={() => baixarPdf(n)} className="rounded-md border p-1.5 hover:bg-muted disabled:opacity-50" title="Baixar PDF"><Download className="h-3.5 w-3.5" /></button>
                    <button disabled={busyId === n.id} onClick={() => baixarXml(n)} className="rounded-md border p-1.5 hover:bg-muted disabled:opacity-50" title="Baixar XML"><FileText className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">Nenhuma nota fiscal encontrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 rounded-xl border border-dashed bg-muted/30 p-4 text-xs text-muted-foreground">
        <strong className="text-foreground">Documento interno:</strong> a nota fiscal é gerada localmente (PDF + XML) para controle — não é transmitida à SEFAZ/prefeitura e não tem validade fiscal legal.
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Emitir nota fiscal"
        description="Só é possível emitir para cobranças de produto ou serviço sem nota já emitida."
        footer={<><Btn onClick={() => setModalOpen(false)}>Cancelar</Btn><Btn variant="solid" onClick={doEmitir}>Emitir</Btn></>}
      >
        <Field label="Cobrança">
          <SelectInput
            value={cobrancaId}
            onChange={(e) => setCobrancaId(e.target.value)}
            options={pendentes.map((c) => ({ value: c.id, label: `${c.aluno?.usuario.nome ?? c.alunoId} — ${c.descricao} — ${brl(c.valorOriginal - c.valorDesconto)}` }))}
            placeholder="Selecione uma cobrança pendente"
          />
        </Field>
        {pendentes.length === 0 && <p className="mt-2 text-xs text-muted-foreground">Nenhuma cobrança de produto/serviço pendente de nota fiscal.</p>}
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </Modal>
    </>
  );
}
