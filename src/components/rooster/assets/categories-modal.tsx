import { useState } from "react";
import { Modal, ConfirmDialog, Btn, Field, TextInput } from "@/components/shared";
import { CategoryChip } from "./ui";
import { useAssets } from "./store";
import { assetsCan, type AssetsPerm } from "./permissions";
import { useRole } from "@/components/rooster/role-context";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import type { AssetCategory } from "./mock-data";

const TONES = [
  "oklch(0.55 0.19 265)", "oklch(0.68 0.14 195)", "oklch(0.6 0.2 305)", "oklch(0.68 0.18 40)",
  "oklch(0.72 0.14 90)", "oklch(0.62 0.18 155)", "oklch(0.65 0.18 25)", "oklch(0.65 0.05 260)",
];

export function CategoriesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { role } = useRole();
  const { categories, assets, createCategory, updateCategory, deleteCategory } = useAssets();
  const can = assetsCan(role, "manageCategories" as AssetsPerm);

  const [editing, setEditing] = useState<AssetCategory | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [toDelete, setToDelete] = useState<AssetCategory | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tone, setTone] = useState(TONES[0]);

  const start = (c?: AssetCategory) => {
    setEditing(c ?? null);
    setName(c?.name ?? "");
    setDescription(c?.description ?? "");
    setTone(c?.tone ?? TONES[0]);
    setEditorOpen(true);
  };

  const save = () => {
    if (!name.trim()) return;
    if (editing) updateCategory(editing.id, { name, description, tone });
    else createCategory({ name, description, tone });
    setEditorOpen(false);
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title="Categorias de patrimônio" description="Classifique o patrimônio com categorias configuráveis." size="lg"
        footer={can ? <Btn variant="solid" onClick={() => start()}><Plus className="h-4 w-4" /> Nova categoria</Btn> : undefined}
      >
        {categories.length === 0 ? (
          <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            <Tags className="mx-auto mb-2 h-5 w-5" /> Nenhuma categoria cadastrada.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2.5 font-medium">Categoria</th>
                  <th className="px-3 py-2.5 font-medium">Descrição</th>
                  <th className="px-3 py-2.5 font-medium">Patrimônios</th>
                  <th className="px-3 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {categories.map((c) => {
                  const count = assets.filter((a) => a.categoryId === c.id).length;
                  return (
                    <tr key={c.id}>
                      <td className="px-3 py-2.5"><CategoryChip name={c.name} tone={c.tone} /></td>
                      <td className="px-3 py-2.5 text-muted-foreground">{c.description ?? "—"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{count}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-1">
                          {can ? (
                            <button onClick={() => start(c)} className="rounded-md border p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Editar">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                          {can ? (
                            <button
                              onClick={() => count === 0 && setToDelete(c)}
                              disabled={count > 0}
                              title={count > 0 ? "Categoria em uso" : "Excluir"}
                              className="rounded-md border p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-40"
                              aria-label="Excluir"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <Modal
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        title={editing ? "Editar categoria" : "Nova categoria"}
        footer={<><Btn onClick={() => setEditorOpen(false)}>Cancelar</Btn><Btn variant="solid" onClick={save}>Salvar</Btn></>}
      >
        <div className="space-y-4">
          <Field label="Nome *"><TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Equipamentos de rede" /></Field>
          <Field label="Descrição"><TextInput value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
          <Field label="Cor de identificação">
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setTone(t)}
                  className="h-7 w-7 rounded-lg border-2 transition-transform hover:scale-105"
                  style={{ background: t, borderColor: tone === t ? "var(--foreground)" : "transparent" }}
                  aria-label={`Cor ${t}`}
                />
              ))}
            </div>
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteCategory(toDelete.id)}
        title="Excluir categoria"
        description={`A categoria "${toDelete?.name}" será removida permanentemente.`}
      />
    </>
  );
}
