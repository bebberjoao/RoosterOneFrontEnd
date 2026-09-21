import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { ticketService } from "@/services/mock-api";
import type { Ticket, TicketCategory } from "@/mock/database/tickets";
import {
  CrudHeader,
  TabBar,
  StatCard,
  SectionCard,
  ProgressBar,
  EmptyState,
  TONE,
} from "@/components/shared";
import { formatDate, relative } from "@/components/rooster/desk/mock-data";
import { StatusBadge, PriorityBadge, SlaBar } from "@/components/rooster/desk/badges";
import {
  Ticket as TicketIcon,
  PlayCircle,
  PauseCircle,
  CheckCircle2,
  Gauge,
  AlertTriangle,
  ArrowUpRight,
  ClipboardList,
  Timer,
} from "lucide-react";

export const Route = createFileRoute("/desk/")({
  component: DeskDashboard,
});

function DeskDashboard() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [categories, setCategories] = useState<TicketCategory[]>([]);
  const [tab, setTab] = useState("geral");
  const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
  const categoryColor = (id: string) => categories.find((c) => c.id === id)?.color ?? "oklch(0.6 0.1 260)";

  useEffect(() => {
    ticketService.getAll().then(setTickets);
    ticketService.getCategories().then(setCategories);
  }, []);

  const open = tickets.filter((t) => t.status === "aberto").length;
  const inProgress = tickets.filter((t) => t.status === "atendimento").length;
  const pending = tickets.filter((t) => t.status === "pendente").length;
  const resolved = tickets.filter((t) => t.status === "resolvido" || t.status === "encerrado").length;
  const avgSla = tickets.length ? Math.round(tickets.reduce((s, t) => s + t.slaPercent, 0) / tickets.length) : 0;

  const closedTickets = tickets.filter((t) => t.closedAt);
  const avgResolutionHours = closedTickets.length
    ? closedTickets.reduce((s, t) => s + (new Date(t.closedAt!).getTime() - new Date(t.openedAt).getTime()) / 3_600_000, 0) / closedTickets.length
    : null;
  const avgResolutionLabel =
    avgResolutionHours === null ? "—" : avgResolutionHours < 24 ? `${Math.round(avgResolutionHours)}h` : `${(avgResolutionHours / 24).toFixed(1)}d`;

  const latest = useMemo(() => [...tickets].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6), [tickets]);
  const critical = useMemo(
    () => tickets.filter((t) => t.priority === "critica" || t.slaPercent < 30).slice(0, 5),
    [tickets],
  );

  const byCategory = useMemo(
    () =>
      categories.map((c) => {
        const items = tickets.filter((t) => t.categoryId === c.id);
        const avg = items.length ? Math.round(items.reduce((s, t) => s + t.slaPercent, 0) / items.length) : 0;
        return { ...c, count: items.length, avgSla: avg };
      }),
    [categories, tickets],
  );

  return (
    <>
      <CrudHeader
        title="Central de atendimento"
        description="Visão em tempo real dos chamados e do SLA do Rooster Desk."
        actions={
          <Link
            to="/desk/tickets"
            search={{ new: true }}
            className="inline-flex items-center gap-2 rounded-lg bg-foreground px-3 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            Novo chamado <ArrowUpRight className="h-4 w-4" />
          </Link>
        }
      />

      <TabBar
        className="mb-5"
        value={tab}
        onChange={setTab}
        tabs={[
          { value: "geral", label: "Visão geral" },
          { value: "sla", label: "Relatório de SLA" },
        ]}
      />

      {tab === "geral" ? (
        <>
          <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Abertos" value={String(open)} icon={TicketIcon} tone={TONE.danger} />
            <StatCard label="Em atendimento" value={String(inProgress)} icon={PlayCircle} tone={TONE.info} />
            <StatCard label="Pendentes" value={String(pending)} icon={PauseCircle} tone={TONE.warn} />
            <StatCard label="Resolvidos" value={String(resolved)} icon={CheckCircle2} tone={TONE.ok} />
            <StatCard label="SLA médio" value={`${avgSla}%`} hint="meta 92%" icon={Gauge} tone={TONE.purple} />
            <StatCard
              label="Tempo médio de resolução"
              value={avgResolutionLabel}
              hint={closedTickets.length ? `${closedTickets.length} chamado(s) encerrado(s)` : "sem chamados encerrados"}
              icon={Timer}
              tone={TONE.cyan}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <SectionCard
              title="Últimos chamados"
              action={<Link to="/desk/tickets" className="text-xs font-medium text-muted-foreground hover:text-foreground">Ver todos</Link>}
            >
              {latest.length === 0 ? (
                <EmptyState icon={ClipboardList} title="Nenhum chamado" />
              ) : (
                <ul className="divide-y">
                  {latest.map((t) => (
                    <li key={t.id}>
                      <Link to="/desk/tickets/$id" params={{ id: t.id }} className="flex items-center gap-3 py-2.5 hover:bg-accent/40">
                        <span className="w-14 text-xs font-medium tabular-nums text-muted-foreground">{t.number}</span>
                        <span className="flex-1 truncate text-sm">{t.title}</span>
                        <span className="hidden text-[11px] font-medium md:inline" style={{ color: categoryColor(t.categoryId) }}>
                          {categoryName(t.categoryId).split(" ")[0]}
                        </span>
                        <PriorityBadge priority={t.priority} />
                        <StatusBadge status={t.status} />
                        <span className="hidden text-xs text-muted-foreground md:inline">{relative(t.updatedAt)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>

            <SectionCard title="Chamados críticos" description="Prioridade crítica ou SLA em risco">
              {critical.length === 0 ? (
                <EmptyState icon={AlertTriangle} title="Nenhum chamado crítico" />
              ) : (
                <ul className="divide-y">
                  {critical.map((t) => (
                    <li key={t.id}>
                      <Link to="/desk/tickets/$id" params={{ id: t.id }} className="block py-2.5 hover:bg-accent/40">
                        <div className="flex items-center justify-between gap-3">
                          <span className="truncate text-sm font-medium">{t.title}</span>
                          <PriorityBadge priority={t.priority} />
                        </div>
                        <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="tabular-nums">{t.number}</span>
                          <span>·</span>
                          <span className="truncate">{t.requester.name}</span>
                          <span className="ml-auto flex items-center gap-2">
                            <SlaBar percent={t.slaPercent} />
                            <span>{formatDate(t.openedAt)}</span>
                          </span>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
        </>
      ) : (
        <SectionCard title="SLA por categoria" description="Percentual médio de SLA restante e volume de chamados">
          {byCategory.length === 0 ? (
            <EmptyState icon={Gauge} title="Sem dados de categoria" />
          ) : (
            <ul className="space-y-3">
              {byCategory.map((c) => (
                <li key={c.id} className="flex items-center gap-3">
                  <span className="w-40 truncate text-sm" style={{ color: c.color }}>{c.name}</span>
                  <ProgressBar
                    className="flex-1"
                    value={c.avgSla}
                    tone={c.avgSla > 60 ? TONE.ok : c.avgSla > 30 ? TONE.warn : TONE.danger}
                  />
                  <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">{c.avgSla}%</span>
                  <span className="w-16 text-right text-xs text-muted-foreground">{c.count} chamado(s)</span>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      )}
    </>
  );
}
