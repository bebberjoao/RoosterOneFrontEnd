import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Award, Calendar, Pencil, Plus, Trash2, TicketPercent, UserPlus, Users } from "lucide-react";
import { financeService, type Desconto, type TipoDesconto, type UnidadeDesconto } from "@/services/mock-api/finance.service";
import { academyService, type Student } from "@/services/mock-api/academy.service";
import {
  CrudToolbar, Drawer, Modal, ConfirmDialog,
  Field, TextInput, TextArea, SelectInput, Btn, SectionCard,
} from "@/components/shared";
import { fmtDate } from "@/components/rooster/finance/format";
import { financeCan } from "@/components/rooster/finance/permissions";
import { useRole } from "@/components/rooster/role-context";
import { PageHeader } from "@/components/rooster/page-header";

export const Route = createFileRoute("/finance/discounts")({ component: Discounts });

const KIND_META: Record<TipoDesconto, { label: string; tone: string }> = {
  "bolsa-integral": { label: "Bolsa Integral", tone: "oklch(0.62 0.18 155)" },
  "bolsa-parcial": { label: "Bolsa Parcial", tone: "oklch(0.68 0.14 195)" },
  "desc-percent": { label: "Desconto %", tone: "oklch(0.6 0.18 260)" },
  "desc-fixo": { label: "Desconto fixo", tone: "oklch(0.55 0.19 265)" },
  convenio: { label: "Convênio", tone: "oklch(0.72 0.16 90)" },
  promocao: { label: "Promoção", tone: "oklch(0.68 0.18 40)" },
};
const KIND_OPTIONS = (Object.keys(KIND_META) as TipoDesconto[]).map((v) => ({ value: v, label: KIND_META[v].label }));

type Draft = {
  nome: string; tipo: TipoDesconto; valor: number; unidade: UnidadeDesconto;
  motivo: string; responsavel: string; vigenciaInicio: string; vigenciaFim: string; ativo: boolean;
};
const EMPTY: Draft = { nome: "", tipo: "desc-percent", valor: 0, unidade: "percent", motivo: "", responsavel: "", vigenciaInicio: "", vigenciaFim: "", ativo: true };

