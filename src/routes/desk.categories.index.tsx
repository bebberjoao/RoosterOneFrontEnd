import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Breadcrumbs, CrudHeader, CrudToolbar, Btn, Select, Modal, ConfirmDialog,
  Field, TextInput, SelectInput, EmptyState,
} from "@/components/shared";
import { useDeskCategories, categoriesApi, SECTORS, type DeskCategory } from "@/components/rooster/desk/categories-store";
import { Tags, Plus, Pencil, Trash2, Clock, ChevronRight, Layers } from "lucide-react";

export const Route = createFileRoute("/desk/categories/")({
  head: () => ({
    meta: [
      { title: "Categorias de chamados — Rooster Desk" },
      { name: "description", content: "Cada setor cadastra suas categorias de tickets e o SLA de atendimento." },
      { property: "og:title", content: "Categorias de chamados — Rooster Desk" },
      { property: "og:description", content: "Gestão de categorias e SLA por setor no Rooster Desk." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const cats = useDeskCategories();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [sector, setSector] = useState("all");
  const [editing, setEditing] = useState<DeskCategory | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<DeskCategory | null>(null);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    return cats.filter((c) => {
      if (sector !== "all" && c.sector !== sector) return false;
      if (s && !`${c.name} ${c.owner} ${c.sector}`.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [cats, q, sector]);

  return (
    <>
      <Breadcrumbs items={[{ label: "Rooster Desk" }, { label: "Categorias" }]} />
      <CrudHeader
        title="Categorias"
        description="Cada setor define suas categorias e o SLA padrão. Clique em uma categoria para gerenciar subcategorias e atendentes."
        actions={
          <Btn variant="solid" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="h-4 w-4" /> Nova categoria
          </Btn>
        }
      />

      <CrudToolbar
        search={q}
        onSearch={setQ}
        placeholder="Buscar por categoria, setor ou responsável"
        filters={
          <Select
            value={sector}
            onChange={setSector}
            options={[{ value: "all", label: "Todos os setores" }, ...SECTORS.map((s) => ({ value: s, label: s }))]}
          />
        }
      />

      {filtered.length === 0 ? (
        <EmptyState icon={Tags} title="Nenhuma categoria encontrada" description="Ajuste os filtros ou cadastre uma nova categoria." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => navigate({ to: "/desk/categories/$id", params: { id: c.id } })}
              className="group rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-accent/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">{c.name}</h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">{c.sector} · {c.owner}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </div>

              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> SLA médio {c.slaHours}h</span>
                <span className="inline-flex items-center gap-1.5"><Layers className="h-3.5 w-3.5" /> {c.subcategories.length} subcategorias</span>
              </div>

              <div className="mt-4 flex justify-end gap-1 border-t pt-3">
                <span
                  role="button"
                  tabIndex={0}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                  onClick={(e) => { e.stopPropagation(); setEditing(c); setOpen(true); }}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </span>
                <span
                  role="button"
                  tabIndex={0}
                  className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); setToDelete(c); }}
                  onKeyDown={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <CategoryModal key={editing?.id ?? "new"} open={open} cat={editing} onClose={() => { setOpen(false); setEditing(null); }} />
      <ConfirmDialog
        open={!!toDelete}
        title="Excluir categoria"
        description={`Remover "${toDelete?.name}" e suas subcategorias?`}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            categoriesApi.remove(toDelete.id)
              .then(() => toast.success("Categoria excluída com sucesso"))
              .catch((err) => toast.error(err instanceof Error ? err.message : "Falha ao excluir categoria"));
          }
          setToDelete(null);
        }}
      />
    </>
  );
}

function CategoryModal({ open, cat, onClose }: { open: boolean; cat: DeskCategory | null; onClose: () => void }) {
  const [name, setName] = useState(cat?.name ?? "");
  const [sector, setSector] = useState(cat?.sector ?? SECTORS[0]);
  const [owner, setOwner] = useState(cat?.owner ?? "");
  const [sla, setSla] = useState(String(cat?.slaHours ?? 8));

  function submit() {
    if (!name.trim()) return;
    const isEdit = !!cat;
    categoriesApi.upsert({
      id: cat?.id ?? `cat-${Date.now()}`,
      name: name.trim(),
      sector,
      owner: owner.trim() || "—",
      slaHours: Number(sla) || 8,
      subcategories: cat?.subcategories ?? [],
    })
      .then(() => toast.success(isEdit ? "Categoria atualizada com sucesso" : "Categoria criada com sucesso"))
      .catch((err) => toast.error(err instanceof Error ? err.message : "Falha ao salvar categoria"));
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={cat ? "Editar categoria" : "Nova categoria"}
      description="Defina o setor responsável e o SLA padrão de atendimento."
      footer={
        <>
          <Btn onClick={onClose}>Cancelar</Btn>
          <Btn variant="solid" onClick={submit}>Salvar</Btn>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Nome da categoria" className="md:col-span-2">
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Audiovisual" />
        </Field>
        <Field label="Setor">
          <SelectInput value={sector} onChange={(e) => setSector(e.target.value)} options={SECTORS.map((s) => ({ value: s, label: s }))} />
        </Field>
        <Field label="Responsável">
          <TextInput value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="Nome do responsável" />
        </Field>
        <Field label="SLA médio (horas)">
          <TextInput type="number" min={1} value={sla} onChange={(e) => setSla(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}
