import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, Package as PackageIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { financeService, type Produto } from "@/services/mock-api/finance.service";
import {
  CrudToolbar, DataTable, type Column, Drawer, Modal, ConfirmDialog,
  Field, TextInput, TextArea, SelectInput, Btn, Select, SectionCard,
} from "@/components/shared";
import { brl } from "@/components/rooster/finance/format";
import { financeCan } from "@/components/rooster/finance/permissions";
import { useRole } from "@/components/rooster/role-context";
import { PageHeader } from "@/components/rooster/page-header";

export const Route = createFileRoute("/finance/products")({ component: Products });

const CATEGORIES = ["Livros", "Uniformes", "Materiais", "Kits", "Crachás", "Equipamentos"];

type Draft = {
  codigo: string; nome: string; categoria: string; descricao: string;
  preco: number; estoque: number; estoqueMinimo: number; unidade: string; ativo: boolean;
};
const EMPTY: Draft = { codigo: "", nome: "", categoria: CATEGORIES[0], descricao: "", preco: 0, estoque: 0, estoqueMinimo: 0, unidade: "un", ativo: true };

function Products() {
  const { role } = useRole();
  const canManage = financeCan(role, "manageProducts");
  const [rows, setRows] = useState<Produto[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("todas");
  const [selected, setSelected] = useState<Produto | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [modalNew, setModalNew] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    financeService.produtos.getAll().then(setRows).catch((err) => setError(err instanceof Error ? err.message : "Falha ao carregar produtos"));
  }, [refresh]);

  const items = useMemo(() => rows.filter((p) => {
    if (cat !== "todas" && p.categoria !== cat) return false;
    if (!q) return true;
    return p.nome.toLowerCase().includes(q.toLowerCase()) || p.codigo.toLowerCase().includes(q.toLowerCase());
  }), [rows, q, cat]);

  function openNew() {
    setDraft(EMPTY);
    setError(null);
    setModalNew(true);
  }

  async function saveNew() {
    if (!draft.nome.trim() || !draft.codigo.trim()) { setError("Preencha nome e código."); return; }
    try {
      await financeService.produtos.create(draft);
      setModalNew(false);
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Produto criado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao criar produto";
      setError(message);
      toast.error(message);
    }
  }

  function startEdit(p: Produto) {
    setDraft({ codigo: p.codigo, nome: p.nome, categoria: p.categoria, descricao: p.descricao, preco: p.preco, estoque: p.estoque, estoqueMinimo: p.estoqueMinimo, unidade: p.unidade, ativo: p.ativo });
    setError(null);
    setEditing(true);
  }

  async function saveEdit() {
    if (!selected) return;
    try {
      const updated = await financeService.produtos.update(selected.id, draft);
      setSelected(updated);
      setEditing(false);
      setError(null);
      setRefresh((r) => r + 1);
      toast.success("Produto atualizado com sucesso");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao salvar produto";
      setError(message);
      toast.error(message);
    }
  }

  async function doDelete() {
    if (!selected) return;
    try {
      await financeService.produtos.remove(selected.id);
      setSelected(null);
      setRefresh((r) => r + 1);
      toast.success("Produto excluído com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao excluir produto");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Rooster Finance"
        title="Produtos"
        description="Cadastro de produtos físicos comercializados pela instituição — apostilas, uniformes, kits, materiais e mais."
        actions={canManage ? <Btn variant="solid" onClick={openNew}><Plus className="h-4 w-4" /> Novo produto</Btn> : undefined}
      />

      <CrudToolbar
        search={q}
        onSearch={setQ}
        placeholder="Buscar por nome ou código…"
        filters={<Select value={cat} onChange={setCat} options={[{ value: "todas", label: "Todas categorias" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} />}
      />

      {error && <p className="mb-3 text-xs text-destructive">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((p) => {
          const low = p.estoque < p.estoqueMinimo;
          return (
            <button
              key={p.id}
              onClick={() => { setSelected(p); setEditing(false); }}
              className="group overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition-all hover:shadow-md"
            >
              <div className="relative flex aspect-[4/3] w-full items-center justify-center" style={{ background: "linear-gradient(135deg, oklch(0.62 0.18 155), oklch(0.4 0.1 155))" }}>
                <PackageIcon className="h-10 w-10 text-white/70" />
                <span className="absolute left-2 top-2 rounded-md bg-black/40 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur">{p.codigo}</span>
                {!p.ativo && <span className="absolute right-2 top-2 rounded-md bg-black/50 px-2 py-0.5 text-[10px] text-white">Inativo</span>}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs text-muted-foreground">{p.categoria || "—"}</div>
                    <div className="truncate text-sm font-semibold">{p.nome}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">{brl(p.preco)}</div>
                    <div className="text-[11px] text-muted-foreground">/ {p.unidade}</div>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{p.descricao || "Sem descrição."}</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className={low ? "flex items-center gap-1 font-medium" : "text-muted-foreground"} style={low ? { color: "oklch(0.6 0.22 25)" } : undefined}>
                    {low && <AlertTriangle className="h-3.5 w-3.5" />}
                    Estoque: {p.estoque} {p.unidade}
                  </span>
                  <span className="text-muted-foreground">mín. {p.estoqueMinimo}</span>
                </div>
              </div>
            </button>
          );
        })}
        {items.length === 0 && <p className="col-span-full text-center text-sm text-muted-foreground">Nenhum produto encontrado.</p>}
      </div>

      <Drawer
        open={!!selected}
        onClose={() => { setSelected(null); setEditing(false); }}
        title={selected?.nome ?? ""}
        subtitle={selected?.codigo}
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
              <div><dt className="text-[11px] text-muted-foreground">Código</dt><dd className="font-mono">{selected.codigo}</dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Categoria</dt><dd>{selected.categoria || "—"}</dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Preço</dt><dd>{brl(selected.preco)} / {selected.unidade}</dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Estoque</dt><dd>{selected.estoque} (mín. {selected.estoqueMinimo})</dd></div>
              <div className="col-span-2"><dt className="text-[11px] text-muted-foreground">Descrição</dt><dd className="text-muted-foreground">{selected.descricao || "—"}</dd></div>
              <div><dt className="text-[11px] text-muted-foreground">Status</dt><dd>{selected.ativo ? "Ativo" : "Inativo"}</dd></div>
            </dl>
          </SectionCard>
        )}
        {selected && editing && <ProductForm draft={draft} setDraft={setDraft} error={error} />}
      </Drawer>

      <Modal open={modalNew} onClose={() => setModalNew(false)} title="Novo produto" description="Cadastre um produto no catálogo financeiro." footer={<><Btn onClick={() => setModalNew(false)}>Cancelar</Btn><Btn variant="solid" onClick={saveNew}>Salvar</Btn></>}>
        <ProductForm draft={draft} setDraft={setDraft} error={error} />
      </Modal>

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={doDelete} title="Excluir produto" description="Esta ação removerá o produto do catálogo." />
    </>
  );
}

