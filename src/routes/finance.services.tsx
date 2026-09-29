import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { financeService, type Servico, type FrequenciaServico, type PoliticaMultaJuros } from "@/services/mock-api/finance.service";
import {
  CrudToolbar, Drawer, Modal, ConfirmDialog,
  Field, TextInput, TextArea, SelectInput, Btn, SectionCard,
} from "@/components/shared";
import { brl, fmtDate } from "@/components/rooster/finance/format";
import { financeCan } from "@/components/rooster/finance/permissions";
import { useRole } from "@/components/rooster/role-context";
import { PageHeader } from "@/components/rooster/page-header";

export const Route = createFileRoute("/finance/services")({ component: Services });

const FREQ_LABEL: Record<FrequenciaServico, string> = { unico: "Único", mensal: "Mensal", anual: "Anual", semestral: "Semestral" };
const FREQ_OPTIONS = (Object.keys(FREQ_LABEL) as FrequenciaServico[]).map((v) => ({ value: v, label: FREQ_LABEL[v] }));

type Draft = { nome: string; descricao: string; preco: number; categoria: string; frequencia: FrequenciaServico; ativo: boolean; politicaMultaJurosId: string };
const EMPTY: Draft = { nome: "", descricao: "", preco: 0, categoria: "", frequencia: "mensal", ativo: true, politicaMultaJurosId: "" };

function Services() {
  const { role } = useRole();
  const canManage = financeCan(role, "manageServices");
  const [rows, setRows] = useState<Servico[]>([]);
  const [politicas, setPoliticas] = useState<PoliticaMultaJuros[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Servico | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [modalNew, setModalNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    financeService.servicos.getAll().then(setRows).catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar serviços"));
    financeService.politicas.getAll().then(setPoliticas).catch(() => {});
  }, [refresh]);

  const politicaNome = (id?: string) => politicas.find((p) => p.id === id)?.nome ?? "—";

  const items = rows.filter((s) => !q || s.nome.toLowerCase().includes(q.toLowerCase()));

  function openNew() {
    setDraft(EMPTY);
    setError(null);
    setModalNew(true);
  }

  async function saveNew() {
    if (!draft.nome.trim()) { setError("Preencha o nome do serviço."); return; }
    try {
      await financeService.servicos.create(draft);
      setModalNew(false);
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Serviço criado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao criar serviço";
      setError(message);
      toast.error(message);
    }
  }

  function startEdit(s: Servico) {
    setDraft({ nome: s.nome, descricao: s.descricao, preco: s.preco, categoria: s.categoria, frequencia: s.frequencia, ativo: s.ativo, politicaMultaJurosId: s.politicaMultaJurosId ?? "" });
    setError(null);
    setEditing(true);
  }

  async function saveEdit() {
    if (!selected) return;
    try {
      const updated = await financeService.servicos.update(selected.id, draft);
      setSelected(updated);
      setEditing(false);
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Serviço atualizado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao salvar serviço";
      setError(message);
      toast.error(message);
    }
  }

  async function doDelete() {
    if (!selected) return;
    try {
      await financeService.servicos.remove(selected.id);
      setSelected(null);
      setRefresh((r) => r + 1);
      toast.success("Serviço excluído com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao excluir serviço");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Rooster Finance"
        title="Serviços"
        description="Serviços oferecidos pela instituição, com valor e frequência de cobrança — usados para gerar mensalidades e outras cobranças."
        actions={canManage ? <Btn variant="solid" onClick={openNew}><Plus className="h-4 w-4" /> Novo serviço</Btn> : undefined}
      />

      <CrudToolbar search={q} onSearch={setQ} placeholder="Buscar serviço…" />

      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {items.map((s) => (
          <button key={s.id} onClick={() => { setSelected(s); setEditing(false); }} className="rounded-2xl border bg-card p-5 text-left shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "color-mix(in oklab, oklch(0.68 0.14 195) 12%, transparent)", color: "oklch(0.68 0.14 195)" }}>
                  <Wrench className="h-5 w-5" />
                </span>
                <div>
                  <div className="text-xs text-muted-foreground">{s.categoria || "—"}</div>
                  <div className="text-sm font-semibold">{s.nome}</div>
                </div>
              </div>
              <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium">{FREQ_LABEL[s.frequencia]}</span>
            </div>
            <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{s.descricao || "Sem descrição."}</p>
            <div className="mt-4 flex items-end justify-between border-t pt-3">
              <div>
                <div className="text-xs text-muted-foreground">Valor atual</div>
                <div className="text-lg font-semibold">{brl(s.preco)}</div>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                {!s.ativo && <div className="font-medium text-destructive">Inativo</div>}
                <div>Atualizado em {fmtDate(s.atualizadoEm)}</div>
              </div>
            </div>
          </button>
        ))}
        {items.length === 0 && <p className="col-span-full text-center text-sm text-muted-foreground">Nenhum serviço encontrado.</p>}
      </div>

      <Drawer
        open={!!selected}
        onClose={() => { setSelected(null); setEditing(false); }}
        title={selected?.nome ?? ""}
        subtitle={selected?.categoria}
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
              <div><dt className="text-[11px] text-muted-foreground">Valor</dt><dd>{brl(selected.preco)}</dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Frequência</dt><dd>{FREQ_LABEL[selected.frequencia]}</dd></div>
              <div className="col-span-2"><dt className="text-[11px] text-muted-foreground">Descrição</dt><dd className="text-muted-foreground">{selected.descricao || "—"}</dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Status</dt><dd>{selected.ativo ? "Ativo" : "Inativo"}</dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Política de multa/juros</dt><dd>{politicaNome(selected.politicaMultaJurosId)}</dd></div>
            </dl>
          </SectionCard>
        )}
        {selected && editing && <ServiceForm draft={draft} setDraft={setDraft} error={error} politicas={politicas} />}
      </Drawer>

      <Modal open={modalNew} onClose={() => setModalNew(false)} title="Novo serviço" description="Cadastre um serviço financeiro." footer={<><Btn onClick={() => setModalNew(false)}>Cancelar</Btn><Btn variant="solid" onClick={saveNew}>Salvar</Btn></>}>
        <ServiceForm draft={draft} setDraft={setDraft} error={error} politicas={politicas} />
      </Modal>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={doDelete} title="Excluir serviço" description="Esta ação removerá o serviço do catálogo." />
    </>
  );
}

