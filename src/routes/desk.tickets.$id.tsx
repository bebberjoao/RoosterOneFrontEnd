import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ticketService, type ApiMensagemChamado, type TicketMessage } from "@/services/mock-api";
import { toTicketMessage } from "@/services/mock-api/ticket.service";
import { useTicketSocket } from "@/hooks/use-ticket-socket";
import { Breadcrumbs } from "@/components/shared";
import { getApiUserId } from "@/services/http";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  categoryColor,
  formatDate,
  STATUS_LABEL,
  type TicketEvent,
} from "@/components/rooster/desk/mock-data";
import type { Ticket } from "@/mock/database/tickets";
import { StatusBadge, PriorityBadge, SlaBar } from "@/components/rooster/desk/badges";
import {
  ArrowLeft,
  Paperclip,
  Send,
  Lock,
  UserCog,
  Tag as TagIcon,
  ArrowLeftRight,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Clock,
  AlertTriangle,
  Wifi,
  WifiOff,
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
  const ticket = Route.useLoaderData() as Ticket;
  const navigate = useNavigate();
  const meuId = getApiUserId();
  const isRequester = ticket.requesterId === meuId;
  // Aproximação: quem não é o solicitante vê as ações de atendimento (a API
  // segue sendo a autoridade — nota interna de quem não pode vira 403).
  const souEquipe = !isRequester;

  const [mensagens, setMensagens] = useState<TicketMessage[]>([]);
  const [carregandoMensagens, setCarregandoMensagens] = useState(true);
  const [carregandoMais, setCarregandoMais] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [texto, setTexto] = useState("");
  const [interno, setInterno] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [encerrando, setEncerrando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let ativo = true;
    setCarregandoMensagens(true);
    ticketService.getMessages(ticket.id).then(({ mensagens: pagina, proximoCursor }) => {
      if (!ativo) return;
      setMensagens(pagina);
      setCursor(proximoCursor);
      setCarregandoMensagens(false);
    });
    return () => {
      ativo = false;
    };
  }, [ticket.id]);

  const { conectado } = useTicketSocket(ticket.id, (payload) => {
    const nova = toTicketMessage(payload as ApiMensagemChamado);
    setMensagens((prev) => (prev.some((m) => m.id === nova.id) ? prev : [...prev, nova]));
  });

  useEffect(() => {
    timelineRef.current?.scrollTo({ top: timelineRef.current.scrollHeight, behavior: "smooth" });
  }, [mensagens.length]);

  async function carregarMensagensAntigas() {
    if (!cursor || carregandoMais) return;
    setCarregandoMais(true);
    const { mensagens: pagina, proximoCursor } = await ticketService.getMessages(ticket.id, cursor);
    setMensagens((prev) => [...pagina, ...prev]);
    setCursor(proximoCursor);
    setCarregandoMais(false);
  }

  async function enviarMensagem() {
    const conteudo = texto.trim();
    if (!conteudo || enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      const nova = await ticketService.sendMessage(ticket.id, conteudo, interno);
      setMensagens((prev) => (prev.some((m) => m.id === nova.id) ? prev : [...prev, nova]));
      setTexto("");
      setInterno(false);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível enviar a mensagem.");
    } finally {
      setEnviando(false);
    }
  }

  async function encerrarChamado() {
    if (encerrando) return;
    setEncerrando(true);
    setErro(null);
    try {
      await ticketService.closeTicket(ticket.id);
      navigate({ to: "/desk/tickets" });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível encerrar o chamado.");
      setEncerrando(false);
    }
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
            <span style={{ color: categoryColor(ticket.categoryId) }}>{ticket.categoryName ?? "Sem categoria"} / {ticket.subcategory}</span>
          </div>
        </div>
        {souEquipe ? (
          <div className="flex flex-wrap items-center gap-2">
            {!ticket.assigneeId ? <Button variant="outline" size="sm" className="gap-1.5" onClick={() => ticketService.assign(ticket.id, getApiUserId() ?? "").then(() => navigate({ to: "/desk/tickets" }))}><UserCog className="h-4 w-4" /> Assumir atendimento</Button> : null}
            <QuickSelect label="Categoria" options={[[ticket.categoryId, ticket.categoryName ?? "Sem categoria"]]} defaultValue={ticket.categoryId} />
            <QuickSelect label="Subcategoria" options={[[ticket.subcategory, ticket.subcategory]]} defaultValue={ticket.subcategory} />
            <Button size="sm" className="gap-1.5 bg-foreground text-background hover:opacity-90" onClick={encerrarChamado} disabled={encerrando}>
              <XCircle className="h-4 w-4" /> {encerrando ? "Encerrando..." : "Encerrar"}
            </Button>
          </div>
        ) : null}
      </div>

      {erro ? (
        <p className="mb-4 flex items-center gap-1.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5" /> {erro}
        </p>
      ) : null}

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
              <span className="text-sm">{ticket.categoryName ?? "Sem categoria"}</span>
              <div className="text-xs text-muted-foreground">{ticket.subcategory}</div>
            </Field>
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
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Lock className="h-3.5 w-3.5" /> Conversa do chamado
              </span>
              <span className={`inline-flex items-center gap-1 text-[11px] ${conectado ? "text-emerald-600" : "text-muted-foreground"}`}>
                {conectado ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {conectado ? "ao vivo" : "reconectando..."}
              </span>
            </div>
          </div>

          <div ref={timelineRef} className="max-h-[540px] space-y-5 overflow-y-auto px-5 py-5">
            <p className="rounded-lg bg-muted/40 p-3 text-sm text-foreground/90">{ticket.description}</p>

            {cursor ? (
              <button
                type="button"
                onClick={carregarMensagensAntigas}
                disabled={carregandoMais}
                className="mx-auto block text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground disabled:opacity-50"
              >
                {carregandoMais ? "Carregando..." : "Carregar mensagens anteriores"}
              </button>
            ) : null}

            {carregandoMensagens ? (
              <p className="text-center text-xs text-muted-foreground">Carregando conversa...</p>
            ) : mensagens.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground">Nenhuma mensagem ainda. Comece a conversa abaixo.</p>
            ) : (
              mensagens.map((m) => (
                <TimelineEvent
                  key={m.id}
                  event={{
                    kind: "message",
                    author: m.autor,
                    role: m.autorId === ticket.requesterId ? "solicitante" : "tecnico",
                    body: m.texto,
                    at: m.criadoEm,
                    internal: m.interno,
                  }}
                />
              ))
            )}
          </div>

          <Separator />

          <div className="p-4">
            <Textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder={interno ? "Nota interna (visível apenas para a equipe)" : "Escreva uma mensagem para o chamado..."}
              className="min-h-[110px] resize-none border-border/60 bg-background"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  enviarMensagem();
                }
              }}
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="gap-1.5" disabled title="Upload de anexo ainda não implementado">
                  <Paperclip className="h-4 w-4" /> Anexar
                </Button>
                {souEquipe ? (
                  <button
                    type="button"
                    onClick={() => setInterno((v) => !v)}
                    className={`ml-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors ${
                      interno ? "bg-yellow-500/15 text-yellow-700" : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    <Lock className="h-3 w-3" /> Interno
                  </button>
                ) : null}
              </div>
              <Button size="sm" className="gap-1.5 bg-foreground text-background hover:opacity-90" onClick={enviarMensagem} disabled={enviando || !texto.trim()}>
                <Send className="h-4 w-4" /> {enviando ? "Enviando..." : "Enviar"}
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