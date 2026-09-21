import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ticketService } from "@/services/mock-api";
import type { Ticket, TicketCategory, TicketPriority } from "@/mock/database/tickets";
import {
  CrudHeader,
  CrudToolbar,
  Breadcrumbs,
  DataTable,
  type Column,
  Modal,
  Select,
  Btn,
  Field,
  TextInput,
  TextArea,
  SelectInput,
} from "@/components/shared";
import { STATUS_TONE, PRIORITY_LABEL, formatDate } from "@/components/rooster/desk/mock-data";
import type { TicketStatus } from "@/mock/database/tickets";
import { StatusBadge, PriorityBadge, SlaBar } from "@/components/rooster/desk/badges";
import { Plus } from "lucide-react";

const STATUS_CHIPS: { key: TicketStatus; label: string }[] = [
  { key: "aberto", label: "Em aberto" },
  { key: "atendimento", label: "Em andamento" },
  { key: "pendente", label: "Pausado" },
  { key: "resolvido", label: "Finalizado" },
  { key: "encerrado", label: "Aguardando terceiro" },
];

function fmtCount(n: number) {
  return n > 99 ? "99+" : String(n).padStart(2, "0");
}

function StatusFilterChips({
  status,
  onSelect,
  counts,
}: {
  status: string;
  onSelect: (s: string) => void;
  counts: Record<string, number>;
}) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const items = [{ key: "all", label: "Todos", tone: "oklch(0.62 0.02 260)" }, ...STATUS_CHIPS.map((c) => ({ key: c.key, label: c.label, tone: STATUS_TONE[c.key] }))];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      {items.map((it) => {
        const active = status === it.key;
        const count = it.key === "all" ? total : counts[it.key] ?? 0;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => onSelect(active ? "all" : it.key)}
            className="group relative overflow-hidden rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5"
            style={{
              borderColor: active ? it.tone : "color-mix(in oklch, var(--border) 60%, transparent)",
              background: active ? `color-mix(in oklch, ${it.tone} 14%, transparent)` : "transparent",
            }}
          >
            <span
              className="absolute inset-y-0 left-0 w-1"
              style={{ background: it.tone, opacity: active ? 1 : 0.5 }}
            />
            <div className="flex items-center justify-between pl-2">
              <span className="text-2xl font-semibold tabular-nums leading-none" style={{ color: it.tone }}>
                {fmtCount(count)}
              </span>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: it.tone }} />
            </div>
            <p className="mt-2 pl-2 text-xs font-medium text-foreground/80">{it.label}</p>
          </button>
        );
      })}
    </div>
  );
}

export const Route = createFileRoute("/desk/tickets")({
  validateSearch: (search: Record<string, unknown>) => ({ new: search.new === true || search.new === "true" ? true : undefined }) as { new?: boolean },
  component: TicketsRoute,
});

function TicketsRoute() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  if (pathname !== "/desk/tickets") return <Outlet />;
  return <TicketsList />;
}