function Discounts() {
  const { role } = useRole();
  const canManage = financeCan(role, "manageDiscounts");
  const [rows, setRows] = useState<Desconto[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selected, setSelected] = useState<Desconto | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [modalNew, setModalNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignStudentId, setAssignStudentId] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    financeService.descontos.getAll().then(setRows).catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar descontos"));
    academyService.getStudents().then(setStudents).catch(() => {});
  }, [refresh]);

  function openNew() {
    setDraft(EMPTY);
    setError(null);
    setModalNew(true);
  }

  async function saveNew() {
    if (!draft.nome.trim()) { setError("Preencha o nome da regra."); return; }
    try {
      await financeService.descontos.create(draft);
      setModalNew(false);
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Desconto criado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao criar desconto";
      setError(message);
      toast.error(message);
    }
  }

  function startEdit(d: Desconto) {
    setDraft({ nome: d.nome, tipo: d.tipo, valor: d.valor, unidade: d.unidade, motivo: d.motivo, responsavel: d.responsavel, vigenciaInicio: d.vigenciaInicio.slice(0, 10), vigenciaFim: d.vigenciaFim.slice(0, 10), ativo: d.ativo });
    setError(null);
    setEditing(true);
  }

  async function saveEdit() {
    if (!selected) return;
    try {
      const updated = await financeService.descontos.update(selected.id, draft);
      setSelected(updated);
      setEditing(false);
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Desconto atualizado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao salvar desconto";
      setError(message);
      toast.error(message);
    }
  }

  async function doDelete() {
    if (!selected) return;
    try {
      await financeService.descontos.remove(selected.id);
      setSelected(null);
      setRefresh((r) => r + 1);
      toast.success("Desconto excluído com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao excluir desconto");
    }
  }

  async function doAssign() {
    if (!selected || !assignStudentId) return;
    try {
      await financeService.descontos.atribuir(selected.id, assignStudentId);
      setAssignOpen(false);
      setAssignStudentId("");
      setRefresh((r) => r + 1);
      toast.success("Desconto atribuído ao aluno com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao atribuir desconto";
      setError(message);
      toast.error(message);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Rooster Finance"
        title="Descontos e Bolsas"
        description="Sistema flexível de bolsas, descontos, convênios e promoções aplicáveis às mensalidades."
        actions={canManage ? <Btn variant="solid" onClick={openNew}><Plus className="h-4 w-4" /> Nova regra</Btn> : undefined}
      />

      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((d) => {
          const meta = KIND_META[d.tipo];
          const isBolsa = d.tipo.includes("bolsa");
          return (
            <button key={d.id} onClick={() => { setSelected(d); setEditing(false); }} className="rounded-2xl border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-start justify-between">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `color-mix(in oklab, ${meta.tone} 12%, transparent)`, color: meta.tone }}>
                  {isBolsa ? <Award className="h-5 w-5" /> : <TicketPercent className="h-5 w-5" />}
                </span>
                <span className="rounded-md px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: `color-mix(in oklab, ${meta.tone} 12%, transparent)`, color: meta.tone }}>
                  {meta.label}
                  {!d.ativo && " · inativo"}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold">{d.nome}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{d.motivo || "—"}</p>

              <div className="mt-4 flex items-end justify-between border-t pt-3">
                <div>
                  <div className="text-xs text-muted-foreground">Valor</div>
                  <div className="text-lg font-semibold">{d.unidade === "percent" ? `${d.valor}%` : `R$ ${d.valor.toFixed(2)}`}</div>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <div className="flex items-center justify-end gap-1"><Users className="h-3 w-3" /> {d.beneficiarios} beneficiário(s)</div>
                  <div className="mt-1 flex items-center justify-end gap-1"><Calendar className="h-3 w-3" /> {fmtDate(d.vigenciaInicio)} → {fmtDate(d.vigenciaFim)}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">Responsável: <span className="text-foreground">{d.responsavel || "—"}</span></div>
            </button>
          );
        })}
        {rows.length === 0 && <p className="col-span-full text-center text-sm text-muted-foreground">Nenhuma regra de desconto cadastrada.</p>}
      </div>

      <Drawer
        open={!!selected}
        onClose={() => { setSelected(null); setEditing(false); }}
        title={selected?.nome ?? ""}
        subtitle={selected ? KIND_META[selected.tipo].label : undefined}
        actions={canManage && selected ? (
          editing ? (
            <>
              <Btn onClick={() => setEditing(false)}>Cancelar</Btn>
              <Btn variant="solid" onClick={saveEdit}>Salvar</Btn>
            </>
          ) : (
            <>
              <Btn onClick={() => setConfirmDelete(true)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /> Excluir</Btn>
              <Btn onClick={() => setAssignOpen(true)}><UserPlus className="h-3.5 w-3.5" /> Atribuir a aluno</Btn>
              <Btn variant="solid" onClick={() => startEdit(selected)}><Pencil className="h-3.5 w-3.5" /> Editar</Btn>
            </>
          )
        ) : undefined}
      >
        {selected && !editing && (
          <SectionCard title="Detalhes">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-[11px] text-muted-foreground">Valor</dt><dd>{selected.unidade === "percent" ? `${selected.valor}%` : `R$ ${selected.valor.toFixed(2)}`}</dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Beneficiários</dt><dd>{selected.beneficiarios}</dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Vigência</dt><dd>{fmtDate(selected.vigenciaInicio)} → {fmtDate(selected.vigenciaFim)}</dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Responsável</dt><dd>{selected.responsavel || "—"}</dd></div>
              <div className="col-span-2"><dt className="text-[11px] text-muted-foreground">Motivo</dt><dd className="text-muted-foreground">{selected.motivo || "—"}</dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Status</dt><dd>{selected.ativo ? "Ativo" : "Inativo"}</dd></div>
            </dl>
          </SectionCard>
        )}
        {selected && editing && <DiscountForm draft={draft} setDraft={setDraft} error={error} />}
      </Drawer>

      <Modal open={modalNew} onClose={() => setModalNew(false)} title="Nova regra de desconto" description="Cadastre uma bolsa, desconto, convênio ou promoção." footer={<><Btn onClick={() => setModalNew(false)}>Cancelar</Btn><Btn variant="solid" onClick={saveNew}>Salvar</Btn></>}>
        <DiscountForm draft={draft} setDraft={setDraft} error={error} />
      </Modal>

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Atribuir desconto a aluno"
        description={selected ? `Aplica "${selected.nome}" ao aluno selecionado.` : undefined}
        footer={<><Btn onClick={() => setAssignOpen(false)}>Cancelar</Btn><Btn variant="solid" onClick={doAssign}>Atribuir</Btn></>}
      >
        <Field label="Aluno">
          <SelectInput
            value={assignStudentId}
            onChange={(e) => setAssignStudentId(e.target.value)}
            options={students.map((s) => ({ value: s.id, label: `${s.name} — ${s.ra}` }))}
            placeholder="Selecione um aluno"
          />
        </Field>
        {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
      </Modal>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={doDelete} title="Excluir regra de desconto" description="Alunos com esta regra atribuída perdem o desconto imediatamente." />
    </>
  );
}

function DiscountForm({ draft, setDraft, error }: { draft: Draft; setDraft: (d: Draft) => void; error?: string | null }) {
  return (
    <div className="space-y-3">
      <Field label="Nome"><TextInput value={draft.nome} onChange={(e) => setDraft({ ...draft, nome: e.target.value })} placeholder="Ex. Bolsa Mérito 50%" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Tipo"><SelectInput value={draft.tipo} onChange={(e) => setDraft({ ...draft, tipo: e.target.value as TipoDesconto })} options={KIND_OPTIONS} /></Field>
        <Field label="Unidade"><SelectInput value={draft.unidade} onChange={(e) => setDraft({ ...draft, unidade: e.target.value as UnidadeDesconto })} options={[{ value: "percent", label: "Percentual (%)" }, { value: "fixo", label: "Valor fixo (R$)" }]} /></Field>
      </div>
      <Field label="Valor"><TextInput type="number" min={0} step="0.01" value={draft.valor} onChange={(e) => setDraft({ ...draft, valor: Number(e.target.value) })} /></Field>
      <Field label="Motivo"><TextArea value={draft.motivo} onChange={(e) => setDraft({ ...draft, motivo: e.target.value })} placeholder="Critério de concessão." /></Field>
      <Field label="Responsável"><TextInput value={draft.responsavel} onChange={(e) => setDraft({ ...draft, responsavel: e.target.value })} placeholder="Setor ou pessoa responsável" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Início da vigência"><TextInput type="date" value={draft.vigenciaInicio} onChange={(e) => setDraft({ ...draft, vigenciaInicio: e.target.value })} /></Field>
        <Field label="Fim da vigência"><TextInput type="date" value={draft.vigenciaFim} onChange={(e) => setDraft({ ...draft, vigenciaFim: e.target.value })} /></Field>
      </div>
      <Field label="Status">
        <SelectInput value={draft.ativo ? "ativo" : "inativo"} onChange={(e) => setDraft({ ...draft, ativo: e.target.value === "ativo" })} options={[{ value: "ativo", label: "Ativo" }, { value: "inativo", label: "Inativo" }]} />
      </Field>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
