import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Breadcrumbs, CrudHeader, Btn, Modal, ConfirmDialog, Field, TextInput, EmptyState,
} from "@/components/shared";
import { useDeskCategories, categoriesApi, type Subcategory } from "@/components/rooster/desk/categories-store";
import { Layers, Plus, Pencil, Trash2, Clock, ArrowLeft, UserCog } from "lucide-react";

export const Route = createFileRoute("/desk/categories/$id")({
  head: () => ({
    meta: [
      { title: "Subcategorias — Rooster Desk" },
      { name: "description", content: "Cadastre subcategorias e defina o SLA de atendimento de cada uma." },
      { property: "og:title", content: "Subcategorias — Rooster Desk" },
      { property: "og:description", content: "Subcategorias e SLA por categoria de chamados." },
    ],
  }),
  component: SubcategoriesPage,
});

function SubcategoriesPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const cat = useDeskCategories().find((c) => c.id === id);

  const [editing, setEditing] = useState<Subcategory | null>(null);
  const [open, setOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Subcategory | null>(null);

  if (!cat) {
    return (
      <>
        <Breadcrumbs items={[{ label: "Rooster Desk" }, { label: "Categorias" }]} />
        <EmptyState icon={Layers} title="Categoria não encontrada" description="Ela pode ter sido removida." />
      </>
    );
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Rooster Desk" },
          { label: "Categorias", onClick: () => navigate({ to: "/desk/categories" }) },
          { label: cat.name },
        ]}
      />
      <CrudHeader
        title={cat.name}
        description={`${cat.sector} · Responsável: ${cat.owner} · SLA médio ${cat.slaHours}h`}
        actions={
          <>
            <Btn onClick={() => navigate({ to: "/desk/categories" })}>
              <ArrowLeft className="h-4 w-4" /> Voltar
            </Btn>
            <Btn onClick={() => navigate({ to: "/desk/team" })}>
              <UserCog className="h-4 w-4" /> Gerenciar atendentes
            </Btn>
            <Btn variant="solid" onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="h-4 w-4" /> Nova subcategoria
            </Btn>
          </>
        }
      />

      {cat.subcategories.length === 0 ? (
        <EmptyState icon={Layers} title="Nenhuma subcategoria" description="Cadastre a primeira subcategoria desta categoria." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {cat.subcategories.map((s) => (
            <div key={s.id} className="rounded-xl border p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold">{s.name}</h3>
                  <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" /> SLA {s.slaHours}h
                  </p>
                </div>
                <div className="flex gap-1">
                  <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => { setEditing(s); setOpen(true); }}>
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive" onClick={() => setToDelete(s)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      <SubModal
        key={editing?.id ?? "new"}
        open={open}
        sub={editing}
        defaultSla={cat.slaHours}
        onClose={() => { setOpen(false); setEditing(null); }}
        onSave={(data) => {
          if (editing) categoriesApi.updateSub(cat.id, editing.id, data);
          else categoriesApi.addSub(cat.id, data);
          setOpen(false);
          setEditing(null);
        }}
      />
      <ConfirmDialog
        open={!!toDelete}
        title="Excluir subcategoria"
        description={`Remover "${toDelete?.name}"?`}
        onClose={() => setToDelete(null)}
        onConfirm={() => { if (toDelete) categoriesApi.removeSub(cat.id, toDelete.id); setToDelete(null); }}
      />
    </>
  );
}

function SubModal({
  open, sub, defaultSla, onClose, onSave,
}: {
  open: boolean;
  sub: Subcategory | null;
  defaultSla: number;
  onClose: () => void;
  onSave: (data: Omit<Subcategory, "id">) => void;
}) {
  const [name, setName] = useState(sub?.name ?? "");
  const [sla, setSla] = useState(String(sub?.slaHours ?? defaultSla));
  const assignees = sub?.assignees ?? [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={sub ? "Editar subcategoria" : "Nova subcategoria"}
      description="Defina o nome e o SLA de atendimento desta subcategoria."
      footer={
        <>
          <Btn onClick={onClose}>Cancelar</Btn>
          <Btn variant="solid" onClick={() => name.trim() && onSave({ name: name.trim(), slaHours: Number(sla) || defaultSla, assignees })}>
            Salvar
          </Btn>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
          <Field label="Nome da subcategoria">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Projetores" />
          </Field>
          <Field label="SLA (horas)">
            <TextInput type="number" min={1} value={sla} onChange={(e) => setSla(e.target.value)} />
          </Field>
      </div>
    </Modal>
  );
}
