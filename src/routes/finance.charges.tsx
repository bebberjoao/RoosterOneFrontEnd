import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Download, HandCoins, Plus, XCircle } from "lucide-react";
import {
  financeService, type Cobranca, type TipoCobranca, type Produto, type Servico, type Desconto,
} from "@/services/mock-api/finance.service";
import { academyService, type Student } from "@/services/mock-api/academy.service";
import {
  CrudToolbar, DataTable, type Column, Drawer, Modal,
  Field, TextInput, SelectInput, Btn, Select, SectionCard, Avatar,
} from "@/components/shared";
import { brl, fmtDate, valorDevido, downloadBlob } from "@/components/rooster/finance/format";
import { CobrancaStatusBadge } from "@/components/rooster/finance/badges";
import { financeCan } from "@/components/rooster/finance/permissions";
import { useRole } from "@/components/rooster/role-context";
import { PageHeader } from "@/components/rooster/page-header";

export const Route = createFileRoute("/finance/charges")({ component: Charges });

const TIPO_LABEL: Record<TipoCobranca, string> = { mensalidade: "Mensalidade", produto: "Produto", servico: "Serviço", taxa: "Taxa" };

type Draft = {
  alunoId: string; tipo: TipoCobranca; descricao: string; competencia: string;
  produtoId: string; servicoId: string; descontoId: string;
  valorOriginal: number; valorDesconto: number; vencimento: string; formaPagamento: string;
};
const EMPTY: Draft = { alunoId: "", tipo: "taxa", descricao: "", competencia: "", produtoId: "", servicoId: "", descontoId: "", valorOriginal: 0, valorDesconto: 0, vencimento: "", formaPagamento: "" };

