import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, FileBarChart } from "lucide-react";
import { financeService, type Cobranca } from "@/services/mock-api/finance.service";
import { academyService, type Student } from "@/services/mock-api/academy.service";
import { CrudToolbar, DataTable, type Column, Select, Avatar } from "@/components/shared";
import { brl, fmtDate, valorDevido, downloadBlob } from "@/components/rooster/finance/format";
import { CobrancaStatusBadge } from "@/components/rooster/finance/badges";
import { financeCan } from "@/components/rooster/finance/permissions";
import { useRole } from "@/components/rooster/role-context";
import { PageHeader } from "@/components/rooster/page-header";

export const Route = createFileRoute("/finance/boletos")({ component: Boletos });

function Boletos() {
  const { role } = useRole();
  const canManage = financeCan(role, "manageCharges");
  const [rows, setRows] = useState<Cobranca[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    financeService.cobrancas.getAll().then(setRows).catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar cobranças"));
    academyService.getStudents().then(setStudents).catch(() => {});
  }, [refresh]);

  const studentById = (id: string) => students.find((s) => s.id === id);

  const filtered = useMemo(() => rows.filter((c) => {
    if (status !== "todos" && c.status !== status) return false;
    if (!q) return true;
    const nome = c.aluno?.usuario.nome ?? studentById(c.alunoId)?.name ?? "";
    return nome.toLowerCase().includes(q.toLowerCase()) || (c.nossoNumero ?? "").includes(q);
  }), [rows, q, status, students]);

  async function emitir(id: string) {
    setBusyId(id);
    try {
      await financeService.cobrancas.emitirBoleto(id);
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Boleto emitido com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao emitir boleto";
      setError(message);
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  async function baixar(c: Cobranca) {
    setBusyId(c.id);
    try {
      const blob = await financeService.cobrancas.baixarBoletoPdf(c.id);
      downloadBlob(blob, `boleto-${c.nossoNumero ?? c.id}.pdf`);
      toast.success("Boleto baixado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao baixar boleto";
      setError(message);
      toast.error(message);
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<Cobranca>[] = [
    { key: "nossoNumero", header: "Nosso nº", cell: (c) => <span className="font-mono text-xs">{c.nossoNumero ?? "—"}</span> },
    { key: "aluno", header: "Aluno", cell: (c) => {
      const nome = c.aluno?.usuario.nome ?? studentById(c.alunoId)?.name ?? "—";
      return (
        <div className="flex items-center gap-3">
          <Avatar initials={nome.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "—"} size={32} tone="oklch(0.6 0.18 260)" />
          <div className="truncate text-sm font-medium">{nome}</div>
        </div>
      );
    } },
    { key: "descricao", header: "Descrição", cell: (c) => <span className="text-xs text-muted-foreground">{c.descricao}</span> },
    { key: "emitidoEm", header: "Emissão", cell: (c) => fmtDate(c.emitidoEm) },
    { key: "vencimento", header: "Vencimento", sortValue: (c) => c.vencimento, cell: (c) => fmtDate(c.vencimento) },
    { key: "valor", header: "Valor", className: "text-right", sortValue: (c) => valorDevido(c), cell: (c) => <span className="font-medium">{brl(valorDevido(c))}</span> },
    { key: "status", header: "Situação", cell: (c) => <CobrancaStatusBadge status={c.status} /> },
    { key: "acoes", header: "", className: "text-right", cell: (c) => (
      <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
        {!c.nossoNumero && canManage && c.status !== "pago" && c.status !== "cancelado" && (
          <button title="Emitir boleto" disabled={busyId === c.id} onClick={() => emitir(c.id)} className="rounded-md border p-1.5 hover:bg-muted disabled:opacity-50">
            <FileBarChart className="h-3.5 w-3.5" />
          </button>
        )}
        {c.nossoNumero && (
          <button title="Baixar PDF" disabled={busyId === c.id} onClick={() => baixar(c)} className="rounded-md border p-1.5 hover:bg-muted disabled:opacity-50">
            <Download className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    ) },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Rooster Finance"
        title="Boletos"
        description="Emissão e download de boletos vinculados às cobranças — controle interno do Rooster Finance."
      />

      <CrudToolbar
        search={q}
        onSearch={setQ}
        placeholder="Buscar por aluno ou nosso número…"
        filters={
          <Select value={status} onChange={setStatus} options={[
            { value: "todos", label: "Todos os status" },
            { value: "aberto", label: "Em aberto" },
            { value: "pago", label: "Pago" },
            { value: "vencido", label: "Vencido" },
            { value: "negociado", label: "Negociado" },
            { value: "cancelado", label: "Cancelado" },
          ]} />
        }
      />

      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

      <DataTable rows={filtered} columns={columns} emptyMessage="Nenhuma cobrança encontrada" />

      <div className="mt-4 rounded-xl border border-dashed bg-muted/30 p-4 text-xs text-muted-foreground">
        <strong className="text-foreground">Controle interno:</strong> nosso número, linha digitável e código PIX são gerados internamente pelo Rooster Finance para fins de controle e comprovação — não há compensação bancária real (sem gateway/PSP).
      </div>
    </>
  );
}
