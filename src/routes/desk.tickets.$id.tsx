import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ticketService } from "@/services/mock-api";
import { Breadcrumbs } from "@/components/shared";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  formatDate,
  STATUS_LABEL,
  PRIORITY_LABEL,
  type TicketEvent,
} from "@/components/rooster/desk/mock-data";
import type { Ticket, TicketCategory } from "@/mock/database/tickets";
import { StatusBadge, PriorityBadge, SlaBar } from "@/components/rooster/desk/badges";
import {
  ArrowLeft,
  Paperclip,
  Send,
  Lock,
  MessageCircle,
  UserCog,
  Tag as TagIcon,
  ArrowLeftRight,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Clock,
  
} from "lucide-react";

export const Route = createFileRoute("/desk/tickets/$id")({
  loader: async ({ params }) => {
    const ticket = await ticketService.getById(params.id);
    if (!ticket) throw notFound();
    return ticket;
  },
  notFoundComponent: () => (
    <div className="rounded-xl border border-border/60 bg-card p-8 text-center">
      <p className="text-sm text-muted-foreground">Chamado não encontrado.</p>
      <Link to="/desk/tickets" className="mt-2 inline-block text-sm font-medium text-foreground underline">Voltar para a lista</Link>
    </div>
  ),
  component: TicketDetail,
});

