import { useEffect, useState } from "react";
import { Btn } from "@/components/rooster/student/ui";
import { Field, Modal, inputCls } from "./ui";
import { SelectInput } from "@/components/shared";
import { HUB_SECTORS, hubUsersOfSector } from "./hub-directory";
import { LOCATIONS, CONDITION_META, STATUS_META, type Asset, type AssetCondition, type AssetStatus } from "./mock-data";
import { useAssets } from "./store";

export type AssetDraft = Omit<Asset, "id" | "createdAt">;

const empty = (categoryId: string): AssetDraft => ({
  name: "",
  tag: "",
  categoryId,
  brand: "",
  model: "",
  serial: "",
  location: LOCATIONS[0],
  sector: "",
  owner: "",
  status: "disponivel",
  condition: "novo",
  acquiredAt: new Date().toISOString().slice(0, 10),
  value: 0,
  notes: "",
  photo: "",
});

export function AssetFormModal({
  open,
  onClose,
  asset,
  defaults,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  asset?: Asset;
  defaults?: Partial<AssetDraft>;
  onSubmit: (draft: AssetDraft) => void | Promise<unknown>;
}) {
  const { categories } = useAssets();
  const [draft, setDraft] = useState<AssetDraft>(empty(categories[0]?.id ?? ""));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Entrou a partir de uma categoria: trava o campo para o item não cair em outra.
  const lockCategory = !asset && !!defaults?.categoryId;

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSaving(false);
    if (asset) {
      const { id: _id, createdAt: _c, ...rest } = asset;
      setDraft(rest);
    } else {
      setDraft({ ...empty(categories[0]?.id ?? ""), ...defaults });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, asset, categories, JSON.stringify(defaults ?? {})]);

  const set = <K extends keyof AssetDraft>(k: K, v: AssetDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  const valid = draft.name.trim() && draft.tag.trim() && draft.categoryId;

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={asset ? "Editar patrimônio" : "Cadastrar patrimônio"}
      description="Preencha as informações do bem. Campos com * são obrigatórios."
      footer={
        <>
          <Btn onClick={onClose}>Cancelar</Btn>
          <Btn
            variant="solid"
            onClick={async () => {
              if (!valid || saving) return;
              setSaving(true);
              setError(null);
              try {
                await onSubmit(draft);
                onClose();
              } catch (err) {
                setError(err instanceof Error ? err.message : "Não foi possível salvar o item.");
              } finally {
                setSaving(false);
              }
            }}
            className={valid && !saving ? "" : "pointer-events-none opacity-50"}
          >
            {saving ? "Salvando..." : asset ? "Salvar alterações" : "Cadastrar"}
          </Btn>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {error ? (
          <div className="sm:col-span-2 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {error}
          </div>
        ) : null}
        <div className="sm:col-span-2">
          <Field label="Nome *">
            <input className={inputCls} value={draft.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex.: Notebook Dell Latitude" />
          </Field>
        </div>
        <Field label="Número de patrimônio *">
          <input className={inputCls} value={draft.tag} onChange={(e) => set("tag", e.target.value)} placeholder="PAT-000000" />
        </Field>
        <Field label="Categoria *" hint={lockCategory ? "Definida pela categoria em que você está." : undefined}>
          <SelectInput
            className={inputCls}
            value={draft.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
            disabled={lockCategory}
          />
        </Field>
        <Field label="Marca">
          <input className={inputCls} value={draft.brand} onChange={(e) => set("brand", e.target.value)} />
        </Field>
        <Field label="Modelo">
          <input className={inputCls} value={draft.model} onChange={(e) => set("model", e.target.value)} />
        </Field>
        <Field label="Número de série">
          <input className={inputCls} value={draft.serial} onChange={(e) => set("serial", e.target.value)} />
        </Field>
        <Field label="Localização" hint="Integração futura com o Rooster Rooms.">
          <SelectInput className={inputCls} value={draft.location} onChange={(e) => set("location", e.target.value)} options={LOCATIONS.map((l) => ({ value: l, label: l }))} />
        </Field>
        <Field label="Setor vinculado" hint="Somente setores cadastrados no Rooster Hub.">
          <SelectInput className={inputCls} value={draft.sector} onChange={(e) => set("sector", e.target.value)} options={[{ value: "", label: "Sem setor vinculado" }, ...HUB_SECTORS.map((s) => ({ value: s.name, label: s.name }))]} />
        </Field>
        <Field label="Usuário responsável">
          <SelectInput className={inputCls} value={draft.owner} onChange={(e) => set("owner", e.target.value)} options={[{ value: "", label: "Não atribuído" }, ...hubUsersOfSector(draft.sector).map((u) => ({ value: u.name, label: `${u.name} · ${u.email}` }))]} />
        </Field>
        <Field label="Situação">
          <SelectInput className={inputCls} value={draft.status} onChange={(e) => set("status", e.target.value as AssetStatus)} options={Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: v.label }))} />
        </Field>
        <Field label="Estado de conservação">
          <SelectInput className={inputCls} value={draft.condition} onChange={(e) => set("condition", e.target.value as AssetCondition)} options={Object.entries(CONDITION_META).map(([k, v]) => ({ value: k, label: v.label }))} />
        </Field>
        <Field label="Data de aquisição">
          <input type="date" className={inputCls} value={draft.acquiredAt.slice(0, 10)} onChange={(e) => set("acquiredAt", e.target.value)} />
        </Field>
        <Field label="Valor de aquisição (R$)">
          <input type="number" min={0} className={inputCls} value={draft.value} onChange={(e) => set("value", Number(e.target.value))} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Foto (URL opcional)">
            <input className={inputCls} value={draft.photo ?? ""} onChange={(e) => set("photo", e.target.value)} placeholder="https://..." />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Observações">
            <textarea rows={3} className={inputCls} value={draft.notes ?? ""} onChange={(e) => set("notes", e.target.value)} />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
