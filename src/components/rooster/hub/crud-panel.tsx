import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Loader2, Pencil, Plus, RefreshCw, Trash2, WifiOff } from "lucide-react";
import { CrudToolbar } from "@/components/shared/crud-page";
import { DataTable, type Column } from "@/components/shared/data-table";
import { ConfirmDialog, Modal } from "@/components/shared/overlays";
import { Field, SelectInput, TextArea, TextInput } from "@/components/shared/form";
import { Btn } from "@/components/shared";
import type { HubResource } from "@/services/hub";
import { useApiOffline, useResource } from "./use-hub";

export type HubField<T> = {
  name: keyof T & string;
  label: string;
  type?: "text" | "email" | "password" | "textarea" | "boolean" | "select" | "datetime";
  required?: boolean;
  options?: { value: string; label: string }[];
  hint?: string;
  /** enviado apenas na criação (ex.: senhaHash) */
  createOnly?: boolean;
  validate?: (value: string) => string | undefined;
};

type FormState = Record<string, string>;

function toForm<T extends { id: string }>(fields: HubField<T>[], row?: T): FormState {
  const state: FormState = {};
  for (const f of fields) {
    const raw = row ? (row as Record<string, unknown>)[f.name] : undefined;
    state[f.name] =
      f.type === "boolean"
        ? String(raw ?? true) === "true"
          ? "true"
          : "false"
        : raw === null || raw === undefined
          ? ""
          : String(raw);
  }
  return state;
}

function toDto<T extends { id: string }>(fields: HubField<T>[], form: FormState, isCreate: boolean) {
  const dto: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.createOnly && !isCreate) continue;
    const v = form[f.name] ?? "";
    if (f.type === "boolean") dto[f.name] = v === "true";
    else if (v === "") dto[f.name] = f.required ? "" : null;
    else dto[f.name] = v;
  }
  return dto as Partial<T>;
}

export function OfflineBanner() {
  const offline = useApiOffline();
  if (!offline) return null;
  return (
    <div className="mb-4 flex items-start gap-2 rounded-xl border border-dashed bg-muted/40 px-3.5 py-2.5 text-xs text-muted-foreground">
      <WifiOff className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <span>
        API do Rooster Hub indisponível — exibindo dados locais de demonstração. Ao subir o backend NestJS em
        <code className="mx-1 rounded bg-background px-1 py-0.5">VITE_API_URL</code>, as telas passam a operar com dados reais.
      </span>
    </div>
  );
}

