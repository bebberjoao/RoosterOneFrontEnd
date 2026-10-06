import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, RefreshCcw } from "lucide-react";
import { financeService, type Cobranca, type Servico } from "@/services/mock-api/finance.service";
import { academyService, type Student, type SchoolClass } from "@/services/mock-api/academy.service";
import {
  CrudToolbar, DataTable, type Column, Drawer, Modal,
  Field, TextInput, SelectInput, Btn, Select, Avatar,
} from "@/components/shared";
import { brl, fmtDate, valorDevido } from "@/components/rooster/finance/format";
import { CobrancaStatusBadge } from "@/components/rooster/finance/badges";
import { financeCan } from "@/components/rooster/finance/permissions";
import { useRole } from "@/components/rooster/role-context";
import { PageHeader } from "@/components/rooster/page-header";

export const Route = createFileRoute("/finance/tuitions")({ component: Tuitions });

type EditDraft = { descricao: string; valorOriginal: number; valorDesconto: number; vencimento: string; formaPagamento: string };
type LoteDraft = { competencia: string; servicoId: string; vencimento: string; turmaId: string };
const EMPTY_LOTE: LoteDraft = { competencia: "", servicoId: "", vencimento: "", turmaId: "" };

function Tuitions() {
  const { role } = useRole();
  const canManage = financeCan(role, "manageCharges");
  const [rows, setRows] = useState<Cobranca[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");
  const [comp, setComp] = useState("todas");
  const [selected, setSelected] = useState<Cobranca | null>(null);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState<EditDraft>({ descricao: "", valorOriginal: 0, valorDesconto: 0, vencimento: "", formaPagamento: "" });
  const [loteOpen, setLoteOpen] = useState(false);
  const [loteDraft, setLoteDraft] = useState<LoteDraft>(EMPTY_LOTE);
  const [loteResult, setLoteResult] = useState<string | null>(null);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    financeService.cobrancas.getAll({ tipo: "mensalidade" }).then(setRows).catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar mensalidades"));
    academyService.getStudents().then(setStudents).catch(() => {});
    financeService.servicos.getAll().then(setServicos).catch(() => {});
    academyService.getClasses().then(setClasses).catch(() => {});
  }, [refresh]);

  const studentById = (id: string) => students.find((s) => s.id === id);
  const competences = useMemo(() => Array.from(new Set(rows.map((r) => r.competencia).filter(Boolean))).sort() as string[], [rows]);

  const filtered = useMemo(() => rows.filter((t) => {
    if (status !== "todos" && t.status !== status) return false;
    if (comp !== "todas" && t.competencia !== comp) return false;
    if (!q) return true;
    const nome = t.aluno?.usuario.nome ?? studentById(t.alunoId)?.name ?? "";
    return nome.toLowerCase().includes(q.toLowerCase());
  }), [rows, q, status, comp, students]);

  const columns: Column<Cobranca>[] = [
    { key: "aluno", header: "Aluno", cell: (t) => {
      const nome = t.aluno?.usuario.nome ?? studentById(t.alunoId)?.name ?? "—";
      return (
        <div className="flex items-center gap-3">
          <Avatar initials={nome.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "—"} size={32} />
          <div className="min-w-0"><div className="truncate text-sm font-medium">{nome}</div></div>
        </div>
      );
    } },
    { key: "competencia", header: "Competência", cell: (t) => t.competencia ?? "—" },
    { key: "vencimento", header: "Venc.", sortValue: (t) => t.vencimento, cell: (t) => fmtDate(t.vencimento) },
    { key: "valorOriginal", header: "Valor", className: "text-right", cell: (t) => brl(t.valorOriginal) },
    { key: "desconto", header: "Desconto", className: "text-right", cell: (t) => t.valorDesconto > 0 ? <span style={{ color: "oklch(0.62 0.18 155)" }}>- {brl(t.valorDesconto)}</span> : "—" },
    { key: "encargos", header: "Juros/Multa", className: "text-right", cell: (t) => (t.multa + t.juros) > 0 ? <span style={{ color: "oklch(0.6 0.22 25)" }}>+ {brl(t.multa + t.juros)}</span> : "—" },
    { key: "total", header: "Total", className: "text-right", sortValue: (t) => valorDevido(t), cell: (t) => <span className="font-semibold">{brl(valorDevido(t))}</span> },
    { key: "status", header: "Situação", cell: (t) => <CobrancaStatusBadge status={t.status} /> },
  ];

  function startEdit(t: Cobranca) {
    setEditDraft({ descricao: t.descricao, valorOriginal: t.valorOriginal, valorDesconto: t.valorDesconto, vencimento: t.vencimento.slice(0, 10), formaPagamento: t.formaPagamento ?? "" });
    setError(null);
    setEditing(true);
  }

  async function saveEdit() {
    if (!selected) return;
    try {
      const updated = await financeService.cobrancas.update(selected.id, {
        descricao: editDraft.descricao, valorOriginal: editDraft.valorOriginal, valorDesconto: editDraft.valorDesconto,
        vencimento: editDraft.vencimento, formaPagamento: editDraft.formaPagamento || undefined,
      });
      setSelected(updated);
      setEditing(false);
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Mensalidade atualizada com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao salvar mensalidade";
      setError(message);
      toast.error(message);
    }
  }

  async function doGerarLote() {
    if (!loteDraft.competencia || !loteDraft.servicoId || !loteDraft.vencimento) {
      setError("Preencha competência, serviço e vencimento.");
      return;
    }
    try {
      const res = await financeService.cobrancas.gerarLote({
        competencia: loteDraft.competencia, servicoId: loteDraft.servicoId, vencimento: loteDraft.vencimento,
        turmaId: loteDraft.turmaId || undefined,
      });
      setLoteResult(`${res.geradas} mensalidade(s) gerada(s), ${res.ignoradas} já existiam para esta competência.`);
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Mensalidades geradas em lote com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao gerar mensalidades em lote";
      setError(message);
      toast.error(message);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Rooster Finance"
        title="Mensalidades"
        description="Gestão de mensalidades por competência — geração em lote, descontos aplicados e edição de vencimentos e valores."
        actions={canManage ? <Btn variant="solid" tour="mensalidades-gerar" onClick={() => { setLoteDraft(EMPTY_LOTE); setLoteResult(null); setError(null); setLoteOpen(true); }}><RefreshCcw className="h-4 w-4" /> Gerar em lote</Btn> : undefined}
      />

      <CrudToolbar
        search={q}
        onSearch={setQ}
        placeholder="Buscar por aluno…"
        filters={
          <>
            <Select value={comp} onChange={setComp} options={[{ value: "todas", label: "Todas competências" }, ...competences.map((c) => ({ value: c, label: c }))]} />
            <Select value={status} onChange={setStatus} options={[
              { value: "todos", label: "Todos os status" },
              { value: "aberto", label: "Em aberto" },
              { value: "pago", label: "Pago" },
              { value: "vencido", label: "Vencido" },
              { value: "negociado", label: "Negociado" },
              { value: "cancelado", label: "Cancelado" },
            ]} />
          </>
        }
      />

      {error && !selected && !loteOpen && <p className="mb-3 text-xs text-destructive">{error}</p>}

      <DataTable rows={filtered} columns={columns} onRowClick={(t) => { setSelected(t); setEditing(false); }} emptyMessage="Nenhuma mensalidade encontrada" />

      <Drawer
        open={!!selected}
        onClose={() => { setSelected(null); setEditing(false); setError(null); }}
        title={selected?.descricao ?? ""}
        subtitle={selected ? (selected.aluno?.usuario.nome ?? studentById(selected.alunoId)?.name) : undefined}
        actions={canManage && selected ? (
          editing ? (
            <>
              <Btn onClick={() => setEditing(false)}>Cancelar</Btn>
              <Btn variant="solid" onClick={saveEdit}>Salvar</Btn>
            </>
          ) : (
            <Btn variant="solid" onClick={() => startEdit(selected)}><Pencil className="h-3.5 w-3.5" /> Editar</Btn>
          )
        ) : undefined}
      >
        {selected && !editing && (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div><dt className="text-[11px] text-muted-foreground">Competência</dt><dd>{selected.competencia ?? "—"}</dd></div>
            <div><dt className="text-[11px] text-muted-foreground">Vencimento</dt><dd>{fmtDate(selected.vencimento)}</dd></div>
            <div><dt className="text-[11px] text-muted-foreground">Valor original</dt><dd>{brl(selected.valorOriginal)}</dd></div>
            <div><dt className="text-[11px] text-muted-foreground">Desconto</dt><dd>{selected.valorDesconto > 0 ? `- ${brl(selected.valorDesconto)}` : "—"}</dd></div>
            <div><dt className="text-[11px] text-muted-foreground">Total devido</dt><dd className="font-semibold">{brl(valorDevido(selected))}</dd></div>
            <div><dt className="text-[11px] text-muted-foreground">Situação</dt><dd><CobrancaStatusBadge status={selected.status} /></dd></div>
          </dl>
        )}
        {selected && editing && (
          <div className="space-y-3">
            <Field label="Descrição"><TextInput value={editDraft.descricao} onChange={(e) => setEditDraft({ ...editDraft, descricao: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Valor original (R$)"><TextInput type="number" min={0} step="0.01" value={editDraft.valorOriginal} onChange={(e) => setEditDraft({ ...editDraft, valorOriginal: Number(e.target.value) })} /></Field>
              <Field label="Desconto (R$)"><TextInput type="number" min={0} step="0.01" value={editDraft.valorDesconto} onChange={(e) => setEditDraft({ ...editDraft, valorDesconto: Number(e.target.value) })} /></Field>
            </div>
            <Field label="Vencimento"><TextInput type="date" value={editDraft.vencimento} onChange={(e) => setEditDraft({ ...editDraft, vencimento: e.target.value })} /></Field>
            <Field label="Forma de pagamento"><TextInput value={editDraft.formaPagamento} onChange={(e) => setEditDraft({ ...editDraft, formaPagamento: e.target.value })} placeholder="boleto, pix, cartão…" /></Field>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
        )}
      </Drawer>

      <Modal
        open={loteOpen}
        onClose={() => setLoteOpen(false)}
        title="Gerar mensalidades em lote"
        description="Gera uma cobrança por aluno com matrícula ativa (ou por turma, se selecionada). Idempotente: rodar de novo para a mesma competência/serviço não duplica."
        footer={<><Btn onClick={() => setLoteOpen(false)}>Fechar</Btn><Btn variant="solid" onClick={doGerarLote} tour="lote-gerar">Gerar</Btn></>}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Competência" tour="lote-competencia"><TextInput value={loteDraft.competencia} onChange={(e) => setLoteDraft({ ...loteDraft, competencia: e.target.value })} placeholder="2026-09" /></Field>
            <Field label="Vencimento" tour="lote-vencimento"><TextInput type="date" value={loteDraft.vencimento} onChange={(e) => setLoteDraft({ ...loteDraft, vencimento: e.target.value })} /></Field>
          </div>
          <Field label="Serviço" tour="lote-servico"><SelectInput value={loteDraft.servicoId} onChange={(e) => setLoteDraft({ ...loteDraft, servicoId: e.target.value })} options={servicos.map((s) => ({ value: s.id, label: `${s.nome} — ${brl(s.preco)}` }))} placeholder="Selecione o serviço de mensalidade" /></Field>
          <Field label="Turma (opcional)" tour="lote-turma" hint="Deixe em branco para gerar para todos os alunos com matrícula ativa.">
            <SelectInput value={loteDraft.turmaId} onChange={(e) => setLoteDraft({ ...loteDraft, turmaId: e.target.value })} options={classes.map((c) => ({ value: c.id, label: c.code }))} placeholder="Todas as turmas" />
          </Field>
          {error && <p className="text-xs text-destructive">{error}</p>}
          {loteResult && <p className="text-xs" style={{ color: "oklch(0.62 0.18 155)" }}>{loteResult}</p>}
        </div>
      </Modal>
    </>
  );
}