function ServiceForm({ draft, setDraft, error, politicas }: { draft: Draft; setDraft: (d: Draft) => void; error?: string | null; politicas: PoliticaMultaJuros[] }) {
  return (
    <div className="space-y-3">
      <Field label="Nome"><TextInput value={draft.nome} onChange={(e) => setDraft({ ...draft, nome: e.target.value })} placeholder="Ex. Mensalidade — Graduação" /></Field>
      <Field label="Descrição"><TextArea value={draft.descricao} onChange={(e) => setDraft({ ...draft, descricao: e.target.value })} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Categoria"><TextInput value={draft.categoria} onChange={(e) => setDraft({ ...draft, categoria: e.target.value })} placeholder="Mensalidade, Taxa…" /></Field>
        <Field label="Preço (R$)"><TextInput type="number" min={0} step="0.01" value={draft.preco} onChange={(e) => setDraft({ ...draft, preco: Number(e.target.value) })} /></Field>
      </div>
      <Field label="Frequência"><SelectInput value={draft.frequencia} onChange={(e) => setDraft({ ...draft, frequencia: e.target.value as FrequenciaServico })} options={FREQ_OPTIONS} /></Field>
      <Field label="Política de multa/juros" hint="Aplicada automaticamente às cobranças geradas por este serviço, salvo quando a cobrança define multa/juros manualmente.">
        <SelectInput
          value={draft.politicaMultaJurosId}
          onChange={(e) => setDraft({ ...draft, politicaMultaJurosId: e.target.value })}
          placeholder="Nenhuma"
          options={politicas.filter((p) => p.ativo).map((p) => ({ value: p.id, label: p.nome }))}
        />
      </Field>
      <Field label="Status">
        <SelectInput value={draft.ativo ? "ativo" : "inativo"} onChange={(e) => setDraft({ ...draft, ativo: e.target.value === "ativo" })} options={[{ value: "ativo", label: "Ativo" }, { value: "inativo", label: "Inativo" }]} />
      </Field>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