export function HubCrud<T extends { id: string }>({
  service,
  entityLabel,
  fields,
  columns,
  searchText,
  searchPlaceholder = "Pesquisar...",
  filters,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  pageSize = 10,
  emptyMessage,
  rowExtra,
}: {
  service: HubResource<T>;
  entityLabel: string;
  fields: HubField<T>[];
  columns: Column<T>[];
  searchText: (row: T) => string;
  searchPlaceholder?: string;
  filters?: ReactNode;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  pageSize?: number;
  emptyMessage?: string;
  rowExtra?: (row: T) => ReactNode;
}) {
  const { rows, loading, error, reload, create, update, remove } = useResource(service);
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<T | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toRemove, setToRemove] = useState<T | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => searchText(r).toLowerCase().includes(q));
  }, [rows, query, searchText]);

  function openCreate() {
    setForm(toForm(fields));
    setErrors({});
    setCreating(true);
  }

  function openEdit(row: T) {
    setForm(toForm(fields, row));
    setErrors({});
    setEditing(row);
  }

  function closeForm() {
    setCreating(false);
    setEditing(null);
    setSaving(false);
  }

  function validate(isCreate: boolean) {
    const next: Record<string, string> = {};
    for (const f of fields) {
      if (f.createOnly && !isCreate) continue;
      const value = (form[f.name] ?? "").trim();
      if (f.required && !value && f.type !== "boolean") {
        next[f.name] = `${f.label} é obrigatório`;
        continue;
      }
      if (value && f.validate) {
        const msg = f.validate(value);
        if (msg) next[f.name] = msg;
      }
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit() {
    const isCreate = creating;
    if (!validate(isCreate)) return;
    setSaving(true);
    try {
      const dto = toDto(fields, form, isCreate);
      if (isCreate) await create(dto);
      else if (editing) await update(editing.id, dto);
      closeForm();
      toast.success(isCreate ? `${entityLabel} criado com sucesso` : `${entityLabel} atualizado com sucesso`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Falha ao salvar";
      setErrors({ __form: message });
      setSaving(false);
      toast.error(message);
    }
  }

  const actionColumn: Column<T> = {
    key: "__actions",
    header: "",
    className: "w-24 text-right",
    cell: (row) => (
      <div className="flex items-center justify-end gap-1">
        {rowExtra?.(row)}
        {canEdit ? (
          <button
            type="button"
            aria-label={`Editar ${entityLabel}`}
            onClick={() => openEdit(row)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        ) : null}
        {canDelete ? (
          <button
            type="button"
            aria-label={`Excluir ${entityLabel}`}
            onClick={() => setToRemove(row)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    ),
  };

  const allColumns = canEdit || canDelete || rowExtra ? [...columns, actionColumn] : columns;
  const open = creating || editing !== null;

  return (
    <div>
      <OfflineBanner />
      <CrudToolbar
        search={query}
        onSearch={setQuery}
        placeholder={searchPlaceholder}
        filters={filters}
        trailing={
          <>
            <Btn onClick={() => void reload()}>
              <RefreshCw className="h-3.5 w-3.5" /> Atualizar
            </Btn>
            {canCreate ? (
              <Btn variant="solid" onClick={openCreate} tour="crud-novo">
                <Plus className="h-3.5 w-3.5" /> Novo
              </Btn>
            ) : null}
          </>
        }
      />

      {error ? (
        <div className="mb-4 rounded-xl border border-destructive/40 bg-destructive/5 px-3.5 py-2.5 text-xs text-destructive">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed py-14 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Carregando {entityLabel}...
        </div>
      ) : (
        <DataTable
          rows={filtered}
          columns={allColumns}
          pageSize={pageSize}
          emptyMessage={emptyMessage ?? `Nenhum registro de ${entityLabel}`}
        />
      )}

      <Modal
        open={open}
        onClose={closeForm}
        title={creating ? `Novo ${entityLabel}` : `Editar ${entityLabel}`}
        description={creating ? "Os campos seguem exatamente o contrato da API." : "Somente os campos alterados são enviados no PATCH."}
        footer={
          <>
            <Btn onClick={closeForm}>Cancelar</Btn>
            <Btn variant="solid" onClick={() => void submit()} tour="crud-salvar">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Salvar
            </Btn>
          </>
        }
      >
        <div className="grid gap-3.5 sm:grid-cols-2">
          {fields
            .filter((f) => (creating ? true : !f.createOnly))
            .map((f) => {
              const value = form[f.name] ?? "";
              const err = errors[f.name];
              const set = (v: string) => setForm((p) => ({ ...p, [f.name]: v }));
              return (
                <Field
                  key={f.name}
                  tour={`campo-${f.name}`}
                  label={f.label}
                  required={f.required}
                  hint={err ?? f.hint}
                  className={f.type === "textarea" ? "sm:col-span-2" : undefined}
                >
                  {f.type === "textarea" ? (
                    <TextArea value={value} onChange={(e) => set(e.target.value)} />
                  ) : f.type === "boolean" ? (
                    <SelectInput
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      options={[
                        { value: "true", label: "Sim" },
                        { value: "false", label: "Não" },
                      ]}
                    />
                  ) : f.type === "select" ? (
                    <SelectInput
                      value={value}
                      onChange={(e) => set(e.target.value)}
                      options={[{ value: "", label: "— Selecione —" }, ...(f.options ?? [])]}
                    />
                  ) : (
                    <TextInput
                      type={f.type === "password" ? "password" : f.type === "email" ? "email" : "text"}
                      value={value}
                      onChange={(e) => set(e.target.value)}
                    />
                  )}
                </Field>
              );
            })}
          {errors["__form"] ? (
            <p className="sm:col-span-2 text-xs text-destructive">{errors["__form"]}</p>
          ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={toRemove !== null}
        onClose={() => setToRemove(null)}
        onConfirm={() => {
          if (!toRemove) return;
          remove(toRemove.id)
            .then(() => toast.success(`${entityLabel} excluído com sucesso`))
            .catch((e: unknown) => toast.error(e instanceof Error ? e.message : "Falha ao excluir"));
        }}
        description={`O registro será removido definitivamente (DELETE ${service.path}/:id).`}
      />
    </div>
  );
}