function ProductForm({ draft, setDraft, error }: { draft: Draft; setDraft: (d: Draft) => void; error?: string | null }) {
  return (
    <div className="space-y-3">
      <Field label="Nome"><TextInput value={draft.nome} onChange={(e) => setDraft({ ...draft, nome: e.target.value })} placeholder="Ex. Apostila de Cálculo I" /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Código"><TextInput value={draft.codigo} onChange={(e) => setDraft({ ...draft, codigo: e.target.value })} placeholder="LIV-001" /></Field>
        <Field label="Categoria"><SelectInput value={draft.categoria} onChange={(e) => setDraft({ ...draft, categoria: e.target.value })} options={CATEGORIES.map((c) => ({ value: c, label: c }))} /></Field>
      </div>
      <Field label="Descrição"><TextArea value={draft.descricao} onChange={(e) => setDraft({ ...draft, descricao: e.target.value })} placeholder="Descrição do produto." /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Preço (R$)"><TextInput type="number" min={0} step="0.01" value={draft.preco} onChange={(e) => setDraft({ ...draft, preco: Number(e.target.value) })} /></Field>
        <Field label="Unidade"><TextInput value={draft.unidade} onChange={(e) => setDraft({ ...draft, unidade: e.target.value })} placeholder="un, kit…" /></Field>
        <Field label="Estoque"><TextInput type="number" min={0} value={draft.estoque} onChange={(e) => setDraft({ ...draft, estoque: Number(e.target.value) })} /></Field>
        <Field label="Estoque mínimo"><TextInput type="number" min={0} value={draft.estoqueMinimo} onChange={(e) => setDraft({ ...draft, estoqueMinimo: Number(e.target.value) })} /></Field>
      </div>
      <Field label="Status">
        <SelectInput value={draft.ativo ? "ativo" : "inativo"} onChange={(e) => setDraft({ ...draft, ativo: e.target.value === "ativo" })} options={[{ value: "ativo", label: "Ativo" }, { value: "inativo", label: "Inativo" }]} />
      </Field>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