function Charges() {
  const { role } = useRole();
  const canManage = financeCan(role, "manageCharges");
  const [rows, setRows] = useState<Cobranca[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [descontos, setDescontos] = useState<Desconto[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");
  const [tipo, setTipo] = useState("todos");
  const [selected, setSelected] = useState<Cobranca | null>(null);
  const [modalNew, setModalNew] = useState(false);
  const [modalPagar, setModalPagar] = useState(false);
  const [modalNegociar, setModalNegociar] = useState(false);
  const [modalCancelar, setModalCancelar] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [valorPago, setValorPago] = useState<number | "">("");
  const [novoVencimento, setNovoVencimento] = useState("");
  const [novoValor, setNovoValor] = useState<number | "">("");
  const [motivo, setMotivo] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    financeService.cobrancas.getAll().then(setRows).catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar cobranças"));
    academyService.getStudents().then(setStudents).catch(() => {});
    financeService.produtos.getAll().then(setProdutos).catch(() => {});
    financeService.servicos.getAll().then(setServicos).catch(() => {});
    financeService.descontos.getAll().then(setDescontos).catch(() => {});
  }, [refresh]);

  const studentById = (id: string) => students.find((s) => s.id === id);

  const filtered = useMemo(() => rows.filter((c) => {
    if (status !== "todos" && c.status !== status) return false;
    if (tipo !== "todos" && c.tipo !== tipo) return false;
    if (!q) return true;
    const s = c.aluno?.usuario.nome ?? studentById(c.alunoId)?.name ?? "";
    return s.toLowerCase().includes(q.toLowerCase()) || c.descricao.toLowerCase().includes(q.toLowerCase());
  }), [rows, q, status, tipo, students]);

  const columns: Column<Cobranca>[] = [
    { key: "aluno", header: "Aluno", cell: (c) => {
      const nome = c.aluno?.usuario.nome ?? studentById(c.alunoId)?.name ?? "—";
      return (
        <div className="flex items-center gap-3">
          <Avatar initials={nome.split(" ").slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "—"} size={32} />
          <div className="min-w-0">
            <div className="truncate text-sm font-medium">{nome}</div>
            <div className="truncate text-[11px] text-muted-foreground">{c.aluno?.ra ?? studentById(c.alunoId)?.ra ?? ""}</div>
          </div>
        </div>
      );
    } },
    { key: "tipo", header: "Tipo", cell: (c) => <span className="text-xs text-muted-foreground">{TIPO_LABEL[c.tipo]}</span> },
    { key: "descricao", header: "Descrição", cell: (c) => <span className="text-xs text-muted-foreground">{c.descricao}</span> },
    { key: "vencimento", header: "Vencimento", sortValue: (c) => c.vencimento, cell: (c) => fmtDate(c.vencimento) },
    { key: "valor", header: "Valor", sortValue: (c) => valorDevido(c), className: "text-right", cell: (c) => <span className="font-medium">{brl(valorDevido(c))}</span> },
    { key: "status", header: "Situação", cell: (c) => <CobrancaStatusBadge status={c.status} /> },
  ];

  function openNew() {
    setDraft(EMPTY);
    setError(null);
    setModalNew(true);
  }

  async function saveNew() {
    if (!draft.alunoId || !draft.descricao.trim() || !draft.vencimento || draft.valorOriginal <= 0) {
      setError("Preencha aluno, descrição, valor e vencimento.");
      return;
    }
    try {
      await financeService.cobrancas.create({
        alunoId: draft.alunoId, tipo: draft.tipo, descricao: draft.descricao,
        competencia: draft.tipo === "mensalidade" ? draft.competencia || undefined : undefined,
        produtoId: draft.tipo === "produto" ? draft.produtoId || undefined : undefined,
        servicoId: draft.tipo === "servico" || draft.tipo === "mensalidade" ? draft.servicoId || undefined : undefined,
        descontoId: draft.descontoId || undefined,
        valorOriginal: draft.valorOriginal, valorDesconto: draft.valorDesconto || undefined,
        vencimento: draft.vencimento, formaPagamento: draft.formaPagamento || undefined,
      });
      setModalNew(false);
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Cobrança criada com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao criar cobrança";
      setError(message);
      toast.error(message);
    }
  }

  async function doMarcarPago() {
    if (!selected) return;
    try {
      const updated = await financeService.cobrancas.marcarPago(selected.id, valorPago === "" ? undefined : { valorPago });
      setSelected(updated);
      setModalPagar(false);
      setValorPago("");
      setRefresh((r) => r + 1);
      toast.success("Cobrança marcada como paga");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao marcar como paga";
      setError(message);
      toast.error(message);
    }
  }

  async function doNegociar() {
    if (!selected || !motivo.trim()) { setError("Informe o motivo da negociação."); return; }
    try {
      const updated = await financeService.cobrancas.negociar(selected.id, {
        novoVencimento: novoVencimento || undefined,
        novoValor: novoValor === "" ? undefined : novoValor,
        motivo,
      });
      setSelected(updated);
      setModalNegociar(false);
      setMotivo(""); setNovoVencimento(""); setNovoValor("");
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Cobrança negociada com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao negociar cobrança";
      setError(message);
      toast.error(message);
    }
  }

  async function doCancelar() {
    if (!selected || !motivo.trim()) { setError("Informe o motivo do cancelamento."); return; }
    try {
      const updated = await financeService.cobrancas.cancelar(selected.id, motivo);
      setSelected(updated);
      setModalCancelar(false);
      setMotivo("");
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Cobrança cancelada com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao cancelar cobrança";
      setError(message);
      toast.error(message);
    }
  }

  async function doExportar() {
    try {
      const blob = await financeService.cobrancas.exportarCsv({ status: status !== "todos" ? status : undefined, tipo: tipo !== "todos" ? tipo : undefined });
      downloadBlob(blob, "cobrancas.csv");
      toast.success("Cobranças exportadas com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao exportar cobranças";
      setError(message);
      toast.error(message);
    }
  }

  const selectedNome = selected ? (selected.aluno?.usuario.nome ?? studentById(selected.alunoId)?.name ?? "—") : "";

  return (
    <>
      <PageHeader
        eyebrow="Rooster Finance"
        title="Cobranças"
        description="Todas as cobranças ativas, emitidas e negociadas com os alunos — mensalidades, produtos, serviços e taxas."
        actions={
          <div className="flex gap-2">
            <Btn onClick={doExportar}><Download className="h-4 w-4" /> Exportar</Btn>
            {canManage && <Btn variant="solid" onClick={openNew}><Plus className="h-4 w-4" /> Nova cobrança</Btn>}
          </div>
        }
      />

      <div data-tour="cobrancas-busca">
      <CrudToolbar
        search={q}
        onSearch={setQ}
        placeholder="Buscar por aluno ou descrição…"
        filters={
          <>
            <Select value={tipo} onChange={setTipo} options={[{ value: "todos", label: "Todos os tipos" }, ...(Object.keys(TIPO_LABEL) as TipoCobranca[]).map((t) => ({ value: t, label: TIPO_LABEL[t] }))]} />
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
      </div>

      {error && !selected && <p className="mb-3 text-xs text-destructive">{error}</p>}

      <div data-tour="cobrancas-lista">
        <DataTable rows={filtered} columns={columns} onRowClick={setSelected} emptyMessage="Nenhuma cobrança encontrada" />
      </div>

      <Drawer
        open={!!selected}
        onClose={() => { setSelected(null); setError(null); }}
        title={selected?.descricao ?? ""}
        subtitle={selected ? `${selectedNome} · ${TIPO_LABEL[selected.tipo]}` : undefined}
        actions={canManage && selected && selected.status !== "pago" && selected.status !== "cancelado" ? (
          <>
            <Btn onClick={() => { setModalCancelar(true); setError(null); }} className="text-destructive"><XCircle className="h-3.5 w-3.5" /> Cancelar</Btn>
            <Btn onClick={() => { setModalNegociar(true); setError(null); }}><HandCoins className="h-3.5 w-3.5" /> Negociar</Btn>
            <Btn variant="solid" tour="cobranca-marcar-paga" onClick={() => { setModalPagar(true); setError(null); }}><CheckCircle2 className="h-3.5 w-3.5" /> Marcar como paga</Btn>
          </>
        ) : undefined}
      >
        {selected && (
          <SectionCard title="Detalhes">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-[11px] text-muted-foreground">Vencimento</dt><dd>{fmtDate(selected.vencimento)}</dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Situação</dt><dd><CobrancaStatusBadge status={selected.status} /></dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Valor original</dt><dd>{brl(selected.valorOriginal)}</dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Desconto</dt><dd>{selected.valorDesconto > 0 ? `- ${brl(selected.valorDesconto)}` : "—"}</dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Multa + juros</dt><dd>{selected.multa + selected.juros > 0 ? `+ ${brl(selected.multa + selected.juros)}` : "—"}</dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Total devido</dt><dd className="font-semibold">{brl(valorDevido(selected))}</dd></div>
              {selected.competencia && <div><dt className="text-[11px] text-muted-foreground">Competência</dt><dd>{selected.competencia}</dd></div>}
              {selected.formaPagamento && <div><dt className="text-[11px] text-muted-foreground">Forma de pagamento</dt><dd>{selected.formaPagamento}</dd></div>}
              {selected.status === "pago" && (
                <>
                  <div><dt className="text-[11px] text-muted-foreground">Valor pago</dt><dd>{brl(selected.valorPago)}</dd></div>
                  <div><dt className="text-[11px] text-muted-foreground">Pago em</dt><dd>{fmtDate(selected.pagoEm)}</dd></div>
                </>
              )}
              {selected.status === "cancelado" && selected.motivoCancelamento && (
                <div className="col-span-2"><dt className="text-[11px] text-muted-foreground">Motivo do cancelamento</dt><dd className="text-muted-foreground">{selected.motivoCancelamento}</dd></div>
              )}
            </dl>
          </SectionCard>
        )}
        {error && selected && <p className="mt-3 text-xs text-destructive">{error}</p>}
      </Drawer>

      <Modal open={modalNew} onClose={() => setModalNew(false)} title="Nova cobrança" size="lg" description="Crie uma cobrança avulsa para um aluno." footer={<><Btn onClick={() => setModalNew(false)}>Cancelar</Btn><Btn variant="solid" onClick={saveNew}>Salvar</Btn></>}>
        <div className="space-y-3">
          <Field label="Aluno">
            <SelectInput value={draft.alunoId} onChange={(e) => setDraft({ ...draft, alunoId: e.target.value })} options={students.map((s) => ({ value: s.id, label: `${s.name} — ${s.ra}` }))} placeholder="Selecione um aluno" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo"><SelectInput value={draft.tipo} onChange={(e) => setDraft({ ...draft, tipo: e.target.value as TipoCobranca })} options={(Object.keys(TIPO_LABEL) as TipoCobranca[]).map((t) => ({ value: t, label: TIPO_LABEL[t] }))} /></Field>
            <Field label="Vencimento"><TextInput type="date" value={draft.vencimento} onChange={(e) => setDraft({ ...draft, vencimento: e.target.value })} /></Field>
          </div>
          <Field label="Descrição"><TextInput value={draft.descricao} onChange={(e) => setDraft({ ...draft, descricao: e.target.value })} placeholder="Ex. Taxa de segunda via de carteirinha" /></Field>
          {draft.tipo === "mensalidade" && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Competência"><TextInput value={draft.competencia} onChange={(e) => setDraft({ ...draft, competencia: e.target.value })} placeholder="2026-09" /></Field>
              <Field label="Serviço"><SelectInput value={draft.servicoId} onChange={(e) => setDraft({ ...draft, servicoId: e.target.value })} options={servicos.map((s) => ({ value: s.id, label: s.nome }))} placeholder="Selecione" /></Field>
            </div>
          )}
          {draft.tipo === "produto" && (
            <Field label="Produto"><SelectInput value={draft.produtoId} onChange={(e) => setDraft({ ...draft, produtoId: e.target.value })} options={produtos.map((p) => ({ value: p.id, label: p.nome }))} placeholder="Selecione" /></Field>
          )}
          {draft.tipo === "servico" && (
            <Field label="Serviço"><SelectInput value={draft.servicoId} onChange={(e) => setDraft({ ...draft, servicoId: e.target.value })} options={servicos.map((s) => ({ value: s.id, label: s.nome }))} placeholder="Selecione" /></Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor original (R$)"><TextInput type="number" min={0} step="0.01" value={draft.valorOriginal} onChange={(e) => setDraft({ ...draft, valorOriginal: Number(e.target.value) })} /></Field>
            <Field label="Desconto (R$)"><TextInput type="number" min={0} step="0.01" value={draft.valorDesconto} onChange={(e) => setDraft({ ...draft, valorDesconto: Number(e.target.value) })} /></Field>
          </div>
          <Field label="Desconto/bolsa aplicada (opcional)">
            <SelectInput value={draft.descontoId} onChange={(e) => setDraft({ ...draft, descontoId: e.target.value })} options={descontos.filter((d) => d.ativo).map((d) => ({ value: d.id, label: d.nome }))} placeholder="Nenhum" />
          </Field>
          <Field label="Forma de pagamento (opcional)"><TextInput value={draft.formaPagamento} onChange={(e) => setDraft({ ...draft, formaPagamento: e.target.value })} placeholder="boleto, pix, cartão…" /></Field>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </Modal>

      <Modal open={modalPagar} onClose={() => setModalPagar(false)} title="Marcar como paga" description="Deixe o valor em branco para considerar o total devido." footer={<><Btn onClick={() => setModalPagar(false)}>Cancelar</Btn><Btn variant="solid" onClick={doMarcarPago} tour="pagamento-confirmar">Confirmar pagamento</Btn></>}>
        <Field label="Valor pago (R$)" tour="pagamento-valor" hint={selected ? `Total devido: ${brl(valorDevido(selected))}` : undefined}>
          <TextInput type="number" min={0} step="0.01" value={valorPago} onChange={(e) => setValorPago(e.target.value === "" ? "" : Number(e.target.value))} />
        </Field>
      </Modal>

      <Modal open={modalNegociar} onClose={() => setModalNegociar(false)} title="Negociar cobrança" footer={<><Btn onClick={() => setModalNegociar(false)}>Cancelar</Btn><Btn variant="solid" onClick={doNegociar}>Confirmar negociação</Btn></>}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Novo vencimento (opcional)"><TextInput type="date" value={novoVencimento} onChange={(e) => setNovoVencimento(e.target.value)} /></Field>
            <Field label="Novo valor (opcional)"><TextInput type="number" min={0} step="0.01" value={novoValor} onChange={(e) => setNovoValor(e.target.value === "" ? "" : Number(e.target.value))} /></Field>
          </div>
          <Field label="Motivo" required><TextInput value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex. Acordo de parcelamento com o aluno" /></Field>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
      </Modal>

      <Modal open={modalCancelar} onClose={() => setModalCancelar(false)} title="Cancelar cobrança" footer={<><Btn onClick={() => setModalCancelar(false)}>Voltar</Btn><Btn variant="solid" className="bg-destructive text-destructive-foreground" onClick={doCancelar}>Confirmar cancelamento</Btn></>}>
        <Field label="Motivo" required><TextInput value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ex. Cobrança lançada em duplicidade" /></Field>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </Modal>
    </>
  );
}