function TicketDetail() {
  const initial = Route.useLoaderData() as Ticket;
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(initial);
  const [tab, setTab] = useState<"public" | "internal">("public");
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [agents, setAgents] = useState<Array<{ id: string; name: string }>>([]);
  const [transferOpen, setTransferOpen] = useState(false);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
  const categoryColor = (id: string) => categories.find((c) => c.id === id)?.color ?? "oklch(0.6 0.1 260)";

  useEffect(() => {
    ticketService.getAgentsWithIds().then(setAgents).catch(() => setAgents([]));
    ticketService.getCategories().then(setCategories).catch(() => setCategories([]));
  }, []);

  async function reload() {
    const fresh = await ticketService.getById(ticket.id);
    if (fresh) setTicket(fresh);
  }

  async function handleTransfer(tecnicoId: string) {
    setTransferOpen(false);
    await ticketService.assignTicket(ticket.id, tecnicoId);
    await reload();
  }

  async function handleSend() {
    if (!reply.trim()) return;
    setSending(true);
    try {
      await ticketService.sendMessage(ticket.id, reply.trim(), tab === "internal");
      setReply("");
      await reload();
    } finally {
      setSending(false);
    }
  }

  async function changeStatus(status: Ticket["status"]) {
    await ticketService.update(ticket.id, { status });
    await reload();
  }

  return (
    <>
      <Breadcrumbs
        items={[
          { label: "Rooster Desk" },
          { label: "Chamados", onClick: () => navigate({ to: "/desk/tickets" }) },
          { label: ticket.number },
        ]}
      />

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{ticket.title}</h1>
            
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span className="tabular-nums">{ticket.number}</span>
            <span>·</span>
            <span>Aberto {formatDate(ticket.openedAt)}</span>
            <span>·</span>
            <span style={{ color: categoryColor(ticket.categoryId) }}>{categoryName(ticket.categoryId)} / {ticket.subcategory}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {transferOpen ? (
            <Select onValueChange={handleTransfer}>
              <SelectTrigger className="h-8 w-48 text-xs"><SelectValue placeholder="Escolher técnico" /></SelectTrigger>
              <SelectContent>
                {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          ) : (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setTransferOpen(true)}><UserCog className="h-4 w-4" /> Transferir</Button>
          )}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => changeStatus("resolvido")}><CheckCircle2 className="h-4 w-4" /> Registrar solução</Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => changeStatus("aberto")}><RotateCcw className="h-4 w-4" /> Reabrir</Button>
          <Button size="sm" className="gap-1.5 bg-foreground text-background hover:opacity-90" onClick={() => changeStatus("encerrado")}><XCircle className="h-4 w-4" /> Encerrar</Button>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className="space-y-4">
          <SidebarCard title="Detalhes">
            <Field label="Status"><StatusBadge status={ticket.status} /></Field>
            <Field label="Prioridade"><PriorityBadge priority={ticket.priority} /></Field>
            <Field label="SLA">
              <div className="flex items-center gap-2">
                <SlaBar percent={ticket.slaPercent} />
                <span className="text-xs text-muted-foreground">até {formatDate(ticket.slaDeadline)}</span>
              </div>
            </Field>
            <Field label="Categoria">
              <span className="text-sm">{categoryName(ticket.categoryId)}</span>
              <div className="text-xs text-muted-foreground">{ticket.subcategory}</div>
            </Field>
          </SidebarCard>

          <SidebarCard title="Ações rápidas">
            <QuickSelect label="Alterar status" options={Object.entries(STATUS_LABEL)} defaultValue={ticket.status} />
            <QuickSelect label="Alterar prioridade" options={Object.entries(PRIORITY_LABEL)} defaultValue={ticket.priority} />
            <QuickSelect label="Alterar categoria" options={categories.map((c) => [c.id, c.name])} defaultValue={ticket.categoryId} />
          </SidebarCard>

          <SidebarCard title="Pessoas">
            <Person label="Solicitante" name={ticket.requester.name} sub={`${ticket.requester.role} · ${ticket.requester.sector}`} />
            <Person label="Técnico" name={ticket.assignee?.name ?? "Não atribuído"} sub={ticket.assignee?.role ?? "Aguardando triagem"} />
          </SidebarCard>

          {ticket.tags.length > 0 && (
            <SidebarCard title="Etiquetas">
              <div className="flex flex-wrap gap-1.5">
                {ticket.tags.map((tag: string) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs">
                    <TagIcon className="h-3 w-3" /> {tag}
                  </span>
                ))}
              </div>
            </SidebarCard>
          )}
        </aside>

        {/* Timeline */}
        <section className="rounded-xl border border-border/60 bg-card">
          <div className="border-b border-border/60 px-5 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setTab("public")}
                className={"rounded-md px-2.5 py-1 text-xs font-medium " + (tab === "public" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                <MessageCircle className="mr-1 inline h-3.5 w-3.5" /> Conversa
              </button>
              <button
                onClick={() => setTab("internal")}
                className={"rounded-md px-2.5 py-1 text-xs font-medium " + (tab === "internal" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                <Lock className="mr-1 inline h-3.5 w-3.5" /> Comentários internos
              </button>
            </div>
          </div>

          <div className="max-h-[540px] space-y-5 overflow-y-auto px-5 py-5">
            <p className="rounded-lg bg-muted/40 p-3 text-sm text-foreground/90">{ticket.description}</p>
            {ticket.events
              .filter((e: TicketEvent) => (tab === "internal" ? e.kind === "message" && e.internal : !(e.kind === "message" && e.internal)))
              .map((e: TicketEvent, i: number) => (
                <TimelineEvent key={i} event={e} />
              ))}
          </div>

          <Separator />

          <div className="p-4">
            <Textarea
              value={reply}
              onChange={(ev) => setReply(ev.target.value)}
              placeholder={tab === "internal" ? "Comentário interno (visível apenas para a equipe)" : "Responder ao solicitante..."}
              className="min-h-[110px] resize-none border-border/60 bg-background"
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="gap-1.5"><Paperclip className="h-4 w-4" /> Anexar</Button>
                {tab === "internal" && (
                  <span className="ml-1 inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                    <Lock className="h-3 w-3" /> Interno
                  </span>
                )}
              </div>
              <Button size="sm" className="gap-1.5 bg-foreground text-background hover:opacity-90" disabled={sending || !reply.trim()} onClick={handleSend}>
                <Send className="h-4 w-4" /> {sending ? "Enviando…" : "Enviar"}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function SidebarCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      {children}
    </div>
  );
}

function Person({ label, name, sub }: { label: string; name: string; sub: string }) {
  const initials = name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div>
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">{initials}</span>
        <div>
          <div className="text-sm font-medium">{name}</div>
          <div className="text-xs text-muted-foreground">{sub}</div>
        </div>
      </div>
    </div>
  );
}

function QuickSelect({ label, options, defaultValue }: { label: string; options: [string, string][]; defaultValue: string }) {
  return (
    <div>
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <Select defaultValue={defaultValue}>
        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>
          {options.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

function TimelineEvent({ event }: { event: TicketEvent }) {
  if (event.kind === "message") {
    const isTech = event.role === "tecnico";
    const initials = event.author.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
    return (
      <div className="flex gap-3">
        <span
          className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-full text-xs font-medium"
          style={{
            backgroundColor: event.internal
              ? "color-mix(in oklab, oklch(0.72 0.14 90) 15%, transparent)"
              : isTech
              ? "color-mix(in oklab, oklch(0.6 0.18 260) 15%, transparent)"
              : "var(--muted)",
            color: event.internal ? "oklch(0.55 0.14 90)" : isTech ? "oklch(0.5 0.18 260)" : "var(--foreground)",
          }}
        >
          {initials}
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-foreground">{event.author}</span>
            <span className="text-muted-foreground">{isTech ? "Técnico" : event.role === "coordenador" ? "Coordenador" : "Solicitante"}</span>
            {event.internal && (
              <span className="inline-flex items-center gap-1 rounded-md bg-yellow-500/10 px-1.5 py-0.5 text-[10px] font-medium text-yellow-600">
                <Lock className="h-2.5 w-2.5" /> Interno
              </span>
            )}
            <span className="ml-auto text-muted-foreground">{formatDate(event.at)}</span>
          </div>
          <div
            className={
              "mt-1 rounded-lg p-3 text-sm " +
              (event.internal ? "border border-yellow-500/20 bg-yellow-500/5" : "bg-muted/40")
            }
          >
            {event.body}
          </div>
        </div>
      </div>
    );
  }
  const meta = eventMeta(event);
  return (
    <div className="flex items-center gap-3 text-xs text-muted-foreground">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-muted">
        <meta.icon className="h-3.5 w-3.5" />
      </span>
      <span className="flex-1">
        <span className="font-medium text-foreground">{event.author}</span> {meta.text}
      </span>
      <span>{formatDate(event.at)}</span>
    </div>
  );
}

function eventMeta(e: TicketEvent) {
  if (e.kind === "status") return { icon: Clock, text: `alterou o status de ${STATUS_LABEL[e.from]} para ${STATUS_LABEL[e.to]}` };
  if (e.kind === "priority") return { icon: TagIcon, text: `alterou a prioridade de ${PRIORITY_LABEL[e.from]} para ${PRIORITY_LABEL[e.to]}` };
  if (e.kind === "assign") return { icon: UserCog, text: `atribuiu o chamado a ${e.to}` };
  if (e.kind === "category") return { icon: ArrowLeftRight, text: `alterou a categoria para ${e.to}` };
  return { icon: Clock, text: "" };
}