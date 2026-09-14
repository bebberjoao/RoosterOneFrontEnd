import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CrudHeader, DataTable, type Column,
  Drawer, ConfirmDialog, TabBar, Btn, Select, EmptyState, Field, TextArea, SelectInput,
  Modal, TextInput,
} from "@/components/shared";
import { AssetStatusBadge, CategoryChip, ConditionBadge, MovementBadge } from "@/components/rooster/assets/ui";
import { AssetFormModal } from "@/components/rooster/assets/asset-form";
import { useAssets } from "@/components/rooster/assets/store";
import { HUB_SECTORS, HUB_USERS, hubUsersOfSector } from "@/components/rooster/assets/hub-directory";
import {
  LOCATIONS, PEOPLE, STATUS_META, MOVEMENT_META,
  fmtDate, fmtDateTime, money, type Asset, type MovementType,
} from "@/components/rooster/assets/mock-data";
import { assetsCan } from "@/components/rooster/assets/permissions";
import { ROLE_META, useRole } from "@/components/rooster/role-context";
import {
  Boxes, Plus, Pencil, Trash2, Image as ImageIcon, Building2, Tags, ChevronRight, User, Link2,
} from "lucide-react";

export const Route = createFileRoute("/assets/inventory")({
  head: () => ({
    meta: [
      { title: "Patrimônios — Rooster Assets" },
      { name: "description", content: "Categorias de patrimônio, itens cadastrados e vínculo de setor e responsável." },
      { property: "og:title", content: "Patrimônios — Rooster Assets" },
      { property: "og:description", content: "Gerencie o inventário por categoria e vincule setor e responsável a cada item." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InventoryPage,
});

function targetOptions(type: MovementType) {
  if (type === "setor") return HUB_SECTORS.map((s) => s.name);
  if (type === "emprestimo") return HUB_USERS.map((u) => u.name);
  return LOCATIONS;
}

const TABS = [
  { value: "info", label: "Informações gerais" },
  { value: "vinculo", label: "Setor e responsável" },
  { value: "mov", label: "Movimentações" },
  { value: "hist", label: "Histórico" },
  { value: "foto", label: "Foto" },
];

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

function Crumb({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function NavCard({
  icon: Icon, title, subtitle, meta, badge, onOpen, onEdit, onDelete,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: React.ReactNode;
  onOpen: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="group relative rounded-2xl border bg-card p-4 transition-colors hover:border-foreground/20">
      <button type="button" onClick={onOpen} className="flex w-full items-start gap-3 text-left">
        <span className="rounded-xl border bg-muted/40 p-2 text-muted-foreground"><Icon className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate text-sm font-semibold">{title}</span>
            {badge}
          </span>
          {subtitle ? <span className="mt-0.5 block truncate text-xs text-muted-foreground">{subtitle}</span> : null}
          {meta ? <span className="mt-2 block text-[11px] text-muted-foreground">{meta}</span> : null}
        </span>
        <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
      </button>
      {(onEdit || onDelete) ? (
        <div className="absolute right-3 top-3 hidden gap-1 group-hover:flex">
          {onEdit ? (
            <button onClick={onEdit} aria-label="Editar" className="rounded-md border bg-card p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          ) : null}
          {onDelete ? (
            <button onClick={onDelete} aria-label="Excluir" className="rounded-md border bg-card p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

const TONES = [
  "oklch(0.55 0.19 265)", "oklch(0.68 0.14 195)", "oklch(0.6 0.2 305)", "oklch(0.68 0.18 40)",
  "oklch(0.72 0.14 90)", "oklch(0.62 0.18 155)", "oklch(0.65 0.18 25)", "oklch(0.65 0.05 260)",
];

function InventoryPage() {
  const { role } = useRole();
  const {
    assets, categories, categoryName, categoryTone,
    createAsset, updateAsset, deleteAsset, movementsOf, registerMovement,
    createCategory, updateCategory, deleteCategory,
  } = useAssets();
  const me = ROLE_META[role].person.name;

  // Navegação: categorias -> itens
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");
  const [condition, setCondition] = useState("todas");
  const [sectorFilter, setSectorFilter] = useState("todos");

  const [selected, setSelected] = useState<Asset | null>(null);
  const [tab, setTab] = useState("info");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | undefined>();
  const [toDelete, setToDelete] = useState<Asset | null>(null);

  const [catModal, setCatModal] = useState<{ open: boolean; editingId?: string }>({ open: false });
  const [catForm, setCatForm] = useState({ name: "", description: "", tone: TONES[0] });
  const [catToDelete, setCatToDelete] = useState<string | null>(null);

  const [mType, setMType] = useState<MovementType>("sala");
  const [mTo, setMTo] = useState(LOCATIONS[0]);
  const [mNotes, setMNotes] = useState("");

  const canCreate = assetsCan(role, "create");
  const canEdit = assetsCan(role, "edit");
  const canDelete = assetsCan(role, "delete");
  const canMove = assetsCan(role, "move");
  const canManage = assetsCan(role, "manageCategories");

  const category = categoryId ? categories.find((c) => c.id === categoryId) ?? null : null;
  const level: "categories" | "assets" = category ? "assets" : "categories";

  const match = (s: string) => !q || s.toLowerCase().includes(q.toLowerCase());

  const listed = useMemo(() => {
    if (!category) return [];
    return assets.filter((a) => {
      if (a.categoryId !== category.id) return false;
      if (status !== "todos" && a.status !== status) return false;
      if (condition !== "todas" && a.condition !== condition) return false;
      if (sectorFilter === "sem" && a.sector) return false;
      if (sectorFilter !== "todos" && sectorFilter !== "sem" && a.sector !== sectorFilter) return false;
      return match([a.name, a.tag, a.brand, a.model, a.serial, a.owner, a.location, a.sector].join(" "));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, category, status, condition, sectorFilter, q]);

  const columns: Column<Asset>[] = [
    {
      key: "name", header: "Item", sortValue: (a) => a.name,
      cell: (a) => (<div><p className="font-medium">{a.name}</p><p className="text-[11px] text-muted-foreground">{a.tag} · {a.brand} {a.model}</p></div>),
    },
    {
      key: "sector", header: "Setor vinculado", sortValue: (a) => a.sector ?? "",
      cell: (a) => a.sector
        ? <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Building2 className="h-3.5 w-3.5" /> {a.sector}</span>
        : <span className="text-xs text-muted-foreground/70">Sem setor vinculado</span>,
    },
    {
      key: "owner", header: "Responsável", sortValue: (a) => a.owner,
      cell: (a) => a.owner
        ? <span className="inline-flex items-center gap-1.5 text-muted-foreground"><User className="h-3.5 w-3.5" /> {a.owner}</span>
        : <span className="text-xs text-muted-foreground/70">Não atribuído</span>,
    },
    { key: "loc", header: "Localização", sortValue: (a) => a.location, cell: (a) => <span className="text-muted-foreground">{a.location}</span> },
    { key: "status", header: "Situação", sortValue: (a) => a.status, cell: (a) => <AssetStatusBadge status={a.status} /> },
    { key: "cond", header: "Conservação", sortValue: (a) => a.condition, cell: (a) => <ConditionBadge condition={a.condition} /> },
    { key: "value", header: "Valor", sortValue: (a) => a.value, cell: (a) => <span className="whitespace-nowrap text-muted-foreground">{money(a.value)}</span> },
  ];

  const openDrawer = (a: Asset) => {
    setSelected(a);
    setTab("info");
    setMType("sala");
    setMTo(LOCATIONS[0]);
    setMNotes("");
  };

  const changeMType = (t: MovementType) => {
    setMType(t);
    setMTo(targetOptions(t)[0]);
  };

  const asset = selected ? assets.find((a) => a.id === selected.id) ?? selected : null;
  const history = asset ? movementsOf(asset.id) : [];

  const startCategory = (id?: string) => {
    const c = id ? categories.find((x) => x.id === id) : undefined;
    setCatForm({ name: c?.name ?? "", description: c?.description ?? "", tone: c?.tone ?? TONES[0] });
    setCatModal({ open: true, editingId: id });
  };

  const saveCategory = async () => {
    const name = catForm.name.trim();
    if (!name) return;
    if (catModal.editingId) await updateCategory(catModal.editingId, { name, description: catForm.description, tone: catForm.tone });
    else await createCategory({ name, description: catForm.description, tone: catForm.tone });
    setCatModal({ open: false });
  };

  return (
    <div>
      <CrudHeader
        title="Patrimônios"
        description="Escolha a categoria do item (computador, tela, impressora...) para ver os itens cadastrados e vincular setor e responsável."
        actions={
          level === "categories" ? (
            canManage ? <Btn variant="solid" onClick={() => startCategory()}><Plus className="h-4 w-4" /> Nova categoria</Btn> : undefined
          ) : canCreate ? (
            <Btn variant="solid" onClick={() => { setEditing(undefined); setFormOpen(true); }}>
              <Plus className="h-4 w-4" /> Novo item
            </Btn>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-1.5 text-sm">
        <Crumb active={level === "categories"} onClick={() => { setCategoryId(null); setQ(""); }}>
          <Tags className="h-3.5 w-3.5" /> Categorias
        </Crumb>
        {category ? (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <Crumb active onClick={() => undefined}><Boxes className="h-3.5 w-3.5" /> {category.name}</Crumb>
          </>
        ) : null}
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={level === "categories" ? "Buscar categoria" : "Buscar item, patrimônio, série, setor..."}
          className="w-full max-w-sm rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
        {level === "assets" ? (
          <>
            <Select
              value={sectorFilter}
              onChange={setSectorFilter}
              options={[
                { value: "todos", label: "Todos os setores" },
                { value: "sem", label: "Sem setor vinculado" },
                ...HUB_SECTORS.map((s) => ({ value: s.name, label: s.name })),
              ]}
            />
            <Select value={status} onChange={setStatus} options={[{ value: "todos", label: "Todas as situações" }, ...Object.entries(STATUS_META).map(([k, v]) => ({ value: k, label: v.label }))]} />
            <Select value={condition} onChange={setCondition} options={[{ value: "todas", label: "Toda conservação" }, { value: "novo", label: "Novo" }, { value: "bom", label: "Bom" }, { value: "regular", label: "Regular" }, { value: "ruim", label: "Ruim" }, { value: "inservivel", label: "Inservível" }]} />
          </>
        ) : null}
      </div>

      {level === "categories" ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {categories.filter((c) => match(`${c.name} ${c.description ?? ""}`)).map((c) => {
            const list = assets.filter((a) => a.categoryId === c.id);
            const linked = list.filter((a) => a.sector).length;
            return (
              <NavCard
                key={c.id}
                icon={Tags}
                title={c.name}
                subtitle={c.description}
                meta={`${list.length} itens · ${linked} com setor vinculado`}
                badge={<CategoryChip name={c.name} tone={c.tone} />}
                onOpen={() => { setCategoryId(c.id); setQ(""); setStatus("todos"); setCondition("todas"); setSectorFilter("todos"); }}
                onEdit={canManage ? () => startCategory(c.id) : undefined}
                onDelete={canManage && list.length === 0 ? () => setCatToDelete(c.id) : undefined}
              />
            );
          })}
          {categories.length === 0 ? <EmptyState icon={Tags} title="Nenhuma categoria cadastrada" description="Cadastre categorias como Computadores, Telas ou Impressoras." /> : null}
        </div>
      ) : null}

      {level === "assets" && category ? (
        listed.length === 0 ? (
          <EmptyState icon={Boxes} title="Nenhum item encontrado" description="Ajuste a pesquisa/filtros ou cadastre um novo item nesta categoria." />
        ) : (
          <DataTable rows={listed} columns={columns} onRowClick={openDrawer} pageSize={8} emptyMessage="Nenhum item encontrado" />
        )
      ) : null}

      <AssetFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        asset={editing}
        defaults={!editing && category ? { categoryId: category.id } : undefined}
        onSubmit={(draft) => (editing ? updateAsset(editing.id, draft) : createAsset(draft))}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={() => { if (toDelete) { deleteAsset(toDelete.id); setSelected(null); } }}
        title="Excluir item"
        description={`O patrimônio "${toDelete?.name}" será removido permanentemente do inventário.`}
      />

      <ConfirmDialog
        open={!!catToDelete}
        onClose={() => setCatToDelete(null)}
        onConfirm={() => { if (catToDelete) { deleteCategory(catToDelete); setCategoryId(null); } }}
        title="Excluir categoria"
        description="A categoria será removida permanentemente."
      />

      <Modal
        open={catModal.open}
        onClose={() => setCatModal({ open: false })}
        title={catModal.editingId ? "Editar categoria" : "Nova categoria"}
        description="Categorias classificam os itens do patrimônio (computadores, telas, impressoras...)."
        footer={<><Btn onClick={() => setCatModal({ open: false })}>Cancelar</Btn><Btn variant="solid" onClick={saveCategory}>Salvar</Btn></>}
      >
        <div className="space-y-4">
          <Field label="Nome *"><TextInput value={catForm.name} onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ex.: Computadores" /></Field>
          <Field label="Descrição"><TextInput value={catForm.description} onChange={(e) => setCatForm((f) => ({ ...f, description: e.target.value }))} /></Field>
          <Field label="Cor de identificação">
            <div className="flex flex-wrap gap-2">
              {TONES.map((t) => (
                <button
                  key={t}
                  onClick={() => setCatForm((f) => ({ ...f, tone: t }))}
                  className="h-7 w-7 rounded-lg border-2 transition-transform hover:scale-105"
                  style={{ background: t, borderColor: catForm.tone === t ? "var(--foreground)" : "transparent" }}
                  aria-label={`Cor ${t}`}
                />
              ))}
            </div>
          </Field>
        </div>
      </Modal>

      {asset ? (
        <Drawer
          open={!!selected}
          onClose={() => setSelected(null)}
          title={asset.name}
          subtitle={`${asset.tag} · ${asset.brand} ${asset.model}`}
          actions={
            <>
              {canEdit ? <Btn onClick={() => { setEditing(asset); setFormOpen(true); }}><Pencil className="h-4 w-4" /> Editar</Btn> : null}
              {canDelete ? <Btn className="text-destructive" onClick={() => setToDelete(asset)}><Trash2 className="h-4 w-4" /> Excluir</Btn> : null}
            </>
          }
        >
          <TabBar tabs={TABS} value={tab} onChange={setTab} className="mb-4" />

          {tab === "info" ? (
            <div>
              <Row label="Nome" value={asset.name} />
              <Row label="Nº de patrimônio" value={asset.tag} />
              <Row label="Categoria" value={<CategoryChip name={categoryName(asset.categoryId)} tone={categoryTone(asset.categoryId)} />} />
              <Row label="Marca" value={asset.brand || "—"} />
              <Row label="Modelo" value={asset.model || "—"} />
              <Row label="Número de série" value={asset.serial || "—"} />
              <Row label="Estado de conservação" value={<ConditionBadge condition={asset.condition} />} />
              <Row label="Situação" value={<AssetStatusBadge status={asset.status} />} />
              <Row label="Localização" value={asset.location} />
              <Row label="Data de aquisição" value={fmtDate(asset.acquiredAt)} />
              <Row label="Valor de aquisição" value={money(asset.value)} />
              {asset.notes ? <p className="mt-4 rounded-lg border bg-muted/30 p-3 text-sm text-muted-foreground">{asset.notes}</p> : null}
            </div>
          ) : null}

          {tab === "vinculo" ? (
            <div className="space-y-4">
              <div>
                <Row label="Setor vinculado" value={asset.sector || "Sem setor vinculado"} />
                <Row label="Responsável" value={asset.owner || "Não atribuído"} />
              </div>
              {canEdit ? (
                <div className="space-y-3 rounded-xl border p-3">
                  <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Link2 className="h-3.5 w-3.5" /> Vincular este item
                  </p>
                  <Field label="Setor (cadastrados no Rooster Hub)">
                    <SelectInput
                      value={asset.sector ?? ""}
                      onChange={(e) => updateAsset(asset.id, { sector: e.target.value })}
                      options={[{ value: "", label: "Sem setor vinculado" }, ...HUB_SECTORS.map((s) => ({ value: s.name, label: s.name }))]}
                    />
                  </Field>
                  <Field label="Usuário responsável" hint="Usuários do setor selecionado aparecem primeiro.">
                    <SelectInput
                      value={asset.owner ?? ""}
                      onChange={(e) => updateAsset(asset.id, { owner: e.target.value })}
                      options={[{ value: "", label: "Não atribuído" }, ...hubUsersOfSector(asset.sector).map((u) => ({ value: u.name, label: `${u.name} · ${u.email}` }))]}
                    />
                  </Field>
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === "mov" ? (
            <div className="space-y-4">
              {canMove ? (
                <div className="space-y-3 rounded-xl border p-3">
                  <p className="text-xs font-medium text-muted-foreground">Registrar nova movimentação</p>
                  <Field label="Tipo de movimentação *">
                    <SelectInput value={mType} onChange={(e) => changeMType(e.target.value as MovementType)}
                      options={Object.entries(MOVEMENT_META).map(([k, v]) => ({ value: k, label: v.label }))} />
                  </Field>
                  <Field label={mType === "setor" ? "Novo setor *" : mType === "emprestimo" ? "Emprestado para *" : "Destino *"}>
                    <SelectInput value={mTo} onChange={(e) => setMTo(e.target.value)} options={targetOptions(mType).map((o) => ({ value: o, label: o }))} />
                  </Field>
                  <Field label="Observações">
                    <TextArea rows={3} value={mNotes} onChange={(e) => setMNotes(e.target.value)} placeholder="Detalhes da movimentação..." />
                  </Field>
                  <Btn variant="solid" onClick={async () => { await registerMovement({ assetId: asset.id, type: mType, to: mTo, notes: mNotes, user: me }); setMNotes(""); }}>
                    Registrar movimentação
                  </Btn>
                </div>
              ) : null}
            </div>
          ) : null}

          {tab === "hist" ? (
            history.length === 0 ? (
              <EmptyState icon={Boxes} title="Sem movimentações registradas" />
            ) : (
              <ol className="relative space-y-4 border-l pl-5">
                {history.map((m) => (
                  <li key={m.id} className="relative">
                    <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background" style={{ background: "var(--foreground)" }} />
                    <div className="flex flex-wrap items-center gap-2">
                      <MovementBadge type={m.type} />
                      <span className="text-xs text-muted-foreground">{fmtDateTime(m.date)} · {m.user}</span>
                    </div>
                    <p className="mt-1 text-sm">{m.from ? `${m.from} → ` : ""}{m.to}</p>
                    {m.notes ? <p className="text-xs text-muted-foreground">{m.notes}</p> : null}
                  </li>
                ))}
              </ol>
            )
          ) : null}

          {tab === "foto" ? (
            <div className="overflow-hidden rounded-xl border bg-muted/30">
              {asset.photo ? (
                <img src={asset.photo} alt={`Foto de ${asset.name}`} loading="lazy" className="h-56 w-full object-cover" />
              ) : (
                <div className="flex h-56 w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-xs">Sem foto cadastrada</span>
                </div>
              )}
            </div>
          ) : null}
        </Drawer>
      ) : null}
    </div>
  );
}