function TicketsList() {
  const { new: openNewFromUrl } = Route.useSearch();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    ticketService.getAll().then(setTickets);
    ticketService.getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (openNewFromUrl) {
      setNewOpen(true);
      navigate({ to: "/desk/tickets", search: { new: false }, replace: true });
    }
  }, [openNewFromUrl, navigate]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const t of tickets) c[t.status] = (c[t.status] ?? 0) + 1;
    return c;
  }, [tickets]);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    return tickets.filter((t) => {
      if (cat !== "all" && t.categoryId !== cat) return false;
      if (status !== "all" && t.status !== status) return false;
      if (priority !== "all" && t.priority !== priority) return false;
      if (s && !`${t.number} ${t.title} ${t.requester.name}`.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [tickets, q, cat, status, priority]);

  const columns: Column<Ticket>[] = [
    { key: "number", header: "Nº", sortValue: (t) => t.number, cell: (t) => <span className="tabular-nums text-muted-foreground">{t.number}</span> },
    {
      key: "title",
      header: "Título",
      sortValue: (t) => t.title,
      cell: (t) => (
        <div>
          <div className="font-medium">{t.title}</div>
          <div className="text-xs text-muted-foreground">{t.subcategory}</div>
        </div>
      ),
    },
    { key: "category", header: "Categoria", sortValue: (t) => categoryName(t.categoryId), cell: (t) => <span className="text-xs">{categoryName(t.categoryId)}</span> },
    {
      key: "requester",
      header: "Solicitante",
      sortValue: (t) => t.requester.name,
      cell: (t) => (
        <div>
          <div>{t.requester.name}</div>
          <div className="text-xs text-muted-foreground">{t.requester.sector}</div>
        </div>
      ),
    },
    { key: "assignee", header: "Técnico", sortValue: (t) => t.assignee?.name ?? "", cell: (t) => t.assignee?.name ?? <span className="text-muted-foreground">—</span> },
    {
      key: "priority",
      header: "Prioridade",
      sortValue: (t) => ({ critica: 0, alta: 1, media: 2, baixa: 3 } as Record<string, number>)[t.priority] ?? 9,
      cell: (t) => <PriorityBadge priority={t.priority} />,
    },
    { key: "status", header: "Status", sortValue: (t) => t.status, cell: (t) => <StatusBadge status={t.status} /> },
    { key: "sla", header: "SLA", sortValue: (t) => t.slaPercent, cell: (t) => <SlaBar percent={t.slaPercent} /> },
    { key: "opened", header: "Aberto", sortValue: (t) => t.openedAt, cell: (t) => <span className="text-xs text-muted-foreground">{formatDate(t.openedAt)}</span> },
    { key: "updated", header: "Atualizado", sortValue: (t) => t.updatedAt, cell: (t) => <span className="text-xs text-muted-foreground">{formatDate(t.updatedAt)}</span> },
  ];

  return (
    <>
      <Breadcrumbs items={[{ label: "Rooster Desk" }, { label: "Chamados" }]} />
      <CrudHeader
        title="Chamados"
        description="Fila completa de tickets com filtros e ordenação."
        actions={
          <>
            <Btn variant="solid" onClick={() => setNewOpen(true)}>
              <Plus className="h-4 w-4" /> Novo chamado
            </Btn>
          </>
        }
      />

      <div className="mb-6">
        <StatusFilterChips status={status} onSelect={setStatus} counts={counts} />
      </div>

      <CrudToolbar
        search={q}
        onSearch={setQ}
        placeholder="Buscar por número, título ou solicitante"
        filters={
          <>
            <Select value={cat} onChange={setCat} options={[{ value: "all", label: "Todas categorias" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]} />
            <Select
              value={priority}
              onChange={setPriority}
              options={[{ value: "all", label: "Todas prioridades" }, ...Object.entries(PRIORITY_LABEL).map(([v, l]) => ({ value: v, label: l }))]}
            />
          </>
        }
      />

      <DataTable
        rows={filtered}
        columns={columns}
        onRowClick={(t) => navigate({ to: "/desk/tickets/$id", params: { id: t.id } })}
        emptyMessage="Nenhum chamado encontrado"
      />

      <NewTicketModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        categories={categories}
        onCreated={(t) => setTickets((prev) => [t, ...prev])}
      />
    </>
  );
}

function NewTicketModal({
  open,
  onClose,
  categories,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  categories: TicketCategory[];
  onCreated: (t: Ticket) => void;
}) {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("media");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const subs = useMemo(() => categories.find((c) => c.id === categoryId)?.subcategories ?? [], [categories, categoryId]);

  function reset() {
    setTitle("");
    setCategoryId("");
    setSubcategory("");
    setPriority("media");
    setDescription("");
  }

  async function handleSubmit() {
    if (!title.trim() || !categoryId) return;
    setSaving(true);
    try {
      const created = await ticketService.create({
        title,
        categoryId,
        subcategory: subcategory || "Geral",
        requester: { name: "Você", role: "Solicitante", sector: "Rooster Desk" },
        assignee: null,
        priority,
        status: "aberto",
        slaPercent: 100,
        slaDeadline: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
        openedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        description,
        tags: [],
        favorite: false,
      });
      onCreated(created);
      reset();
      onClose();
      toast.success("Chamado aberto com sucesso");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao abrir chamado");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Abrir novo chamado"
      description="Descreva o problema com o máximo de detalhes para agilizar a triagem."
      size="lg"
      footer={
        <>
          <Btn onClick={onClose}>Cancelar</Btn>
          <Btn variant="solid" onClick={handleSubmit}>{saving ? "Enviando..." : "Enviar chamado"}</Btn>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Título">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Descreva o problema em uma frase" />
        </Field>
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Categoria">
            <SelectInput
              value={categoryId}
              onChange={(e) => { setCategoryId(e.target.value); setSubcategory(""); }}
              options={[{ value: "", label: "Selecione" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
            />
          </Field>
          <Field label="Subcategoria">
            <SelectInput
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              options={[{ value: "", label: categoryId ? "Selecione" : "Selecione a categoria" }, ...subs.map((s) => ({ value: s, label: s }))]}
            />
          </Field>
          <Field label="Prioridade">
            <SelectInput
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
              options={Object.entries(PRIORITY_LABEL).map(([v, l]) => ({ value: v, label: l }))}
            />
          </Field>
        </div>
        <Field label="Descrição">
          <TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detalhe o comportamento observado, quando começou e o impacto na sua rotina."
            rows={6}
          />
        </Field>
      </div>
    </Modal>
  );
}

