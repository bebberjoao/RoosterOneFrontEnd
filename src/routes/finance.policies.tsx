import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Scale, Trash2 } from "lucide-react";
import { financeService, type PoliticaMultaJuros } from "@/services/mock-api/finance.service";
import {
  CrudToolbar, Drawer, Modal, ConfirmDialog,
  Field, TextInput, TextArea, SelectInput, Btn, SectionCard,
} from "@/components/shared";
import { financeCan } from "@/components/rooster/finance/permissions";
import { useRole } from "@/components/rooster/role-context";
import { PageHeader } from "@/components/rooster/page-header";

export const Route = createFileRoute("/finance/policies")({ component: Policies });

type Draft = { nome: string; descricao: string; percentualMulta: number; percentualJurosDia: number; diasCarencia: number; ativo: boolean };
const EMPTY: Draft = { nome: "", descricao: "", percentualMulta: 2, percentualJurosDia: 0.033, diasCarencia: 0, ativo: true };

function Policies() {
  const { role } = useRole();
  const canManage = financeCan(role, "managePolicies");
  const [rows, setRows] = useState<PoliticaMultaJuros[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<PoliticaMultaJuros | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [modalNew, setModalNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    financeService.politicas.getAll().then(setRows).catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar políticas"));
  }, [refresh]);

  const items = rows.filter((p) => !q || p.nome.toLowerCase().includes(q.toLowerCase()));

  function openNew() {
    setDraft(EMPTY);
    setError(null);
    setModalNew(true);
  }

  async function saveNew() {
    if (!draft.nome.trim()) { setError("Preencha o nome da política."); return; }
    try {
      await financeService.politicas.create(draft);
      setModalNew(false);
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Política criada com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao criar política";
      setError(message);
      toast.error(message);
    }
  }

  function startEdit(p: PoliticaMultaJuros) {
    setDraft({ nome: p.nome, descricao: p.descricao, percentualMulta: p.percentualMulta, percentualJurosDia: p.percentualJurosDia, diasCarencia: p.diasCarencia, ativo: p.ativo });
    setError(null);
    setEditing(true);
  }

  async function saveEdit() {
    if (!selected) return;
    try {
      const updated = await financeService.politicas.update(selected.id, draft);
      setSelected(updated);
      setEditing(false);
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Política atualizada com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao salvar política";
      setError(message);
      toast.error(message);
    }
  }

  async function doDelete() {
    if (!selected) return;
    try {
      await financeService.politicas.remove(selected.id);
      setSelected(null);
      setConfirmDelete(false);
      setRefresh((r) => r + 1);
      toast.success("Política excluída com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível excluir — confira se ela ainda está em uso por algum serviço ou cobrança.";
      toast.error(message);
      setConfirmDelete(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Rooster Finance"
        title="Políticas de multa/juros"
        description="Regras de multa e juros de mora criadas pelo próprio financeiro e aplicadas a serviços e cobranças — sem depender de um valor fixo no código."
        actions={canManage ? <Btn variant="solid" onClick={openNew}><Plus className="h-4 w-4" /> Nova política</Btn> : undefined}
      />

      <CrudToolbar search={q} onSearch={setQ} placeholder="Buscar política…" />

      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((p) => (
          <button key={p.id} onClick={() => { setSelected(p); setEditing(false); }} className="rounded-2xl border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-foreground">
                <Scale className="h-5 w-5" />
              </span>
              {!p.ativo && <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">Inativa</span>}
            </div>
            <h3 className="mt-3 text-sm font-semibold">{p.nome}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{p.descricao || "—"}</p>
            <div className="mt-4 flex items-end justify-between border-t pt-3 text-xs text-muted-foreground">
              <div><div>Multa</div><div className="text-lg font-semibold text-foreground">{p.percentualMulta}%</div></div>
              <div><div>Juros/dia</div><div className="text-lg font-semibold text-foreground">{p.percentualJurosDia}%</div></div>
              <div><div>Carência</div><div className="text-lg font-semibold text-foreground">{p.diasCarencia}d</div></div>
            </div>
          </button>
        ))}
        {items.length === 0 && <p className="col-span-full text-center text-sm text-muted-foreground">Nenhuma política de multa/juros cadastrada.</p>}
      </div>

      <Drawer
        open={!!selected}
        onClose={() => { setSelected(null); setEditing(false); }}
        title={selected?.nome ?? ""}
        actions={canManage && selected ? (
          editing ? (
            <>
              <Btn onClick={() => setEditing(false)}>Cancelar</Btn>
              <Btn variant="solid" onClick={saveEdit}>Salvar</Btn>
            </>
          ) : (
            <>
              <Btn onClick={() => setConfirmDelete(true)} className="text-destructive"><Trash2 className="h-3.5 w-3.5" /> Excluir</Btn>
              <Btn variant="solid" onClick={() => startEdit(selected)}><Pencil className="h-3.5 w-3.5" /> Editar</Btn>
            </>
          )
        ) : undefined}
      >
        {selected && !editing && (
          <SectionCard title="Detalhes">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-[11px] text-muted-foreground">Multa</dt><dd>{selected.percentualMulta}%</dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Juros ao dia</dt><dd>{selected.percentualJurosDia}%</dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Carência</dt><dd>{selected.diasCarencia} dia(s)</dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Status</dt><dd>{selected.ativo ? "Ativa" : "Inativa"}</dd></div>
              <div className="col-span-2"><dt className="text-[11px] text-muted-foreground">Descrição</dt><dd className="text-muted-foreground">{selected.descricao || "—"}</dd></div>
            </dl>
          </SectionCard>
        )}
        {selected && editing && <PolicyForm draft={draft} setDraft={setDraft} error={error} />}
      </Drawer>

      <Modal open={modalNew} onClose={() => setModalNew(false)} title="Nova política de multa/juros" description="Ela pode ser vinculada a serviços (herdada por toda cobrança gerada) ou diretamente a uma cobrança." footer={<><Btn onClick={() => setModalNew(false)}>Cancelar</Btn><Btn variant="solid" onClick={saveNew}>Salvar</Btn></>}>
        <PolicyForm draft={draft} setDraft={setDraft} error={error} />
      </Modal>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={doDelete} title="Excluir política" description="Só é possível excluir uma política que não está em uso por nenhum serviço ou cobrança." />
    </>
  );
}

function PolicyForm({ draft, setDraft, error }: { draft: Draft; setDraft: (d: Draft) => void; error?: string | null }) {
  return (
    <div className="space-y-3">
      <Field label="Nome"><TextInput value={draft.nome} onChange={(e) => setDraft({ ...draft, nome: e.target.value })} placeholder="Ex. Mensalidade — padrão institucional" /></Field>
      <Field label="Descrição"><TextArea value={draft.descricao} onChange={(e) => setDraft({ ...draft, descricao: e.target.value })} placeholder="Contexto de quando usar esta regra." /></Field>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Multa (%)"><TextInput type="number" min={0} max={100} step="0.01" value={draft.percentualMulta} onChange={(e) => setDraft({ ...draft, percentualMulta: Number(e.target.value) })} /></Field>
        <Field label="Juros/dia (%)"><TextInput type="number" min={0} max={100} step="0.001" value={draft.percentualJurosDia} onChange={(e) => setDraft({ ...draft, percentualJurosDia: Number(e.target.value) })} /></Field>
        <Field label="Carência (dias)"><TextInput type="number" min={0} step="1" value={draft.diasCarencia} onChange={(e) => setDraft({ ...draft, diasCarencia: Number(e.target.value) })} /></Field>
      </div>
      <Field label="Status">
        <SelectInput value={draft.ativo ? "ativo" : "inativo"} onChange={(e) => setDraft({ ...draft, ativo: e.target.value === "ativo" })} options={[{ value: "ativo", label: "Ativa" }, { value: "inativo", label: "Inativa" }]} />
      </Field>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
