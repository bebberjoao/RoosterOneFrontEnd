import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CrudHeader, CrudToolbar, Breadcrumbs, DataTable, type Column,
  Drawer, Modal, TabBar, Btn, Select, EmptyState, Field, TextInput, TextArea, SelectInput,
  SectionCard, StatCard, TONE, ConfirmDialog,
} from "@/components/shared";
import { useRole } from "@/components/rooster/role-context";
import { financeCan } from "@/components/rooster/finance/permissions";
import { useFinance } from "@/components/rooster/finance/store";
import { ChargeStatusBadge, BoletoStatusBadge, NfeStatusBadge, Avatar } from "@/components/rooster/finance/badges";
import {
  STUDENTS, studentById, brl, fmtDate, sum, PRODUCT_CATEGORIES, FREQ_LABEL,
  REVENUE_BY_MONTH, DEFAULT_RATE, CASHFLOW, ALERTS,
  type Tuition, type Product, type Service, type Discount,
} from "@/components/rooster/finance/mock-data";
import {
  Wallet, Package, Wrench, LineChart as LineChartIcon, Settings, Plus, Pencil, Trash2,
  Receipt, FileBarChart, FileText, TicketPercent, Building2, CreditCard, Bell, Percent,
  Search, AlertTriangle, Info, XCircle,
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export const Route = createFileRoute("/finance/manage")({
  head: () => ({
    meta: [
      { title: "Financeiro — Rooster Finance" },
      { name: "description", content: "Cobranças, produtos, serviços, relatórios e configurações do módulo financeiro." },
    ],
  }),
  component: FinanceManage,
});

const TABS = [
  { value: "charges", label: "Cobranças" },
  { value: "products", label: "Produtos" },
  { value: "services", label: "Serviços" },
  { value: "reports", label: "Relatórios" },
  { value: "settings", label: "Configurações" },
];

function FinanceManage() {
  const { role } = useRole();
  const [tab, setTab] = useState("charges");

  return (
    <div>
      <CrudHeader
        breadcrumbs={<Breadcrumbs items={[{ label: "Rooster One" }, { label: "Finance" }, { label: "Financeiro" }]} />}
        title="Financeiro"
        description="Gestão completa de cobranças, produtos, serviços, relatórios e configurações."
      />
      <TabBar tabs={TABS.filter((t) => canSeeTab(role, t.value))} value={tab} onChange={setTab} className="mb-4" />
      {tab === "charges" ? <ChargesTab /> : null}
      {tab === "products" ? <ProductsTab /> : null}
      {tab === "services" ? <ServicesTab /> : null}
      {tab === "reports" ? <ReportsTab /> : null}
      {tab === "settings" ? <SettingsTab /> : null}
    </div>
  );
}

function canSeeTab(role: ReturnType<typeof useRole>["role"], tab: string) {
  if (tab === "charges") return financeCan(role, "manageCharges");
  if (tab === "products") return financeCan(role, "manageProducts");
  if (tab === "services") return financeCan(role, "manageServices");
  if (tab === "reports") return financeCan(role, "viewReports");
  if (tab === "settings") return financeCan(role, "manageSettings");
  return false;
}

/* ------------------------------- Cobranças ------------------------------- */

const DETAIL_TABS = [
  { value: "detalhes", label: "Detalhes" },
  { value: "boleto", label: "Boleto" },
  { value: "nfe", label: "Nota Fiscal" },
  { value: "desconto", label: "Descontos/Bolsas" },
  { value: "historico", label: "Histórico" },
];

function ChargesTab() {
  const { role } = useRole();
  const { tuitions, updateTuition, paymentsOf, emitBoleto, markPaymentPaid, nfes, emitNfe, discounts } = useFinance();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");
  const [selected, setSelected] = useState<Tuition | null>(null);
  const [dtab, setDtab] = useState("detalhes");

  const canEdit = financeCan(role, "manageCharges");

  const filtered = useMemo(() => tuitions.filter((t) => {
    if (status !== "todos" && t.status !== status) return false;
    if (!q) return true;
    const s = studentById(t.studentId);
    return s?.name.toLowerCase().includes(q.toLowerCase()) ?? false;
  }), [tuitions, q, status]);

  const columns: Column<Tuition>[] = [
    {
      key: "aluno", header: "Aluno", sortValue: (t) => studentById(t.studentId)?.name ?? "",
      cell: (t) => {
        const s = studentById(t.studentId);
        return (
          <div className="flex items-center gap-3">
            <Avatar initials={s?.initials ?? "—"} />
            <div>
              <p className="font-medium">{s?.name}</p>
              <p className="text-[11px] text-muted-foreground">{s?.klass}</p>
            </div>
          </div>
        );
      },
    },
    { key: "comp", header: "Competência", sortValue: (t) => t.competence, cell: (t) => t.competence },
    { key: "venc", header: "Vencimento", sortValue: (t) => t.dueDate, cell: (t) => fmtDate(t.dueDate) },
    {
      key: "valor", header: "Valor", sortValue: (t) => t.value - t.discount + t.fine + t.interest,
      cell: (t) => <span className="font-medium">{brl(t.value - t.discount + t.fine + t.interest)}</span>,
    },
    { key: "status", header: "Situação", cell: (t) => <ChargeStatusBadge status={t.status} /> },
  ];

  const student = selected ? studentById(selected.studentId) : null;
  const tuitionPayments = selected ? paymentsOf(selected.studentId).filter((p) => p.chargeId === selected.id) : [];
  const tuitionNfe = selected ? nfes.filter((n) => n.studentId === selected.studentId && n.description.includes(selected.competence)) : [];
  const applicableDiscounts = discounts.filter((d) => d.active);

  const openDrawer = (t: Tuition) => { setSelected(t); setDtab("detalhes"); };

  return (
    <div>
      <CrudToolbar
        search={q}
        onSearch={setQ}
        placeholder="Buscar por aluno..."
        filters={
          <Select value={status} onChange={setStatus} options={[
            { value: "todos", label: "Todos os status" },
            { value: "pago", label: "Pago" },
            { value: "aberto", label: "Em aberto" },
            { value: "atrasado", label: "Atrasado" },
            { value: "negociado", label: "Negociado" },
            { value: "cancelado", label: "Cancelado" },
          ]} />
        }
      />

      {filtered.length === 0 ? (
        <EmptyState icon={Receipt} title="Nenhuma cobrança encontrada" description="Ajuste a pesquisa ou os filtros aplicados." />
      ) : (
        <DataTable rows={filtered} columns={columns} onRowClick={openDrawer} pageSize={8} emptyMessage="Nenhuma cobrança encontrada" />
      )}

      {selected && student ? (
        <Drawer
          open={!!selected}
          onClose={() => setSelected(null)}
          title={student.name}
          subtitle={`${selected.competence} · ${student.klass}`}
        >
          <TabBar tabs={DETAIL_TABS} value={dtab} onChange={setDtab} className="mb-4" />

          {dtab === "detalhes" ? (
            <div className="space-y-2">
              <Row label="Aluno" value={student.name} />
              <Row label="Matrícula" value={student.registration} />
              <Row label="Competência" value={selected.competence} />
              <Row label="Parcela" value={selected.installment} />
              <Row label="Vencimento" value={fmtDate(selected.dueDate)} />
              <Row label="Valor" value={brl(selected.value)} />
              <Row label="Desconto" value={selected.discount > 0 ? `- ${brl(selected.discount)}` : "—"} />
              <Row label="Juros/Multa" value={selected.fine + selected.interest > 0 ? `+ ${brl(selected.fine + selected.interest)}` : "—"} />
              <Row label="Total" value={<strong>{brl(selected.value - selected.discount + selected.fine + selected.interest)}</strong>} />
              <Row label="Situação" value={<ChargeStatusBadge status={selected.status} />} />
              {canEdit ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selected.status !== "pago" ? (
                    <Btn variant="solid" onClick={() => updateTuition(selected.id, { status: "pago", paid: selected.value - selected.discount, paidAt: new Date().toISOString().slice(0, 10) })}>
                      Marcar como pago
                    </Btn>
                  ) : null}
                  {selected.status !== "cancelado" ? (
                    <Btn onClick={() => updateTuition(selected.id, { status: "cancelado" })}>Cancelar cobrança</Btn>
                  ) : null}
                  {selected.status === "atrasado" ? (
                    <Btn onClick={() => updateTuition(selected.id, { status: "negociado" })}>Negociar</Btn>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {dtab === "boleto" ? (
            <div className="space-y-3">
              {tuitionPayments.length === 0 ? (
                <EmptyState icon={FileBarChart} title="Nenhum boleto emitido" description="Emita um boleto para esta cobrança." />
              ) : (
                <ul className="space-y-2">
                  {tuitionPayments.map((p) => (
                    <li key={p.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-mono text-xs">{p.ourNumber}</p>
                        <p className="text-xs text-muted-foreground">Venc. {fmtDate(p.dueDate)} · {brl(p.value)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <BoletoStatusBadge status={p.status} />
                        {canEdit && p.status !== "pago" ? (
                          <Btn onClick={() => markPaymentPaid(p.id)}>Marcar pago</Btn>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {canEdit ? (
                <Btn variant="solid" onClick={() => emitBoleto(selected)}>Emitir novo boleto</Btn>
              ) : null}
            </div>
          ) : null}

          {dtab === "nfe" ? (
            <div className="space-y-3">
              {tuitionNfe.length === 0 ? (
                <EmptyState icon={FileText} title="Nenhuma nota fiscal emitida" />
              ) : (
                <ul className="space-y-2">
                  {tuitionNfe.map((n) => (
                    <li key={n.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-mono text-xs">{n.number}</p>
                        <p className="text-xs text-muted-foreground">{fmtDate(n.issuedAt)} · {brl(n.value)}</p>
                      </div>
                      <NfeStatusBadge status={n.status} />
                    </li>
                  ))}
                </ul>
              )}
              {canEdit ? (
                <Btn variant="solid" onClick={() => emitNfe({
                  number: `NFS-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
                  type: "servico", studentId: selected.studentId,
                  description: `Mensalidade ${selected.competence}`, value: selected.value - selected.discount,
                  issuedAt: new Date().toISOString().slice(0, 10), status: "emitida",
                })}>
                  Emitir nota fiscal
                </Btn>
              ) : null}
            </div>
          ) : null}

          {dtab === "desconto" ? (
            <div className="space-y-3">
              {student.scholarship ? (
                <div className="rounded-lg border bg-muted/30 p-3 text-sm">Bolsa/desconto ativo: <strong>{student.scholarship}</strong></div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma bolsa ativa para este aluno.</p>
              )}
              <p className="text-xs font-medium text-muted-foreground">Regras disponíveis na instituição</p>
              <ul className="space-y-2">
                {applicableDiscounts.map((d) => (
                  <li key={d.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <span>{d.name}</span>
                    <span className="text-muted-foreground">{d.unit === "percent" ? `${d.value}%` : brl(d.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {dtab === "historico" ? (
            <ol className="relative space-y-4 border-l pl-5">
              <li className="relative">
                <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background" style={{ background: "var(--foreground)" }} />
                <p className="text-sm">Cobrança gerada para {selected.competence}</p>
                <p className="text-xs text-muted-foreground">Vencimento em {fmtDate(selected.dueDate)}</p>
              </li>
              {tuitionPayments.map((p) => (
                <li key={p.id} className="relative">
                  <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background" style={{ background: "var(--foreground)" }} />
                  <p className="text-sm">Boleto {p.ourNumber} — {p.status}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(p.paidAt ?? p.emittedAt)}</p>
                </li>
              ))}
              {selected.paidAt ? (
                <li className="relative">
                  <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background" style={{ background: "var(--foreground)" }} />
                  <p className="text-sm">Pagamento confirmado</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(selected.paidAt)}</p>
                </li>
              ) : null}
            </ol>
          ) : null}
        </Drawer>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

/* -------------------------------- Produtos -------------------------------- */

function ProductForm({ open, onClose, product, onSubmit }: {
  open: boolean; onClose: () => void; product?: Product;
  onSubmit: (dto: Omit<Product, "id">) => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [code, setCode] = useState(product?.code ?? "");
  const [category, setCategory] = useState(product?.category ?? PRODUCT_CATEGORIES[0]);
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(String(product?.price ?? 0));
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [minStock, setMinStock] = useState(String(product?.minStock ?? 0));
  const [unit, setUnit] = useState(product?.unit ?? "un");

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={product ? "Editar produto" : "Novo produto"} size="lg"
      footer={<>
        <Btn onClick={onClose}>Cancelar</Btn>
        <Btn variant="solid" onClick={() => {
          onSubmit({
            name, code, category, description, price: Number(price) || 0,
            stock: Number(stock) || 0, minStock: Number(minStock) || 0, unit,
            cover: product?.cover ?? "oklch(0.62 0.18 155)", active: product?.active ?? true,
            updatedAt: new Date().toISOString().slice(0, 10),
          });
          onClose();
        }}>Salvar</Btn>
      </>}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Nome *"><TextInput value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Código *"><TextInput value={code} onChange={(e) => setCode(e.target.value)} /></Field>
        <Field label="Categoria"><SelectInput value={category} onChange={(e) => setCategory(e.target.value)} options={PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c }))} /></Field>
        <Field label="Unidade"><TextInput value={unit} onChange={(e) => setUnit(e.target.value)} /></Field>
        <Field label="Preço"><TextInput type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <Field label="Estoque"><TextInput type="number" value={stock} onChange={(e) => setStock(e.target.value)} /></Field>
        <Field label="Estoque mínimo"><TextInput type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} /></Field>
        <Field label="Descrição" className="sm:col-span-2"><TextArea value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function ProductsTab() {
  const { role } = useRole();
  const { products, createProduct, updateProduct, deleteProduct } = useFinance();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("todas");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Product | undefined>();
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const canCreate = financeCan(role, "manageProducts");

  const items = useMemo(() => products.filter((p) => {
    if (cat !== "todas" && p.category !== cat) return false;
    if (!q) return true;
    return p.name.toLowerCase().includes(q.toLowerCase()) || p.code.toLowerCase().includes(q.toLowerCase());
  }), [products, q, cat]);

  const columns: Column<Product>[] = [
    { key: "name", header: "Produto", sortValue: (p) => p.name, cell: (p) => (<div><p className="font-medium">{p.name}</p><p className="text-[11px] text-muted-foreground">{p.code}</p></div>) },
    { key: "cat", header: "Categoria", cell: (p) => p.category },
    { key: "price", header: "Preço", sortValue: (p) => p.price, cell: (p) => brl(p.price) },
    { key: "stock", header: "Estoque", sortValue: (p) => p.stock, cell: (p) => `${p.stock} ${p.unit}` },
    { key: "status", header: "Status", cell: (p) => (p.active ? <span className="text-xs text-muted-foreground">Ativo</span> : <span className="text-xs text-destructive">Inativo</span>) },
  ];

  return (
    <div>
      <CrudToolbar
        search={q} onSearch={setQ} placeholder="Buscar por nome ou código..."
        filters={<Select value={cat} onChange={setCat} options={[{ value: "todas", label: "Todas categorias" }, ...PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c }))]} />}
        trailing={canCreate ? <Btn variant="solid" onClick={() => { setEditing(undefined); setFormOpen(true); }}><Plus className="h-4 w-4" /> Novo produto</Btn> : null}
      />
      {items.length === 0 ? (
        <EmptyState icon={Package} title="Nenhum produto encontrado" />
      ) : (
        <DataTable rows={items} columns={columns} pageSize={8}
          onRowClick={canCreate ? (p) => { setEditing(p); setFormOpen(true); } : undefined} />
      )}
      <ProductForm open={formOpen} onClose={() => setFormOpen(false)} product={editing}
        onSubmit={(dto) => (editing ? updateProduct(editing.id, dto) : createProduct(dto))} />
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteProduct(toDelete.id)}
        title="Excluir produto" description={`O produto "${toDelete?.name}" será removido.`} />
    </div>
  );
}

/* -------------------------------- Serviços -------------------------------- */

function ServiceForm({ open, onClose, service, onSubmit }: {
  open: boolean; onClose: () => void; service?: Service;
  onSubmit: (dto: Omit<Service, "id">) => void;
}) {
  const [name, setName] = useState(service?.name ?? "");
  const [category, setCategory] = useState(service?.category ?? "Taxa");
  const [description, setDescription] = useState(service?.description ?? "");
  const [price, setPrice] = useState(String(service?.price ?? 0));
  const [frequency, setFrequency] = useState(service?.frequency ?? "unico");

  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={service ? "Editar serviço" : "Novo serviço"}
      footer={<>
        <Btn onClick={onClose}>Cancelar</Btn>
        <Btn variant="solid" onClick={() => {
          onSubmit({ name, category, description, price: Number(price) || 0, frequency: frequency as Service["frequency"], active: service?.active ?? true, updatedAt: new Date().toISOString().slice(0, 10) });
          onClose();
        }}>Salvar</Btn>
      </>}
    >
      <div className="grid gap-3">
        <Field label="Nome *"><TextInput value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Categoria"><TextInput value={category} onChange={(e) => setCategory(e.target.value)} /></Field>
        <Field label="Frequência"><SelectInput value={frequency} onChange={(e) => setFrequency(e.target.value as Service["frequency"])} options={Object.entries(FREQ_LABEL).map(([k, v]) => ({ value: k, label: v }))} /></Field>
        <Field label="Valor"><TextInput type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></Field>
        <Field label="Descrição"><TextArea value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
      </div>
    </Modal>
  );
}

function ServicesTab() {
  const { role } = useRole();
  const { services, createService, updateService, deleteService } = useFinance();
  const [q, setQ] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | undefined>();
  const [toDelete, setToDelete] = useState<Service | null>(null);
  const canCreate = financeCan(role, "manageServices");

  const rows = services.filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()));

  const columns: Column<Service>[] = [
    { key: "name", header: "Serviço", sortValue: (s) => s.name, cell: (s) => (<div><p className="font-medium">{s.name}</p><p className="text-[11px] text-muted-foreground">{s.category}</p></div>) },
    { key: "freq", header: "Frequência", cell: (s) => FREQ_LABEL[s.frequency] },
    { key: "price", header: "Valor", sortValue: (s) => s.price, cell: (s) => brl(s.price) },
    { key: "updated", header: "Atualizado", sortValue: (s) => s.updatedAt, cell: (s) => fmtDate(s.updatedAt) },
  ];

  return (
    <div>
      <CrudToolbar search={q} onSearch={setQ} placeholder="Buscar serviço..."
        trailing={canCreate ? <Btn variant="solid" onClick={() => { setEditing(undefined); setFormOpen(true); }}><Plus className="h-4 w-4" /> Novo serviço</Btn> : null}
      />
      {rows.length === 0 ? (
        <EmptyState icon={Wrench} title="Nenhum serviço encontrado" />
      ) : (
        <DataTable rows={rows} columns={columns} pageSize={8}
          onRowClick={canCreate ? (s) => { setEditing(s); setFormOpen(true); } : undefined} />
      )}
      <ServiceForm open={formOpen} onClose={() => setFormOpen(false)} service={editing}
        onSubmit={(dto) => (editing ? updateService(editing.id, dto) : createService(dto))} />
      <ConfirmDialog open={!!toDelete} onClose={() => setToDelete(null)}
        onConfirm={() => toDelete && deleteService(toDelete.id)}
        title="Excluir serviço" description={`O serviço "${toDelete?.name}" será removido.`} />
    </div>
  );
}

/* -------------------------------- Relatórios -------------------------------- */

function ReportsTab() {
  const { tuitions } = useFinance();
  const previsto = sum(tuitions.map((t) => t.value - t.discount));
  const recebido = sum(tuitions.filter((t) => t.status === "pago").map((t) => t.paid));
  const pendente = previsto - recebido;

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-3">
        <StatCard label="Receita prevista" value={brl(previsto)} icon={Wallet} tone={TONE.info} />
        <StatCard label="Recebido" value={brl(recebido)} icon={Wallet} tone={TONE.ok} />
        <StatCard label="A receber" value={brl(pendente)} icon={Wallet} tone={TONE.danger} />
      </div>

      <SectionCard className="mt-4" title="Receita mensal" description="Previsto vs recebido — 2026">
        <div className="h-64">
          <ResponsiveContainer>
            <AreaChart data={REVENUE_BY_MONTH}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 260)" />
              <XAxis dataKey="m" fontSize={11} />
              <YAxis fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => brl(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="prev" name="Previsto" stroke="oklch(0.6 0.18 260)" fill="oklch(0.6 0.18 260)" fillOpacity={0.15} strokeWidth={2} />
              <Area type="monotone" dataKey="rec" name="Recebido" stroke="oklch(0.62 0.18 155)" fill="oklch(0.62 0.18 155)" fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Alertas financeiros" description="Itens que exigem atenção.">
          <div className="space-y-3">
            {ALERTS.map((a) => {
              const tone = a.kind === "danger" ? TONE.danger : a.kind === "warning" ? TONE.warn : TONE.info;
              const Icon = a.kind === "danger" ? XCircle : a.kind === "warning" ? AlertTriangle : Info;
              return (
                <div key={a.id} className="flex gap-3 rounded-lg border bg-background/40 p-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `color-mix(in oklab, ${tone} 12%, transparent)`, color: tone }}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{a.description}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
        <SectionCard title="Inadimplência" description="Evolução mensal (%)">
          <div className="h-56">
            <ResponsiveContainer>
              <AreaChart data={DEFAULT_RATE}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.9 0.01 260)" />
                <XAxis dataKey="m" fontSize={11} />
                <YAxis fontSize={11} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v: number) => `${v}%`} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Area type="monotone" dataKey="v" stroke="oklch(0.6 0.22 25)" fill="oklch(0.6 0.22 25)" fillOpacity={0.15} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

/* -------------------------------- Configurações -------------------------------- */

const SETTINGS_CARDS = [
  { icon: Building2, title: "Dados da instituição", desc: "CNPJ, razão social, endereço fiscal e responsáveis financeiros." },
  { icon: CreditCard, title: "Integração bancária", desc: "Contas, convênios, carteiras e credenciais para emissão de boletos e PIX." },
  { icon: FileText, title: "Integração fiscal", desc: "Provedores de NFS-e e NF-e, certificados digitais A1/A3 e séries." },
  { icon: Percent, title: "Regras padrão", desc: "Juros, multa por atraso, descontos de pontualidade e vencimentos padrão." },
  { icon: Bell, title: "Notificações", desc: "Régua de cobrança por e-mail, SMS e push antes e depois do vencimento." },
];

function SettingsTab() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {SETTINGS_CARDS.map((c) => (
        <button key={c.title} className="group text-left rounded-2xl border bg-card p-5 shadow-sm transition-all hover:shadow-md">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: "color-mix(in oklab, oklch(0.62 0.18 155) 12%, transparent)", color: "oklch(0.62 0.18 155)" }}>
            <c.icon className="h-5 w-5" />
          </span>
          <h3 className="mt-3 text-sm font-semibold">{c.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{c.desc}</p>
        </button>
      ))}
    </div>
  );
}
